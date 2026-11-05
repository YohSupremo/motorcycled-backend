import mongoose from "mongoose";


const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    channel: {
      type: String,
      enum: ["in_app", "email"],
      default: "email",
    },
    type: {
      type: String,
      enum: [
        "order_summary",
        "order_status",
        "order_status_update",
        "installment_approved",
        "installment_rejected",
        "downpayment_confirmed",
        "due_reminder",
        "missed_payment",
        "receipt",
        "low_stock",
      ],
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
