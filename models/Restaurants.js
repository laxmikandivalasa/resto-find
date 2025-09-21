// models/Restaurants.js
import mongoose from "mongoose";

const restaurantSchema = new mongoose.Schema({
  restaurant_id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  url: String,
  location: {
    address: String,
    locality: String,
    city: String,
    city_id: Number,
    latitude: Number,
    longitude: Number,
    zipcode: String,
    country_id: Number,
  },
  cuisines: [String],
  average_cost_for_two: Number,
  price_range: Number,
  currency: String,
  offers: [String],
  aggregate_rating: Number,
  rating_text: String,
  votes: Number,
  highlights: [String],
}, { timestamps: true });

export default mongoose.model("Restaurant", restaurantSchema, "restaurants");
