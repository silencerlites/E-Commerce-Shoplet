import prisma from "@packages/libs/prisma";
import cron from "node-cron";

cron.schedule("0 * * * *", async () => {
    try {
        const now = new Date();
        // Delete product where `deletedAt` is older than 24 hrs
        const deletedProducts = await prisma.products.deleteMany({where: {isDeleted: true, deletedAt: {lt: now}}});
        console.log(`Deleted ${deletedProducts.count} expired products permanently deleted.`);
    } catch (error) {
        console.log(error);
    }
})