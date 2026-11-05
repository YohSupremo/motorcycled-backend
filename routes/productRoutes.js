import { Router } from "express";
import {
  newProduct,
  getAdminProducts,
  getSingleProduct,
  updateProduct,
  deleteProduct,
  bulkDeleteProducts,
  bulkRestoreProducts,
  toggleArchiveProduct,
  toggleFeatureProduct,
  getProducts,
} from "../controllers/productController.js";
import { auth, authorizeRoles } from "../middleware/authMiddleware.js";



const router = Router();



router.post(
  "/admin/product/new",
  auth,
  authorizeRoles("admin"),
  newProduct,
);

router.get(
  "/admin/products",
  auth,
  authorizeRoles("admin"),
  getAdminProducts,
);

router.put(
  "/admin/product/:id",
  auth,
  authorizeRoles("admin"),
  updateProduct,
);

router.delete(
  "/admin/product/:id",
  auth,
  authorizeRoles("admin"),
  deleteProduct,
);

router.post(
  "/admin/products/bulk-delete",
  auth,
  authorizeRoles("admin"),
  bulkDeleteProducts,
);

router.post(
  "/admin/products/bulk-restore",
  auth,
  authorizeRoles("admin"),
  bulkRestoreProducts,
);

router.patch(
  "/admin/product/:id/archive",
  auth,
  authorizeRoles("admin"),
  toggleArchiveProduct,
);

router.patch(
  "/admin/product/:id/feature",
  auth,
  authorizeRoles("admin"),
  toggleFeatureProduct,
);



router.get("/products", getProducts);
router.get("/product/:id", getSingleProduct);

export default router;
