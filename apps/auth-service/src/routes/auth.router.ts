import express, { Router } from "express";
import { addUserAddress, createShop, createStripeConnectLink, deleteUserAddress, getAdmin, getSeller, getUser, getUserAddresses, loginAdmin, loginSeller, loginUser, refreshToken, resetUserPassword, sellerRegistration, userForgotPassword, userRegistration, verifySeller, verifyUser, verifyUserForgotPassword } from "../controller/auth.controller";
import isAuthenticated from "@packages/middleware/isAutheticated";
import { isAdmin, isSeller, isUser } from "@packages/middleware/authorizeRole";

const router: Router = express.Router();

// -/api/-

router.post("/refresh-token", refreshToken);

router.post("/user-registration", userRegistration);
router.post("/verify-user", verifyUser);
router.post("/login-user", loginUser);
router.get("/logged-in-user", isAuthenticated, isUser, getUser);
router.post("/user-forgot-password", userForgotPassword);
router.post("/reset-user-password", resetUserPassword);
router.post("/verify-user-forgot-password", verifyUserForgotPassword);

router.get("/shipping-addresses", isAuthenticated, getUserAddresses);
router.post("/add-address", isAuthenticated, addUserAddress);
router.delete("/delete-address/:addressId", isAuthenticated, deleteUserAddress);

router.post("/seller-registration", sellerRegistration);
router.post("/verify-seller", verifySeller);
router.post("/create-shop", createShop)
router.post("/create-stripe-connect-link", createStripeConnectLink);
router.post("/login-seller", loginSeller)
router.get("/logged-in-seller", isAuthenticated, isSeller, getSeller);

router.post("/login-admin", loginAdmin);
router.get("/logged-in-admin", isAuthenticated, getAdmin);



export default router;