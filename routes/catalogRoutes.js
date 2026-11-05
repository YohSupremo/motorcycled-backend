import { Router } from "express";
import {
  getCategories,
  getSingleCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  getBrands,
  getSingleBrand,
  createBrand,
  updateBrand,
  deleteBrand,
} from "../controllers/catalogController.js";
import { auth, authorizeRoles } from "../middleware/authMiddleware.js";


const router = Router();


router.get("/categories", getCategories);
router.get("/category/:id", getSingleCategory);
router.get("/brands", getBrands);
router.get("/brand/:id", getSingleBrand);


router.post(
  "/admin/category/new",
  auth,
  authorizeRoles("admin"),
  createCategory,
);
router.put(
  "/admin/category/:id",
  auth,
  authorizeRoles("admin"),
  updateCategory,
);
router.delete(
  "/admin/category/:id",
  auth,
  authorizeRoles("admin"),
  deleteCategory,
);


router.post(
  "/admin/brand/new",
  auth,
  authorizeRoles("admin"),
  createBrand,
);
router.put(
  "/admin/brand/:id",
  auth,
  authorizeRoles("admin"),
  updateBrand,
);
router.delete(
  "/admin/brand/:id",
  auth,
  authorizeRoles("admin"),
  deleteBrand,
);

export default router;
