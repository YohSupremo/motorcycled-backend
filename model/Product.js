import mongoose from "mongoose";





const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter product name"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Please select a category for this product"],
    },
    
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: [true, "Please select a brand for this product"],
    },
    
    compatibleModels: {
      type: [String],
      default: [],
    },
    price: {
      type: Number,
      required: [true, "Please enter product price"],
      min: [0, "Price cannot be negative"],
    },
    
    
    costPrice: {
      type: Number,
      default: 0,
      min: [0, "Cost price cannot be negative"],
    },
    ratings: {
      type: Number,
      default: 0,
      min: [0, "Rating cannot be negative"],
      max: [5, "Rating cannot exceed 5"],
    },
    numOfReviews: {
      type: Number,
      default: 0,
    },
    stock: {
      type: Number,
      required: [true, "Please enter product stock"],
      min: [0, "Stock cannot be negative"],
      default: 0,
    },
    
    lowStockThreshold: {
      type: Number,
      default: 5,
    },
    
    
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
      },
    ],
    installmentEligible: {
      type: Boolean,
      default: false,
    },
    minInstallmentPrice: {
      type: Number,
      default: 0,
    },
    
    isArchived: {
      type: Boolean,
      default: false,
    },
    
    isFeatured: {
      type: Boolean,
      default: false,
    },
    
    
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);


productSchema.index({ name: "text", description: "text" });
productSchema.index({ category: 1, brand: 1, price: 1 });
productSchema.index({ compatibleModels: 1 });
productSchema.index({ isArchived: 1, isFeatured: 1, category: 1, price: 1 });

const Product = mongoose.model("Product", productSchema);
export default Product;
