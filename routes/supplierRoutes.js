import { Router } from "express";
import {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deactivateSupplier,
  restoreSupplier,
} from "../controllers/supplierController.js";
import { auth, authorizeRoles } from "../middleware/authMiddleware.js";

const router = Router();


router.get("/suppliers", auth, authorizeRoles("admin"), getSuppliers);

router.post(
  "/admin/supplier/new",
  auth,
  authorizeRoles("admin"),
  createSupplier,
);
router.put(
  "/admin/supplier/:id",
  auth,
  authorizeRoles("admin"),
  updateSupplier,
);
router.put(
  "/admin/supplier/:id/restore",
  auth,
  authorizeRoles("admin"),
  restoreSupplier,
);
router.delete(
  "/admin/supplier/:id",
  auth,
  authorizeRoles("admin"),
  deactivateSupplier,
);

export default router;
