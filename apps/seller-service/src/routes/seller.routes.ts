import isAuthenticated from "@packages/middleware/isAutheticated";
import express from "express";
import { deleteShop, editSellerProfile, followShop, getSellerEvents, getSellerProducts, getSellerProfile, isFollowingShop, restoreShop, sellerNotifications, unfollowShop, updateProfilePicture, uploadImage } from "../controllers/seller.controller";
import { isSeller } from "@packages/middleware/authorizeRole";


const router = express.Router();

router.delete("/delete", isAuthenticated, deleteShop);
router.patch("/restore", isAuthenticated, restoreShop);
router.post("/upload-image", isAuthenticated, uploadImage);
router.put("/update-image", isAuthenticated, updateProfilePicture);
router.put("/edit-profile", isAuthenticated, editSellerProfile);
router.get("/get-seller/:id", getSellerProfile);
router.get("/get-products/:id", getSellerProducts);
router.get("/get-seller-events/:id", getSellerEvents);
router.post("/follow-shop", isAuthenticated, followShop);
router.post("/unfollow-shop", isAuthenticated, unfollowShop);
router.get("/is-following/:id", isAuthenticated, isFollowingShop);
router.get("/seller-notifications", isAuthenticated, isSeller, sellerNotifications);