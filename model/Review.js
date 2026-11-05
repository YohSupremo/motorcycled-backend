import mongoose from "mongoose";





const reviewSchema = new mongoose.Schema(
  {
    
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Review must belong to a product"],
    },
    
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Review must have an author"],
    },
    
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    rating: {
      type: Number,
      required: [true, "Please provide a rating"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },
    title: {
      type: String,
      trim: true,
      default: "",
    },
    comment: {
      type: String,
      trim: true,
      default: "",
    },
    
    isVerifiedPurchase: {
      type: Boolean,
      default: false,
    },
    
    isHidden: {
      type: Boolean,
      default: false,
    },
    
    seedId: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  { timestamps: true },
);


reviewSchema.index({ product: 1, user: 1 }, { unique: true });
reviewSchema.index({ product: 1, createdAt: -1 });

const Review = mongoose.model("Review", reviewSchema);
export default Review;
