import { AuthError, NotFoundError, ValidationError } from "@packages/error-handler";
import { imagekit } from "@packages/libs/imagekit";
import prisma from "@packages/libs/prisma";
import { Prisma } from "@prisma/client";
import { NextFunction, Request, Response } from "express";


// Get product categories
export const getCategories = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const config = await prisma.siteConfig.findFirst();

        if (!config) {
            return res.status(404).json({ message: "Categories not found" });
        }

        res.status(200).json({
            categories: config.categories,
            subCategories: config.subCategories
        });

    } catch (error) {
        return next(error);

    }

}

// Create discount codes
export const createDiscountCodes = async (req: any, res: Response, next: NextFunction) => {
    try {
        const { public_name, discountType, discountValue, discountCode } = req.body;

        const isDiscountCodeExist = await prisma.discountCodes.findUnique({
            where: {
                discountCode
            }
        })

        if (isDiscountCodeExist) {
            return next(new ValidationError("Discount code already exist! please use a diffrent code"));
        }

        const discount_code = await prisma.discountCodes.create({
            data: {
                public_name,
                discountType,
                discountValue: parseFloat(discountValue),
                discountCode,
                sellerId: req.seller.id
            }
        });

        res.status(201).json({
            success: true,
            discount_code
        });


    } catch (error) {
        next(error);
    }
}

// get discount codes
export const getDiscountCodes = async (req: any, res: Response, next: NextFunction) => {
    try {
        const discount_code = await prisma.discountCodes.findMany({
            where: {
                sellerId: req.seller.id
            },
        })

        res.status(200).json({
            success: true,
            discount_code
        })
    } catch (error) {
        return next(error);
    }
}

// delete discount code
export const deleteDiscountCode = async (req: any, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const sellerId = req.seller?.id;

        const discountCode = await prisma.discountCodes.findUnique({
            where: { id },
            select: { id: true, sellerId: true }
        });

        if (!discountCode) {
            return next(new NotFoundError("Discount code not found"));
        }

        if (discountCode.sellerId !== sellerId) {
            return next(new ValidationError("Unauthorized access!"));
        }

        await prisma.discountCodes.delete({
            where: { id }
        });

        return res.status(200).json({
            message: "Discount code deleted successfully"
        });

    } catch (error) {
        next(error);
    }
}

// upload product image
export const uploadProductImage = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { fileName } = req.body;

        const response = await imagekit.upload({
            file: fileName,
            fileName: `product-${Date.now()}.jpg`,
            folder: "/products"
        });
        res.status(200).json({
            file_url: response.url,
            fileId: response.fileId,
        });
    } catch (error) {
        next(error)
    }
}

// delete product image
export const deleteProductImage = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { fileId } = req.body;

        const response = await imagekit.deleteFile(fileId);

        res.status(200).json({
            success: true,
            response
        });
    } catch (error) {
        next(error)
    }
}

// Create Product
export const createProduct = async (req: any, res: Response, next: NextFunction) => {
    try {

        const {
            title,
            short_description,
            detailed_description,
            warranty,
            custom_specification,
            slug,
            tags,
            cash_on_delivery,
            brand,
            video_url,
            category,
            colors = [],
            sizes = [],
            discountcodes,
            stocks,
            sale_price,
            regular_price,
            subCategory,
            customProperties = {},
            images = [],
        } = req.body;

        if (!title || !slug || !short_description || !category || !subCategory || !sale_price || !images || !tags || !stocks || !regular_price) {
            return next(new ValidationError("All fields are required"));
        }

        if (!req.seller.id) {
            return next(new AuthError("Only seller can create a product! Unauthorized access!"));
        }

        const slugChecking = await prisma.products.findUnique({
            where: {
                slug
            }
        });

        if (slugChecking) {
            return next(new ValidationError("Slug already exist! please use a diffrent slug"));
        }

        const newProduct = await prisma.products.create({
            data: {
                title,
                short_description,
                detailed_description,
                warranty,
                cashOnDelivery: cash_on_delivery,
                slug,
                shopId: req.seller?.shop?.id,
                tags: Array.isArray(tags) ? tags : tags.split(","),
                brand,
                video_url,
                category,
                subCategory,
                colors: colors || [],
                discount_codes: discountcodes.map((codeId: string) => codeId),
                sizes: sizes || [],
                stock: parseInt(stocks),
                sale_price: parseFloat(sale_price),
                regular_price: parseFloat(regular_price),
                custom_specifications: custom_specification || {},
                custom_properties: customProperties || {},
                images: {
                    create: images.filter((img: any) => img && img.fileId && img.file_url).map((img: any) => ({ file_id: img.fileId, url: img.file_url, }))
                }
            },
            include: {
                images: true
            }
        });

        res.status(201).json({
            success: true,
            newProduct
        });

    } catch (error) {
        next(error);
    }
}

// Get logged in seller products
export const getShopProducts = async (req: any, res: Response, next: NextFunction) => {
    try {
        const products = await prisma.products.findMany({
            where: {
                shopId: req.seller?.shop?.id
            },
            include: {
                images: true
            }
        });

        res.status(200).json({
            success: true,
            products
        });
    } catch (error) {
        return next(error);
    }
}

// delete product
export const deleteProduct = async (req: any, res: Response, next: NextFunction) => {
    try {
        const { productId } = req.params;
        const sellerId = req.seller?.shop?.id;

        const product = await prisma.products.findUnique({
            where: { id: productId },
            select: { id: true, shopId: true, isDeleted: true }
        })

        if (!product) {
            return next(new NotFoundError("Product not found"));
        }

        if (product.shopId !== sellerId) {
            return next(new ValidationError("Unauthorized action!"));
        }

        if (product.isDeleted) {
            return next(new ValidationError("Product already deleted!"));
        }
        const deletedProduct = await prisma.products.update({
            where: { id: productId },
            data: { isDeleted: true, deletedAt: new Date(Date.now() + 24 * 60 * 60 * 1000) }
        });

        return res.status(200).json({
            message: "Product is scheduled for deletion in 24 hours. You can restore it within this",
            deletedProduct
        });

    } catch (error) {
        return next(error);
    }
}

// restore product
export const restoreProduct = async (req: any, res: Response, next: NextFunction) => {
    try {
        const { productId } = req.params;
        const sellerId = req.seller?.shop?.id;

        const product = await prisma.products.findUnique({
            where: { id: productId },
            select: { id: true, shopId: true, isDeleted: true }
        })

        if (!product) {
            return next(new NotFoundError("Product not found"));
        }

        if (product.shopId !== sellerId) {
            return next(new ValidationError("Unauthorized action!"));
        }

        if (!product.isDeleted) {
            return res.status(400).json({ message: "Product is not in deleted state" });
        }

        await prisma.products.update({
            where: { id: productId },
            data: { isDeleted: false, deletedAt: null }
        });

        return res.status(200).json({ message: "Product sucessfully restored!" });
    } catch (error) {
        return res.status(500).json({ message: "Error restoring product", error });
    }
}

// get seller stripe information
export const getStripeAccount = async (req: any, res: Response, next: NextFunction) => {
    try {

    } catch (error) {

    }
}

// get All Products
export const getAllProducts = async (req: any, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const skip = (page - 1) * limit;
        const type = req.query.type as string;

        const baseFilter = {
            // OR: [
            //     {
            //         starting_date: null,
            //     },
            //     {
            //         ending_date: null,
            //     }
            // ]
        };

        const orderBy: Prisma.productsOrderByWithRelationInput = type === "latest"
            ? { createdAt: "desc" as Prisma.SortOrder }
            : { totalSales: "desc" as Prisma.SortOrder };

        const [products, total, top10Products] = await Promise.all([
            prisma.products.findMany({
                skip,
                take: limit,
                include: {
                    images: true,
                    shop: true
                },
                where: baseFilter,
                orderBy: {
                    totalSales: "desc"
                }
            }),

            prisma.products.count({
                where: baseFilter
            }),
            prisma.products.findMany({
                take: 10,
                where: baseFilter,
                orderBy
            })
        ]);

        res.status(200).json({
            products,
            top10By: type === "latest" ? "latest" : "topSales",
            top10Products,
            total,
            currentPage: page,
            totalPages: Math.ceil(total / limit)
        });

    } catch (error) {
        next(error);
    }
}

// get all events
export const getAllEvents = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const skip = (page - 1) * limit;
        
        const baseFilter = {
            // AND: [{ starting_date: {not: null} }, { ending_date: {not: null} }]
        }

        const [events, total, top10BySales ] = await Promise.all([
            prisma.products.findMany({
                skip,
                take: limit,
                where: baseFilter,
                include: {
                    images: true,
                    shop: true
                },
                
                orderBy: {
                    totalSales: "desc"
                }
            }),
            prisma.products.count({
                where: baseFilter
            }),
            prisma.products.findMany({
                where: baseFilter,
                take: 10,
                orderBy: {
                    totalSales: "desc"
                }
            })
        ]);

        res.status(200).json({
            events,
            top10BySales,
            total,
            currentPage: page,
            totalPages: Math.ceil(total / limit)
        });
        
    } catch (error) {
        res.status(500).json({ message: "Error fetching events", error });
    }
}

// get product details
export const getProductDetails = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const product = await prisma.products.findUnique({
            where: { slug: req.params.slug },
            include: {
                images: true,
                shop: true
            }
        })
        res.status(200).json({ success: true, product })
    } catch (error) {
        return next(error);
    }
}

// get filtered products
export const getFilteredProducts = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {
            priceRange = [0, 10000],
            categories = [],
            colors = [],
            sizes = [],
            page = 1,
            limit = 12,
        } = req.query;

        const parsedPriceRange =
            typeof priceRange === "string"
                ? priceRange.split(",").map(Number) : [0, 10000];
        const parsedPage = Number(page);
        const parsedLimit = Number(limit);

        const skip = (parsedPage - 1) * parsedLimit;

        const filters: Record<string, any> = {
            sale_price: {
                gte: parsedPriceRange[0],
                lte: parsedPriceRange[1],
            },
            // starting_date: null,
        };

        if (categories && (categories as String[]).length > 0) {
            filters.category = {
                in: Array.isArray(categories) ? categories : String(categories).split(","),
            };
        }

        if (colors && (colors as String[]).length > 0) {
            filters.colors = {
                hasSome: Array.isArray(colors) ? colors : [colors],
            };
        }

        if (sizes && (sizes as String[]).length > 0) {
            filters.sizes = {
                hasSome: Array.isArray(sizes) ? sizes : [sizes],
            };
        }

        const [products, total] = await Promise.all([
            prisma.products.findMany({
                skip,
                take: parsedLimit,
                include: {
                    images: true,
                    shop: true
                },
                where: filters,
            }),
            prisma.products.count({
                where: filters,
            }),
        ]);

        const totalPages = Math.ceil(total / parsedLimit);

        res.json({
            products,
            pagination: {
                total,
                page: parsedPage,
                totalPages
            }
        });


    } catch (error) {
        next(error);
    }
}

// get filtered offers
export const getFilteredEvents = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {
            priceRange = [0, 10000],
            categories = [],
            colors = [],
            sizes = [],
            page = 1,
            limit = 12,
        } = req.query;

        const parsedPriceRange =
            typeof priceRange === "string"
                ? priceRange.split(",").map(Number) : [0, 10000];

        const parsedPage = Number(page);
        const parsedLimit = Number(limit);

        const skip = (parsedPage - 1) * parsedLimit;

        const filters: Record<string, any> = {
            sale_price: {
                gte: parsedPriceRange[0],
                lte: parsedPriceRange[1],
            },
            NOT: {
                starting_date: null
            }
        };

        if (categories && (categories as String[]).length > 0) {
            filters.category = {
                in: Array.isArray(categories) ? categories : String(categories).split(","),
            };
        }

        if (colors && (colors as String[]).length > 0) {
            filters.colors = {
                hasSome: Array.isArray(colors) ? colors : [colors],
            };
        }

        if (sizes && (sizes as String[]).length > 0) {
            filters.sizes = {
                hasSome: Array.isArray(sizes) ? sizes : [sizes],
            };
        }

        const [products, total] = await Promise.all([
            prisma.products.findMany({
                skip,
                take: parsedLimit,
                include: {
                    images: true,
                    shop: true
                },
                where: filters,
            }),
            prisma.products.count({
                where: filters,
            }),
        ]);

        const totalPages = Math.ceil(total / parsedLimit);

        res.json({
            products,
            pagination: {
                total,
                page: parsedPage,
                totalPages
            }
        });

    } catch (error) {
        next(error);
    }
}

// get filtered shop
export const getFilteredShops = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {
            categories = [],
            countries = [],
            page = 1,
            limit = 12,
        } = req.query;

        const parsedPage = Number(page);
        const parsedLimit = Number(limit);

        const skip = (parsedPage - 1) * parsedLimit;

        const filters: Record<string, any> = {};

        if (categories && String(categories).length > 0) {
            filters.category = {
                in: Array.isArray(categories) ? categories : String(categories).split(","),
            };
        }

         if (countries && String(countries).length > 0) {
            filters.category = {
                in: Array.isArray(categories) ? categories : String(categories).split(","),
            };
        }

        const [shops, total] = await Promise.all([
            prisma.shops.findMany({
                skip,
                take: parsedLimit,
                include: {
                    sellers: true,
                    followers: true,
                    products: true
                },
                where: filters,
            }),
            prisma.shops.count({
                where: filters,
            }),
        ]);

        const totalPages = Math.ceil(total / parsedLimit);

        res.json({
            shops,
            pagination: {
                total,
                page: parsedPage,
                totalPages
            }
        });

    } catch (error) {
        next(error);
    }
}

// search product
export const searchProducts = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const query = req.query.q as string;

        if (!query || query.trim().length === 0) {
            return res.status(400).json({ message: "Please provide a valid search query" });
        }

        const products = await prisma.products.findMany({
            where: {
                OR: [
                    {
                        title: {
                            contains: query,
                            mode: "insensitive"
                        },
                    },
                    {
                        short_description: {
                            contains: query,
                            mode: "insensitive"
                        },
                    },
                ],
            },
            select: {
                id: true,
                title: true,
                slug: true,
            },
            take: 10,
            orderBy: {
                createdAt: "desc"
            }
        });

        res.status(200).json({ products });
    } catch (error) {
        return next(error);
    }
}

// Top Shops
export const topShops = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Aggregate total sales per shop from orders
        const topShopsData = await prisma.orders.groupBy({
            by: ["shopId"],
            _sum: {
                total: true,
            },
            orderBy: {
                _sum: {
                    total: "desc",
                },
            },
            take: 10,
        });

        // Fetch the corresponding shop details
        const shopIds = topShopsData.map((item) => item.shopId);

        const shops = await prisma.shops.findMany({
            where: {
                id: {
                    in: shopIds,
                },
            },
           select : {
            id: true,
            name: true,
            avatar: true,
            coverBanner: true,
            address: true,
            ratings: true,
            followers: true,
            category: true
           }
        });

        // Merge sales with shop data
        const enrichedShops = shops.map((shop) => {
            const salesData = topShopsData.find((s) => s.shopId === shop.id);
            return {
                ...shop,
                totalSales: salesData?._sum.total ?? 0,
            }
        })

        const top10Shops = enrichedShops.sort((a, b) => b.totalSales - a.totalSales).slice(0, 10);

        return res.status(200).json({ shops:top10Shops });

    } catch (error) {
        console.error("Error fetching top shops: ", error);
        return next(error);
    }
}
