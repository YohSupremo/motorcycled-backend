import mongoose from "mongoose";
import Product from "../model/Product.js";
import Category from "../model/Category.js";
import Brand from "../model/Brand.js";
import { cloudConf } from "../config/cloudinary.js";
import InventoryTransaction from "../model/InventoryTransaction.js";

const escapeRegex = (value) =>
  typeof value === "string" ? value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") : "";



const uploadToCloudinary = (dataUrl) =>
  cloudConf.uploader.upload(dataUrl, {
    folder: "motorshop/products",
    width: 800,
    crop: "limit",
  });



const destroyFromCloudinary = (publicId) =>
  cloudConf.uploader.destroy(publicId);




export const newProduct = async (req, res) => {
  try {
    const { name, brand, category, price } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Please enter product name" });
    }
    if (!category) {
      return res.status(400).json({ success: false, message: "Please select a category" });
    }
    if (!brand) {
      return res.status(400).json({ success: false, message: "Please select a brand" });
    }
    if (price === undefined || price === "" || Number(price) < 0) {
      return res.status(400).json({ success: false, message: "Please enter a valid price" });
    }

    
    const existing = await Product.findOne({
      name: { $regex: new RegExp(`^${escapeRegex(name.trim())}$`, "i") },
      brand,
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `A product named "${name.trim()}" already exists for this brand`,
      });
    }

    let images = [];

    
    
    if (typeof req.body.images === "string") {
      images.push(req.body.images);
    } else if (Array.isArray(req.body.images)) {
      images = req.body.images;
    }

    
    const imagesLinks = [];
    for (const image of images) {
      try {
        const result = await uploadToCloudinary(image);
        imagesLinks.push({
          url: result.secure_url,
          publicId: result.public_id,
        });
      } catch (err) {
        console.error("Cloudinary upload error:", err);
      }
    }

    req.body.name = name.trim();
    req.body.images = imagesLinks;
    
    req.body.user = req.user._id;

    const product = await Product.create(req.body);

    if (!product) {
      return res.status(400).json({ success: false, message: "Product not created" });
    }

    return res.status(201).json({ success: true, product });
  } catch (error) {
    console.error("newProduct error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error creating product",
    });
  }
};




export const getAdminProducts = async (req, res) => {
  const products = await Product.find()
    .populate("category", "name")
    .populate("brand", "name")
    .sort({ createdAt: -1 });

  if (!products) {
    return res.status(404).json({ success: false, message: "Products not found" });
  }

  return res.status(200).json({ success: true, products });
};




export const getSingleProduct = async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate("category", "name description")
    .populate("brand", "name logo");

  if (!product || product.isArchived) {
    return res.status(404).json({ success: false, message: "Product not found" });
  }

  return res.status(200).json({ success: true, product });
};




export const updateProduct = async (req, res) => {
  let product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({ success: false, message: "Product not found" });
  }

  
  const oldStock = Number(product.stock || 0);
  const incomingStock = req.body.stock !== undefined ? Number(req.body.stock) : oldStock;
  const stockChanged = req.body.stock !== undefined && incomingStock !== oldStock;
  const stockDiff = stockChanged ? incomingStock - oldStock : 0;

  
  if (req.body.images !== undefined) {
    let rawImages = [];
    if (typeof req.body.images === "string") {
      rawImages.push(req.body.images);
    } else if (Array.isArray(req.body.images)) {
      rawImages = req.body.images;
    }

    const finalImages = [];
    for (const item of rawImages) {
      if (typeof item === "string" && item.startsWith("data:")) {
        
        try {
          const result = await uploadToCloudinary(item);
          finalImages.push({
            url: result.secure_url,
            publicId: result.public_id,
          });
        } catch (err) {
          console.error("Cloudinary upload error:", err);
        }
      } else if (item && typeof item === "object" && item.url && item.publicId) {
        
        finalImages.push({
          url: item.url,
          publicId: item.publicId,
        });
      } else if (typeof item === "string" && item.startsWith("http")) {
        
        const matched = product.images.find((img) => img.url === item);
        if (matched) {
          finalImages.push({
            url: matched.url,
            publicId: matched.publicId,
          });
        }
      }
    }

    
    const keptPublicIds = new Set(finalImages.map((img) => img.publicId));
    for (const oldImg of product.images) {
      if (!keptPublicIds.has(oldImg.publicId)) {
        try {
          await destroyFromCloudinary(oldImg.publicId);
        } catch (err) {
          console.error("Error removing old image from Cloudinary:", err);
        }
      }
    }

    req.body.images = finalImages;
  }

  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })
    .populate("category", "name")
    .populate("brand", "name");

  
  if (stockChanged && stockDiff !== 0) {
    try {
      const makeTransactionRef = () =>
        `TXN-ADJ-${new mongoose.Types.ObjectId().toString().slice(-8).toUpperCase()}`;
      const performedByName = (user) =>
        [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() || "Admin";

      await InventoryTransaction.create({
        transactionRef: makeTransactionRef(),
        product: product._id,
        productName: product.name,
        type: "adjustment",
        quantityChange: stockDiff,
        orderRef: req.body.adjustmentRef || "MANUAL-ADJ",
        unitCost: Number(product.costPrice || 0),
        performedBy: req.user?._id,
        performedByName: performedByName(req.user),
        note: req.body.adjustmentReason
          ? req.body.adjustmentReason
          : `Catalog stock adjustment (${oldStock} → ${incomingStock})`,
      });
    } catch (adjError) {
      console.error("Failed to log inventory adjustment:", adjError);
    }
  }

  return res.status(200).json({ success: true, product });
};




export const deleteProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({ success: false, message: "Product not found" });
  }

  product.isArchived = true;
  await product.save();

  return res.status(200).json({
    success: true,
    message: `Product "${product.name}" soft-deleted successfully`,
    isArchived: true,
    product,
  });
};




export const toggleArchiveProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({ success: false, message: "Product not found" });
  }

  product.isArchived = !product.isArchived;
  await product.save();

  return res.status(200).json({
    success: true,
    message: `Product ${product.isArchived ? "archived" : "restored"} successfully`,
    isArchived: product.isArchived,
  });
};



export const bulkDeleteProducts = async (req, res) => {
  try {
    const { productIds } = req.body;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide an array of product IDs to delete",
      });
    }

    const result = await Product.updateMany(
      { _id: { $in: productIds } },
      { $set: { isArchived: true } }
    );

    return res.status(200).json({
      success: true,
      count: result.modifiedCount,
      message: `Successfully soft-deleted ${result.modifiedCount} product(s)`,
    });
  } catch (error) {
    console.error("bulkDeleteProducts error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to bulk delete products",
    });
  }
};



export const bulkRestoreProducts = async (req, res) => {
  try {
    const { productIds } = req.body;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide an array of product IDs to restore",
      });
    }

    const result = await Product.updateMany(
      { _id: { $in: productIds } },
      { $set: { isArchived: false } }
    );

    return res.status(200).json({
      success: true,
      count: result.modifiedCount,
      message: `Successfully restored ${result.modifiedCount} product(s)`,
    });
  } catch (error) {
    console.error("bulkRestoreProducts error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to bulk restore products",
    });
  }
};






export const getProducts = async (req, res) => {
  const resPerPage = Number(req.query.limit) || 12;
  const currentPage = Number(req.query.page) || 1;
  const skip = resPerPage * (currentPage - 1);

  
  const filter = { isArchived: { $ne: true } };

  
  if (req.query.keyword && req.query.keyword.trim() !== "") {
    const kw = escapeRegex(req.query.keyword.trim());
    filter.$or = [
      { name: { $regex: kw, $options: "i" } },
      { description: { $regex: kw, $options: "i" } },
      { compatibleModels: { $regex: kw, $options: "i" } },
    ];
  }

  
  if (req.query.category && req.query.category !== "All") {
    if (mongoose.Types.ObjectId.isValid(req.query.category)) {
      filter.category = req.query.category;
    } else {
      const cat = await Category.findOne({
        name: { $regex: `^${escapeRegex(req.query.category)}$`, $options: "i" },
      });
      if (cat) filter.category = cat._id;
    }
  }

  
  if (req.query.brand && req.query.brand !== "All") {
    if (mongoose.Types.ObjectId.isValid(req.query.brand)) {
      filter.brand = req.query.brand;
    } else {
      const b = await Brand.findOne({
        name: { $regex: `^${escapeRegex(req.query.brand)}$`, $options: "i" },
      });
      if (b) filter.brand = b._id;
    }
  }

  
  if (req.query.onlyInstallment === "true" || req.query.onlyInstallment === true) {
    filter.installmentEligible = true;
  }

  
  if (
    req.query["price[gte]"] !== undefined ||
    req.query["price[lte]"] !== undefined ||
    req.query.minPrice !== undefined ||
    req.query.maxPrice !== undefined
  ) {
    filter.price = {};
    const minP = req.query["price[gte]"] ?? req.query.minPrice;
    const maxP = req.query["price[lte]"] ?? req.query.maxPrice;
    if (minP !== undefined && minP !== "") filter.price.$gte = Number(minP);
    if (maxP !== undefined && maxP !== "") filter.price.$lte = Number(maxP);
  }

  
  if (req.query.ratings || req.query["ratings[gte]"]) {
    const maxRating = Number(req.query.ratings || req.query["ratings[gte]"]);
    if (!isNaN(maxRating) && maxRating > 0) {
      filter.ratings = { $lte: maxRating };
    }
  }

  
  if (
    req.query.hasReviews === "true" ||
    req.query.onlyReviewed === "true" ||
    req.query.reviewed === "true"
  ) {
    filter.numOfReviews = { $gt: 0 };
  } else if (req.query.minReviews !== undefined && req.query.minReviews !== "") {
    const minRev = Number(req.query.minReviews);
    if (!isNaN(minRev) && minRev > 0) {
      filter.numOfReviews = { $gte: minRev };
    }
  }

  
  if (
    req.query.isFeatured === "true" ||
    req.query.featured === "true" ||
    req.query.isFeatured === true
  ) {
    filter.isFeatured = true;
  }

  const productsCount = await Product.countDocuments(filter);

  const products = await Product.find(filter)
    .populate("category", "name")
    .populate("brand", "name")
    .sort({ createdAt: -1 })
    .limit(resPerPage)
    .skip(skip);

  return res.status(200).json({
    success: true,
    productsCount,
    resPerPage,
    filteredProductsCount: productsCount,
    products,
  });
};



export const toggleFeatureProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    product.isFeatured = !product.isFeatured;
    await product.save();

    return res.status(200).json({
      success: true,
      isFeatured: product.isFeatured,
      message: product.isFeatured
        ? `"${product.name}" is now featured on the homepage showcase!`
        : `"${product.name}" removed from featured homepage items.`,
    });
  } catch (error) {
    console.error("toggleFeatureProduct error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to toggle featured status",
    });
  }
};
