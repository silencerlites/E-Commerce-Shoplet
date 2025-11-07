

import { NotFoundError, ValidationError } from "@packages/error-handler";
import prisma from "@packages/libs/prisma";
import redis from "@packages/libs/redis";
import { NextFunction, Request, Response } from "express";
import crypto from "crypto";
import Stripe from "stripe";
import { Prisma } from "@prisma/client";
import { sendEmail } from "../utils/send-mail";




const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-06-30.basil" });

//  create payment intent
export const createPaymentIntent = async (req: any, res: Response, next: NextFunction) => {
    try {
        let { amount, sellerStripeAccountId, sessionId } = req.body;

        const numericAmount = Number(amount);
        if (!numericAmount || isNaN(numericAmount)) {
            return next(new ValidationError("Invalid amount"));
        }

        if (!sellerStripeAccountId) {
            return next(new ValidationError("Missing seller Stripe account ID"));
        }

        const customerAmount = Math.round(numericAmount * 100);
        const platformFee = Math.floor(customerAmount * 0.1);

        const paymentIntent = await stripe.paymentIntents.create({
            amount: customerAmount,
            currency: "usd",
            payment_method_types: ["card"],
            application_fee_amount: platformFee,
            transfer_data: { destination: sellerStripeAccountId },
            metadata: {
                sessionId,
                userId: req.user.id,
            },
        });

        return res.json({
            clientSecret: paymentIntent.client_secret,
        });
    } catch (error) {
        console.error("Stripe createPaymentIntent error:", error);
        next(error);
    }
};

// create payment session
export const createPaymentSession = async (req: any, res: Response, next: NextFunction) => {
    try {
        const { cart, selectedAddressId, coupon } = req.body
        const userId = req.user.id;

        if (!cart || !Array.isArray(cart) || cart.length === 0) {
            return next(new ValidationError("Cart is empty or invalid"));
        }

        const normalizedCart = JSON.stringify(cart.map((item: any) => ({
            id: item.id,
            quantity: item.quantity,
            sale_price: item.sale_price,
            shopId: item.shopId,
            selectedOptions: item.selectedOptions || {}
        })).sort((a, b) => a.id.localeCompare(b.id))
        );

        const keys = await redis.keys("payment-session:*");
        for (const key of keys) {
            const data = await redis.get(key);
            if (data) {
                const session = JSON.parse(data);
                if (session.userId === userId) {
                    const existingCart = JSON.stringify(
                        session.cart.map((item: any) => ({
                            id: item.id,
                            quantity: item.quantity,
                            sale_price: item.sale_price,
                            shopId: item.shopId,
                            selectedOptions: item.selectedOptions || {}
                        })).sort((a: any, b: any) => a.id.localeCompare(b.id))
                    );

                    if (existingCart === normalizedCart) {
                        return res.status(200).json({ sessionId: key.split(":")[1] });
                    } else {
                        await redis.del(key);
                    }
                }
            }
        }

        // 1. Get all unique shop IDs from the cart
        const uniqueShopIds = [...new Set(cart.map((item: any) => item.shopId))];

        // 2. Fetch shops with their related sellers
        const shops = await prisma.shops.findMany({
            where: {
                id: { in: uniqueShopIds },
            },
            select: {
                id: true,
                sellerId: true,
                sellers: { // ✅ assuming relation is named `sellers`
                    select: {
                        stripeId: true,
                    },
                },
            },
        });

        // 3. Map each shop to include its seller and Stripe info
        const sellerData = shops.map((shop) => ({
            shopId: shop.id,
            sellerId: shop.sellerId,
            stripeAccountId: shop.sellers?.stripeId || null, // ✅ direct relation
        }));

        // Optional: Filter out any that don't have Stripe connected
        const validSellerData = sellerData.filter((s) => s.stripeAccountId);

        console.log("✅ Seller data:", validSellerData);


        // calculate total
        const totalAmount = cart.reduce((total: number, item: any) => {
            return total + item.quantity * item.sale_price;
        }, 0);

        // create session payload
        const sessionId = crypto.randomUUID();

        const sessionData = {
            userId,
            cart,
            sellers: sellerData,
            totalAmount,
            shippingAddressId: selectedAddressId || null,
            coupon: coupon || null,
        };

        await redis.set(
            `payment-session:${sessionId}`,
            JSON.stringify(sessionData),
            "EX",
            600 // 10 minutes
        );

        return res.status(201).json({ sessionId });

    } catch (error) {
        next(error);
    }
}

// Verifying payment session
export const verifyingPaymentSession = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const sessionId = req.query.sessionId as string;
        if (!sessionId) {
            return res.status(400).json({ message: "Session id is missing" });
        }

        // Fetch session from redis
        const sessionKey = `payment-session:${sessionId}`;
        const sessionData = await redis.get(sessionKey);

        if (!sessionData) {
            return res.status(404).json({ message: "Session not found or expired" });
        }

        // Parse and return session
        const session = JSON.parse(sessionData);

        return res.status(200).json({
            success: true,
            session,
        })
    } catch (error) {
        return next(error);
    }
}

// create order 
export const createOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const stripeSignature = req.headers["stripe-signature"];
        if (!stripeSignature) {
            return res.status(400).json({ message: "Stripe signature is missing" });
        }

        const rawBody = (req as any).rawBody;

        let event;
        try {
            event = stripe.webhooks.constructEvent(
                rawBody,
                stripeSignature,
                process.env.STRIPE_WEBHOOK_SECRET!
            );
        } catch (err: any) {
            console.error("Webhook signature verification failed. ", err.message);
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }

        if (event.type === "payment_intent.succeeded") {
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            const sessionId = paymentIntent.metadata.sessionId
            const userId = paymentIntent.metadata.userId

            const sessionKey = `payment-session:${sessionId}`;
            const sessionData = await redis.get(sessionKey);

            if (!sessionData) {
                console.warn("Session data expired or not found", sessionId);
                return res.status(200).send("No session found, skipping order creation");
            }

            const { cart, totalAmount, shippingAddressId, coupon } = JSON.parse(sessionData);

            const user = await prisma.users.findUnique({ where: { id: userId } });
            const name = user?.name;
            const email = user?.email;

            const shopGrouped = cart.reduce((acc: any, item: any) => {
                if (!acc[item.shopId]) acc[item.shopId] = [];
                acc[item.shopId].push(item);
                return acc;
            }, {});

            for (const shopId in shopGrouped) {
                const orderItems = shopGrouped[shopId];

                let orderTotal = orderItems.reduce(
                    (sum: number, p: any) => sum + p.quantity * p.sale_price,
                    0
                );

                // Apply discount if applicable
                if (coupon && coupon.discountProductId && orderItems.some((item: any) => item.id === coupon.discountProductId)) {

                    const discountedItem = orderItems.find(
                        (item: any) => item.id === coupon.discountProductId
                    );

                    if (discountedItem) {
                        const discount = coupon.discountPercent > 0 ? (discountedItem.sale_price * discountedItem.quantity * coupon.discountPercent) / 100 : coupon.discountAmount;

                        orderTotal -= discount;
                    }
                }

                // Create order
                await prisma.orders.create({
                    data: {
                        userId,
                        shopId,
                        total: orderTotal,
                        status: "Paid",
                        shippingAddressId: shippingAddressId || null,
                        couponCode: coupon?.code || null,
                        discountAmount: coupon?.discountAmount || 0,
                        items: {
                            create: orderItems.map((item: any) => ({
                                productId: item.id,          // ✅ required
                                quantity: item.quantity || 1,       // optional but usually needed
                                price: item.sale_price,
                                selectedOptions: item.selectedOptions || [],
                            })),
                        },
                    },
                });

                // Update product & analytics
                for (const item of orderItems) {
                    const { id: productId, quantity } = item;

                    await prisma.products.update({
                        where: { id: productId },
                        data: {
                            stock: { decrement: quantity },
                            totalSales: { increment: quantity },
                        }
                    });

                    await prisma.productAnalytics.upsert({
                        where: { productId },
                        create: {
                            productId,
                            shopId,
                            purchases: quantity,
                            lastViewedAt: new Date(),
                        },
                        update: {
                            purchases: { increment: quantity },
                        }
                    });

                    const existingAnalytics = await prisma.userAnalytics.findUnique({ where: { userId } });

                    const newAction = {
                        productId,
                        shopId,
                        action: "purchase",
                        timestamp: new Date(),
                    };

                    const currentActions = Array.isArray(existingAnalytics?.actions)
                        ? (existingAnalytics.actions as Prisma.JsonArray)
                        : [];

                    if (existingAnalytics) {
                        await prisma.userAnalytics.update({
                            where: { userId },
                            data: {
                                lastVisited: new Date(),
                                actions: [...currentActions, newAction],
                            },
                        });
                    } else {
                        await prisma.userAnalytics.create({
                            data: {
                                userId,
                                lastVisited: new Date(),
                                actions: [newAction],
                            },
                        });
                    }
                }

                // Send email for user
                if (email) {
                    await sendEmail(
                        email,
                        "Your Eshop Order Confirmation",
                        "order-confirmation",
                        {
                            name,
                            cart,
                            totalAmount: coupon?.discountAmount ? totalAmount - coupon?.discountAmount : totalAmount,
                            trackingUrl: `https://shoplet.com/track/${sessionId}`,
                        }
                    );
                } else {
                    console.warn(`⚠️ No email found for user ${userId}, skipping confirmation email.`);
                }

                // Create notification for sellers
                const createdShopIds = Object.keys(shopGrouped);
                const sellerShops = await prisma.shops.findMany({
                    where: {
                        id: {
                            in: createdShopIds,
                        },
                    },
                    select: {
                        id: true,
                        sellerId: true,
                        name: true,
                    }
                });

                for (const shop of sellerShops) {
                    const firstProduct = shopGrouped[shop.id][0];
                    const productTitle = firstProduct?.title || "new item";

                    await prisma.notifications.create({
                        data: {
                            title: `New Order Received`,
                            message: `You have a new order for ${productTitle}`,
                            creatorId: userId,
                            receiverId: shop.sellerId,
                            redirect_link: `https://shoplet.com/order/${sessionId}`,
                        }
                    });

                }

                // Create notification for admin
                await prisma.notifications.create({
                    data: {
                        title: `Platform Order Alert`,
                        message: `A new order was placed by ${name}.`,
                        creatorId: userId,
                        receiverId: "admin",
                        redirect_link: `https://shoplet.com/order/${sessionId}`,
                    }
                });
                await redis.del(sessionKey)
            }
        }

        res.status(200).json({ received: true });

    } catch (error) {
        console.log(error);
        return next(error);
    }
}

// get sellers order
export const getSellerOrders = async (req: any, res: Response, next: NextFunction) => {
    try {
        const shop = await prisma.shops.findUnique({
            where: { sellerId: req.seller.id },
        });

        // fetch all orders for this shop
        const orders = await prisma.orders.findMany({
            where: { shopId: shop?.id },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: true
                    }
                },
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        res.status(201).json({
            success: true,
            orders
        });
    } catch (error) {
        next(error);
    }
}


// get order details
export const getOrderDetails = async (req: any, res: Response, next: NextFunction) => {
    try {

        const orderId = req.params.orderId;
        const order = await prisma.orders.findUnique({ where: { id: orderId }, include: { items: true } });
        
        if (!order) {
            return next(new NotFoundError("Order not found"));
        }

        const shippingAddress = order.shippingAddressId ? await prisma.address.findUnique({ where: { id: order?.shippingAddressId.toString() } }) : null;
    
        const coupon = order.couponCode ? await prisma.discountCodes.findUnique({ where: { discountCode: order.couponCode } }) : null;
    
        // fetch all products details in one go
        const productIds = order.items.map((item: any) => item.id);

        const products = await prisma.products.findMany({
            where: { id: { in: productIds } },
            select: {
                id: true,
                title: true,
                images: true,
            }
        });

        const productMap = new Map(products.map((p) => [p.id, p]));

        const items = order.items.map((item: any) => ({
            ...item,
            selectedOptions: item.selectedOptions,
            product: productMap.get(item.productId) || null,
        }))


        res.status(201).json({ success: true, order: { ...order, items, shippingAddress, couponCode: coupon } });
    } catch (error) {
        next(error);
    }
}

// update order status
export const updateDeliveryStatus = async (req: any, res: Response, next: NextFunction) => {
    try {
        const { orderId } = req.params;
        const { deliveryStatus } = req.body;

        if (!orderId || !deliveryStatus) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const allowedStatuses = ["Ordered", "Packed", "Shipped", "Out for Delivery", "Delivered"];
        if (!allowedStatuses.includes(deliveryStatus)) {
            return next(new ValidationError("Invalid delivery status"));
        }

        const existingOrder = await prisma.orders.findUnique({ where: { id: orderId } });

        if (!existingOrder) {
            return next(new NotFoundError("Order not found"));
        }

        const updatedOrder = await prisma.orders.update({
            where: { id: orderId },
            data: { deliveryStatus, updatedAt: new Date() },
        });

        return res.status(200).json({ success: true, message: "Delivery status updated successfully", order: updatedOrder }); 

    } catch (error) {
        return next(error);
    }
}

// verify coupon code
export const verifyCouponCode = async (req: any, res: Response, next: NextFunction) => {
    try {
        const { couponCode, cart } = req.body;

        if (!couponCode || !cart || cart.length === 0) {
            return res.status(400).json({ message: "Coupon code and cart are required!" });
        }

        // Fetch the discount code
        const discount = await prisma.discountCodes.findUnique({ where: { discountCode: couponCode } });

        if (!discount) {
            return res.status(404).json({ message: "Coupon code isn't valid!" });
        }

        // Find matching product that includes this discount code
        const matchingProduct = cart.find((item: any) => item.discountCode?.some((d:any) => d === discount.id));

        if (!matchingProduct) {
            return res.status(200).json({
                valid: false,
                discount: 0,
                discountAmount: 0,
                message: "No matching product found in cart for this coupon"
            })
        }

        let discountAmount = 0;
        const price = matchingProduct.sale_price * matchingProduct.quantity;

        if (discount.discountType === "percentage") {
            discountAmount = (price * discount.discountValue) / 100;
        } else if (discount.discountType === "flat") {
            discountAmount = discount.discountValue;
        }

        // Prevent discount from being greater than total price
        discountAmount = Math.min(discountAmount, price);

        return res.status(200).json({
            valid: true,
            discount: discount.discountValue,
            discountAmount: discountAmount.toFixed(2),
            discountedProductId: matchingProduct.id,
            discountType: discount.discountType,
            message: "Discount applied to 1 eligible product"
        })
            
    } catch (error) {
     next(error);
    }
}

// get user orders
export const getUserOrders = async (req: any, res: Response, next: NextFunction) => {
    try {
        const orders = await prisma.orders.findMany({ where: { userId: req.user.id }, include: { items: true }, orderBy: { createdAt: "desc" } });
        res.status(201).json({ success: true, orders });
        
    } catch (error) {
        return next(error);
    }
}