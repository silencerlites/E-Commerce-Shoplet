import { isAdmin } from '@packages/middleware/authorizeRole';
import isAuthenticated from '@packages/middleware/isAutheticated';
import express, { Router } from 'express';
import { getAllProducts } from '../controllers/admin.controller';

const router:Router = express.Router();

router.get("/get-all-products", isAuthenticated, isAdmin, getAllProducts);

export default router;