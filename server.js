// server.js
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import Restaurant from "./models/Restaurants.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/zomatoDB";

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.error("❌ MongoDB Error:", err));

// Root route
app.get("/", (req, res) => {
  res.send("🚀 Zomato API Server is running");
});

// Search restaurants by name or cuisine
app.get("/api/restaurant/search", async (req, res) => {
  try {
    const query = req.query.q || "";
    const regex = new RegExp(query, "i");

    const restaurants = await Restaurant.find({
      $or: [{ name: regex }, { cuisines: regex }]
    }).limit(20);

    res.json(restaurants);
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

// Get restaurant by MongoDB _id
app.get("/api/restaurant/:id", async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });
    res.json(restaurant);
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

// Get restaurant by Excel Restaurant ID
app.get("/api/restaurant/id/:restaurantId", async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ restaurant_id: req.params.restaurantId });
    if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });
    res.json(restaurant);
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

// Get paginated restaurants
app.get("/api/restaurant", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const restaurants = await Restaurant.find().skip(skip).limit(limit);
    const total = await Restaurant.countDocuments();

    res.json({
      page,
      totalPages: Math.ceil(total / limit),
      total,
      data: restaurants,
    });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
