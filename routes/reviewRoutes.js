import { Router } from "express";
import {
  getProductReviews,
  getMyReview,
  createReview,
  updateReview,
  deleteMyReview,
  getAllReviews,
  toggleReviewVisibility,
} from "../controllers/reviewController.js";
import { auth, authorizeRoles } from "../middleware/authMiddleware.js";

const router = Router();


router.get("/product/:id/reviews", getProductReviews);



router.get("/product/:id/my-review", auth, getMyReview);
router.post("/product/:id/review", auth, createReview);
router.put("/product/:id/review", auth, updateReview);
router.delete("/product/:id/review", auth, deleteMyReview);


router.get("/admin/reviews", auth, authorizeRoles("admin"), getAllReviews);

router.put(
  "/admin/review/:id/hide",
  auth,
  authorizeRoles("admin"),
  toggleReviewVisibility,
);

export default router;
