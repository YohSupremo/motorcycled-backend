import "dotenv/config";
import mongoose from "mongoose";
import connection from "./config/db.js";
import User from "./model/User.js";
import Product from "./model/Product.js";
import Category from "./model/Category.js";
import Brand from "./model/Brand.js";
import Supplier from "./model/Supplier.js";
import Order from "./model/Order.js";
import Review from "./model/Review.js";
import Notification from "./model/Notification.js";
import InstallmentApplication from "./model/InstallmentApplication.js";
import InventoryTransaction from "./model/InventoryTransaction.js";

const categoryNames = [
  "Motorcycles",
  "Engine Parts",
  "Brakes",
  "Tires and Wheels",
  "Helmets",
  "Riding Gear",
  "Accessories",
  "Lubricants",
];

const brandNames = ["Honda", "Yamaha", "Suzuki", "Kawasaki", "CFMOTO"];

const productDefinitions = [
  ["Honda Click 125i", "Motorcycles", "Honda", 84900, 64000, 8],
  ["Yamaha Mio Aerox 155", "Motorcycles", "Yamaha", 125000, 93000, 7],
  ["Suzuki Raider R150", "Motorcycles", "Suzuki", 97800, 73000, 6],
  ["Kawasaki Ninja 400", "Motorcycles", "Kawasaki", 338000, 252000, 5],
  ["CFMOTO 300SR", "Motorcycles", "CFMOTO", 268000, 199000, 5],
  ["Honda Genuine Oil Filter", "Engine Parts", "Honda", 420, 230, 18],
  ["Yamaha Air Filter Element", "Engine Parts", "Yamaha", 680, 390, 16],
  ["Suzuki Drive Belt", "Engine Parts", "Suzuki", 1450, 850, 14],
  ["Kawasaki Clutch Cable", "Engine Parts", "Kawasaki", 760, 420, 15],
  ["CFMOTO Spark Plug Set", "Engine Parts", "CFMOTO", 980, 560, 12],
  ["Honda Front Brake Pads", "Brakes", "Honda", 1250, 700, 16],
  ["Yamaha Rear Brake Shoes", "Brakes", "Yamaha", 980, 540, 15],
  ["Suzuki Stainless Brake Hose", "Brakes", "Suzuki", 1750, 980, 12],
  ["Kawasaki ABS Brake Pads", "Brakes", "Kawasaki", 2200, 1300, 10],
  ["Honda Alloy Wheel Set", "Tires and Wheels", "Honda", 7800, 4700, 9],
  ["Yamaha Road Tire 110/70", "Tires and Wheels", "Yamaha", 3900, 2350, 11],
  ["Kawasaki Full Face Helmet", "Helmets", "Kawasaki", 5200, 3000, 10],
  ["CFMOTO Modular Helmet", "Helmets", "CFMOTO", 6800, 3950, 9],
  ["Honda Riding Jacket", "Riding Gear", "Honda", 4500, 2600, 10],
  ["Yamaha Chain and Sprocket Kit", "Accessories", "Yamaha", 3600, 2100, 12],
];

const salePlan = [
  [88, 0, 1],
  [81, 5, 2],
  [74, 1, 1],
  [68, 10, 2],
  [61, 6, 1],
  [55, 2, 1],
  [49, 14, 1],
  [43, 7, 2],
  [36, 11, 1],
  [30, 16, 1],
  [23, 8, 1],
  [17, 15, 2],
  [11, 3, 1],
  [6, 18, 1],
  [2, 19, 2],
  [86, 17, 1],
  [80, 0, 1],
  [73, 0, 1],
  [66, 0, 1],
  [59, 1, 1],
  [52, 1, 1],
  [45, 1, 1],
  [38, 2, 1],
  [31, 2, 1],
  [24, 3, 1],
  [18, 4, 1],
  [14, 5, 1],
  [10, 6, 1],
  [8, 7, 1],
  [5, 8, 1],
  [4, 9, 1],
  [3, 10, 1],
  [1, 11, 1],
  [7, 12, 1],
  [12, 13, 1],
];

const dateDaysAgo = (days, hour = 10) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, (days * 7) % 60, 0, 0);
  return date;
};

const makeReference = (prefix, runId, index) =>
  `${prefix}-DEMO-${runId}-${String(index + 1).padStart(3, "0")}`;

const getOrCreateLookup = async (Model, names) => {
  const documents = [];
  for (const name of names) {
    documents.push(
      await Model.findOneAndUpdate(
        { name },
        { $set: { name, isArchived: false } },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      ),
    );
  }
  return new Map(documents.map((document) => [document.name, document]));
};

const resetShopData = async () => {
  await Promise.all([
    Product.deleteMany({}),
    Order.deleteMany({}),
    Review.deleteMany({}),
    Notification.deleteMany({}),
    InstallmentApplication.deleteMany({}),
    InventoryTransaction.deleteMany({}),
    Supplier.deleteMany({}),
  ]);
};

const seedDemoShop = async () => {
  await connection();

  const [admin, users] = await Promise.all([
    User.findOne({ role: "admin", isActive: true }).sort({ createdAt: 1 }),
    User.find({ role: { $ne: "admin" }, isActive: true }).sort({ createdAt: 1 }),
  ]);

  if (!admin) {
    throw new Error("Cannot seed shop data: at least one active admin account is required.");
  }

  const customers = users.length > 0 ? users : [admin];
  const categories = await getOrCreateLookup(Category, categoryNames);
  const brands = await getOrCreateLookup(Brand, brandNames);
  const runId = Date.now().toString(36).toUpperCase();

  await resetShopData();

  const supplierNames = [
    "MotoHub Wholesale Supply",
    "RiderPro Distribution",
    "OEM Drive Philippines",
    "Metro Moto Parts",
    "RoadReady Trading",
    "Prime Gear Depot",
    "Velocity Motor Supply",
    "Urban Rider Wholesale",
    "Apex OEM Imports",
    "Northstar Moto Supply",
    "Southline Parts Trading",
    "MotoWorks Distribution",
    "GearGrid Philippines",
    "TorqueHouse Supply",
    "RideSafe Essentials",
    "TwoWheel Depot",
    "MotoCore Wholesale",
    "Piston and Chain Trading",
    "StreetSpec Supply",
    "Island Moto Imports",
  ];
  const suppliers = [];
  for (const [index, name] of supplierNames.entries()) {
    suppliers.push(
      await Supplier.findOneAndUpdate(
        { name },
        {
          $set: {
            name,
            contactPerson: `Supplier Contact ${index + 1}`,
            email: `supplier${index + 1}@demo.example`,
            phone: `0917000${String(index + 1).padStart(4, "0")}`,
            address: "Metro Manila, Philippines",
            deletedAt: null,
          },
        },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      ),
    );
  }

  const productRows = productDefinitions.map(
    ([name, categoryName, brandName, price, costPrice, initialStock]) => ({
      name,
      description: "",
      category: categories.get(categoryName)._id,
      brand: brands.get(brandName)._id,
      compatibleModels: [],
      price,
      costPrice,
      stock: initialStock,
      lowStockThreshold: 5,
      images: [],
      installmentEligible: categoryName === "Motorcycles",
      minInstallmentPrice: categoryName === "Motorcycles" ? Math.round(price * 0.2) : 0,
      isArchived: false,
      isFeatured: false,
      user: admin._id,
    }),
  );
  const products = await Product.insertMany(productRows);

  const restockTransactions = products.map((product, index) => ({
    transactionRef: makeReference("TXN-RESTOCK", runId, index),
    product: product._id,
    productName: product.name,
    type: "restock",
    quantityChange: product.stock,
    supplierId: suppliers[index % suppliers.length]._id.toString(),
    supplierName: suppliers[index % suppliers.length].name,
    unitCost: product.costPrice,
    performedBy: admin._id,
    performedByName: `${admin.firstName} ${admin.lastName}`.trim(),
    note: "Initial demo inventory restock",
    createdAt: dateDaysAgo(89 - (index % 10) * 8, 9 + (index % 4)),
    updatedAt: dateDaysAgo(89 - (index % 10) * 8, 9 + (index % 4)),
  }));
  await InventoryTransaction.insertMany(restockTransactions);

  const salesByProduct = new Map();
  for (const [, productIndex, quantity] of salePlan) {
    salesByProduct.set(productIndex, (salesByProduct.get(productIndex) || 0) + quantity);
  }

  for (const [productIndex, soldQuantity] of salesByProduct) {
    const product = products[productIndex];
    if (soldQuantity >= product.stock) {
      throw new Error(`Demo sale plan exceeds stock for ${product.name}`);
    }
    product.stock -= soldQuantity;
    await product.save();
  }

  const orders = [];
  const saleTransactions = [];
  for (const [saleIndex, [daysAgo, productIndex, quantity]] of salePlan.entries()) {
    const product = products[productIndex];
    const customer = customers[saleIndex % customers.length];
    const createdAt = dateDaysAgo(daysAgo, 11 + (saleIndex % 6));
    const orderNumber = `MC-DEMO-${runId}-${String(saleIndex + 1).padStart(3, "0")}`;

    orders.push({
      orderNumber,
      checkoutSessionId: `demo-checkout-${saleIndex + 1}`,
      user: customer._id,
      orderItems: [
        {
          product: product._id,
          name: product.name,
          quantity,
          price: product.price,
          costPrice: product.costPrice,
          image: "",
          itemType: productDefinitions[productIndex][1] === "Motorcycles" ? "motorcycle" : "part",
        },
      ],
      shippingInfo: {
        recipientName: `${customer.firstName} ${customer.lastName}`.trim(),
        contactNumber: customer.contactNumber || "09000000000",
        email: customer.email,
        fulfillmentMethod: productDefinitions[productIndex][1] === "Motorcycles" ? "pickup" : "delivery",
        partsFulfillmentMethod: productDefinitions[productIndex][1] === "Motorcycles" ? "pickup" : "delivery",
        address: "Demo customer address",
        city: "Metro Manila",
        postalCode: "1000",
        branch: "Main Dealership",
      },
      paymentMethod: saleIndex % 3 === 0 ? "cash_on_releasing" : "gcash",
      paymentStatus: "paid",
      itemsPrice: product.price * quantity,
      shippingPrice: productDefinitions[productIndex][1] === "Motorcycles" ? 0 : 350,
      totalPrice: product.price * quantity + (productDefinitions[productIndex][1] === "Motorcycles" ? 0 : 350),
      orderStatus: "completed",
      paidAt: createdAt,
      deliveredAt: createdAt,
      createdAt,
      updatedAt: createdAt,
    });

    saleTransactions.push({
      transactionRef: makeReference("TXN-SALE", runId, saleIndex),
      product: product._id,
      productName: product.name,
      type: "sale",
      quantityChange: -quantity,
      orderRef: orderNumber,
      unitCost: product.costPrice,
      performedBy: admin._id,
      performedByName: `${admin.firstName} ${admin.lastName}`.trim(),
      note: "Historical demo sale",
      createdAt,
      updatedAt: createdAt,
    });
  }

  const insertedOrders = await Order.insertMany(orders);
  await InventoryTransaction.insertMany(saleTransactions);

  const reviewTemplates = [
    ["Great purchase", "The product arrived in excellent condition and matched the listing."],
    ["Good value", "The quality is good for the price and the buying process was smooth."],
    ["Would recommend", "Everything was ready for pickup and the product performs as expected."],
    ["Solid quality", "The item feels durable and the dealership support was helpful."],
    ["Happy with it", "The product matched the description and was easy to purchase."],
  ];

  const reviews = [];
  const reviewKeys = new Set();
  for (const [index, order] of insertedOrders.entries()) {
    if (reviews.length >= 20) break;
    const item = order.orderItems[0];
    const reviewKey = `${order.user.toString()}-${item.product.toString()}`;
    if (reviewKeys.has(reviewKey)) continue;
    reviewKeys.add(reviewKey);
    const [title, comment] = reviewTemplates[index % reviewTemplates.length];
    const reviewedAt = new Date(order.createdAt);
    reviewedAt.setDate(reviewedAt.getDate() + 1);

    reviews.push({
      product: item.product,
      user: order.user,
      order: order._id,
      rating: 4 + (index % 2),
      title,
      comment,
      isVerifiedPurchase: true,
      isHidden: false,
      seedId: `demo-review-${runId}-${String(index + 1).padStart(3, "0")}`,
      createdAt: reviewedAt,
      updatedAt: reviewedAt,
    });
  }
  await Review.insertMany(reviews);

  for (const product of products) {
    const productReviews = reviews.filter(
      (review) => review.product.toString() === product._id.toString(),
    );
    if (productReviews.length === 0) continue;

    product.ratings =
      productReviews.reduce((sum, review) => sum + review.rating, 0) /
      productReviews.length;
    product.numOfReviews = productReviews.length;
    await product.save();
  }

  console.log(
    `Seeded ${products.length} products, ${suppliers.length} suppliers, ${insertedOrders.length} completed sales, and ${reviews.length} verified reviews.`,
  );
  console.log(`Preserved ${await User.countDocuments()} existing user accounts.`);
};

seedDemoShop()
  .catch((error) => {
    console.error("Demo shop seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
