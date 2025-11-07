import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const initializeConfig = async () => {
    try {
        const existingConfig = await prisma.siteConfig.findFirst();
        if(!existingConfig) {
            await prisma.siteConfig.create({
                data: {
                  categories: [
                    "Electronics",
                    "Fashion",
                    "Home & Living",
                    "Beauty & Personal Care",
                    "Sports & Outdoors",
                    "Toys & Games",
                    "Groceries"
                  ],
                  subCategories: {
                    "Electronics": [
                      "Computers",
                      "Laptops",
                      "Tablets",
                      "Smartphones",
                      "Cameras",
                      "Speakers",
                      "Headphones",
                      "Printers",
                      "Monitors",
                      "TVs",
                      "Gaming Consoles",
                      "Accessories"
                    ],
                    "Fashion": [
                      "Clothing",
                      "Shoes",
                      "Accessories",
                      "Beauty",
                      "Jewelry",
                      "Handbags",
                      "Watches"
                    ],
                    "Home & Living": [
                      "Furniture",
                      "Kitchen",
                      "Bedroom",
                      "Living Room",
                      "Dining Room",
                      "Office",
                      "Outdoor",
                      "Garden",
                      "Tools",
                      "Home Improvement"
                    ], "Beauty & Personal Care": [
                      "Skincare",
                      "Makeup",
                      "Hair Care",  
                      "Body Care",
                      "Oral Care",
                      "Nail Care",
                      "Fragrance",
                      "Tools",
                      "Accessories"
                    ],
                    "Sports & Outdoors": [
                      "Cycling",
                      "Running",
                      "Swimming",
                      "Hiking",
                      "Golf",
                      "Skiing",
                      "Camping",
                      "Climbing",
                      "Fishing",
                      "Hunting",
                      "Boating",
                      "Fishing",
                      "Accessories" 
                    ],
                    "Toys & Games": [
                      "Action Figures",
                      "Board Games",
                      "Puzzles",
                      "Dolls",
                      "Stuffed Toys",
                      "Remote Control",
                      "Action Figures",
                      "Board Games",
                      "Puzzles",
                    ], "Groceries": [
                      "Fruits & Vegetables",
                      "Meat & Seafood",
                      "Dairy & Eggs",
                      "Bakery",
                      "Snacks",
                      "Beverages", ],
                  }
                }
            });
        }
    } catch (error) {
        console.error("Error initializing site config", error);
     
    }
}

export default initializeConfig;
