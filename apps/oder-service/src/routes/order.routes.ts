import isAuthenticated from '@packages/middleware/isAutheticated';
import express, { Router } from 'express';
import { createPaymentIntent, createPaymentSession, getAdminOrders, getOrderDetails, getSellerOrders, getUserOrders, updateDeliveryStatus, verifyCouponCode, verifyingPaymentSession } from '../controllers/order.controller';
import { isAdmin, isSeller } from '@packages/middleware/authorizeRole';


const router:Router = express.Router();

// payment validation
router.post("/create-payment-session", isAuthenticated, createPaymentSession);
router.post("/create-payment-intent", isAuthenticated, createPaymentIntent);
router.get("/verifying-payment-session", isAuthenticated, verifyingPaymentSession);

// Order
router.get("/get-seller-orders", isAuthenticated, isSeller, getSellerOrders);
router.get("/get-order-details/:orderId", isAuthenticated, getOrderDetails);
router.put("/update-status/:orderId", isAuthenticated, isSeller, updateDeliveryStatus);
router.put("/verify-coupon", isAuthenticated, verifyCouponCode);
router.get("/get-user-orders", isAuthenticated, getUserOrders);


router.get("/get-admin-orders", isAuthenticated, getAdminOrders);


export default router;
