import mongoose from "mongoose";
import Review from "../model/Review.js";
import Product from "../model/Product.js";
import Order from "../model/Order.js";
import { Filter } from "bad-words";



const badWordsFilter = new Filter();
badWordsFilter.addWords(
  "gago",
  "tarantado",
  "tangina",
  "bobo",
  "puta",
  "leche",
  "ulol",
  "peste",
  "t@ngina",
  "kupal",
  "inutil"
);

export const cleanBadWords = (text) => {
  if (!text || typeof text !== "string") return text || "";
  try {
    return badWordsFilter.clean(text);
  } catch (err) {
    console.error("bad-words clean error:", err);
    return text;
  }
};

const sanitizeReview = (review) => {
  const sanitized = review.toObject ? review.toObject() : { ...review };
  sanitized.comment = cleanBadWords(sanitized.comment);
  sanitized.title = cleanBadWords(sanitized.title);
  return sanitized;
};


const recomputeProductRating = async (productId) => {
  const stats = await Review.aggregate([
    {
      $match: {
        product: new mongoose.Types.ObjectId(productId),
        isHidden: false,
      },
    },
    {
      $group: {
        _id: "$product",
        avg: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
  ]);

  const avg = stats[0]?.avg || 0;
  const count = stats[0]?.count || 0;

  await Product.findByIdAndUpdate(productId, {
    ratings: Math.round(avg * 10) / 10,
    numOfReviews: count,
  });
};




const getOrderFlags = async (userId, productId) => {
  const orders = await Order.find({
    user: userId,
    orderStatus: { $ne: "canceled" },
    "orderItems.product": productId,
  }).select("orderStatus");

  const completed = orders.find((o) => o.orderStatus === "completed");

  return {
    ordered: orders.length > 0,
    received: Boolean(completed),
    orderId: completed?._id,
  };
};

const validateReviewInput = (rating, comment) => {
  const numericRating = Number(rating);
  if (!numericRating || numericRating < 1 || numericRating > 5) {
    return { error: "Rating must be between 1 and 5" };
  }
  return { rating: numericRating, comment: (comment || "").trim() };
};



export const getProductReviews = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid product id" });
    }

    const reviews = await Review.find({ product: id, isHidden: false })
      .populate("user", "firstName lastName profilePicture")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: reviews.length,
      reviews: reviews.map(sanitizeReview),
    });
  } catch (error) {
    console.error("getProductReviews error:", error);
    return res.status(500).json({ success: false, message: "Server error fetching reviews" });
  }
};



export const getMyReview = async (req, res) => {
  try {
    const { id: productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid product id" });
    }

    const [review, flags] = await Promise.all([
      Review.findOne({ product: productId, user: req.user._id }),
      getOrderFlags(req.user._id, productId),
    ]);

    return res.status(200).json({
      success: true,
      review: review ? sanitizeReview(review) : null,
      ordered: flags.ordered,
      received: flags.received,
    });
  } catch (error) {
    console.error("getMyReview error:", error);
    return res.status(500).json({ success: false, message: "Server error fetching your review" });
  }
};



export const createReview = async (req, res) => {
  try {
    const { id: productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid product id" });
    }

  const product = await Product.findById(productId);
  if (!product || product.isArchived) {
    return res
      .status(404)
      .json({ success: false, message: "Product not found" });
  }

  const existing = await Review.findOne({
    product: productId,
    user: req.user._id,
  });
  if (existing) {
    return res.status(409).json({
      success: false,
      message: "You have already reviewed this product. Edit your review instead.",
    });
  }

  const { error, rating, comment } = validateReviewInput(
    req.body.rating,
    req.body.comment,
  );
  if (error) {
    return res.status(400).json({ success: false, message: error });
  }

  const flags = await getOrderFlags(req.user._id, productId);
  if (!flags.received) {
    return res.status(403).json({
      success: false,
      message:
        "You can only review products that have been delivered to you.",
    });
  }

  
  const cleanedTitle = cleanBadWords((req.body.title || "").trim());

  const review = await Review.create({
    product: productId,
    user: req.user._id,
    rating,
    title: cleanedTitle,
    comment,
    isVerifiedPurchase: flags.received,
    order: flags.orderId,
  });

  await recomputeProductRating(productId);
  const updated = await Product.findById(productId).select(
    "ratings numOfReviews",
  );
    return res.status(201).json({
      success: true,
      message: "Review submitted",
      review: sanitizeReview(review),
      ratings: updated.ratings,
      numOfReviews: updated.numOfReviews,
    });
  } catch (error) {
    console.error("createReview error:", error);
    return res.status(500).json({ success: false, message: "Server error creating review" });
  }
};



export const updateReview = async (req, res) => {
  try {
    const { id: productId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid product id" });
  }

  const review = await Review.findOne({
    product: productId,
    user: req.user._id,
  });
  if (!review) {
    return res
      .status(404)
      .json({ success: false, message: "You have not reviewed this product yet" });
  }

  const { error, rating, comment } = validateReviewInput(
    req.body.rating,
    req.body.comment,
  );
  if (error) {
    return res.status(400).json({ success: false, message: error });
  }

  const flags = await getOrderFlags(req.user._id, productId);

  
  review.rating = rating;
  review.title = cleanBadWords((req.body.title || "").trim());
  review.comment = comment;
  review.isVerifiedPurchase = flags.received;
  review.order = flags.orderId;
  await review.save();

  await recomputeProductRating(productId);
  const updated = await Product.findById(productId).select(
    "ratings numOfReviews",
  );
    return res.status(200).json({
      success: true,
      message: "Review updated",
      review: sanitizeReview(review),
      ratings: updated.ratings,
      numOfReviews: updated.numOfReviews,
    });
  } catch (error) {
    console.error("updateReview error:", error);
    return res.status(500).json({ success: false, message: "Server error updating review" });
  }
};



export const deleteMyReview = async (req, res) => {
  try {
    const { id: productId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid product id" });
  }

  const review = await Review.findOne({
    product: productId,
    user: req.user._id,
  });
  if (!review) {
    return res
      .status(404)
      .json({ success: false, message: "You have not reviewed this product yet" });
  }

  await review.deleteOne();
  await recomputeProductRating(productId);

    return res.status(200).json({ success: true, message: "Review deleted" });
  } catch (error) {
    console.error("deleteMyReview error:", error);
    return res.status(500).json({ success: false, message: "Server error deleting review" });
  }
};



export const getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate("product", "name")
      .populate("user", "firstName lastName email profilePicture")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: reviews.length,
      reviews: reviews.map(sanitizeReview),
    });
  } catch (error) {
    console.error("getAllReviews error:", error);
    return res.status(500).json({ success: false, message: "Server error fetching all reviews" });
  }
};



export const toggleReviewVisibility = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
  if (!review) {
    return res
      .status(404)
      .json({ success: false, message: "Review not found" });
  }

  review.isHidden = !review.isHidden;
  await review.save();
  await recomputeProductRating(review.product);

    return res.status(200).json({
      success: true,
      message: review.isHidden ? "Review hidden" : "Review published",
      review,
    });
  } catch (error) {
    console.error("toggleReviewVisibility error:", error);
    return res.status(500).json({ success: false, message: "Server error updating review visibility" });
  }
};
