import mongoose from "mongoose";



const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter a category name"],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

const Category = mongoose.model("Category", categorySchema);
export default Category;
