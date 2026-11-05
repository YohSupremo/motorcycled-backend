import mongoose from "mongoose";



const brandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter a brand name"],
      unique: true,
      trim: true,
    },
    logo: {
      url: { type: String },
      publicId: { type: String },
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

const Brand = mongoose.model("Brand", brandSchema);
export default Brand;
