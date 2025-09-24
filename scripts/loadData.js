// scripts/loadData.js
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import Restaurant from "../models/Restaurants.js";

const __dirname = path.resolve();
const MONGO_URI = "mongodb://127.0.0.1:27017/zomatoDB";

async function loadData() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const dataDir = path.join(__dirname, "data");
    const files = fs.readdirSync(dataDir);

    for (const file of files) {
      if (!file.endsWith(".json")) continue;

      console.log(`📂 Loading file: ${file}`);
      const rawData = fs.readFileSync(path.join(dataDir, file));
      let jsonData;

      try {
        jsonData = JSON.parse(rawData);
      } catch (err) {
        console.error(`❌ Failed to parse ${file}:`, err.message);
        continue;
      }

      // Extract restaurant array safely
      let restaurantsArray = [];

      if (Array.isArray(jsonData)) {
        // Array of API-like objects
        jsonData.forEach(item => {
          if (Array.isArray(item.restaurants)) {
            const nested = item.restaurants.map(r => r.restaurant);
            restaurantsArray.push(...nested);
          }
        });
      } else if (Array.isArray(jsonData.restaurants)) {
        // Single object with restaurants array
        restaurantsArray = jsonData.restaurants.map(r => r.restaurant);
      } else {
        console.warn(`⚠️ No restaurants found in ${file}, skipping`);
        continue;
      }

      if (restaurantsArray.length === 0) {
        console.warn(`⚠️ No valid restaurants in ${file}, skipping`);
        continue;
      }

      // Map to schema
      const formattedData = restaurantsArray.map(r => ({
        restaurant_id: r.id || r.R?.res_id || "",
        name: r.name || "",
        url: r.url || "",
        location: {
          type: "Point",
          coordinates: [
            r.location?.longitude ? Number(r.location.longitude) : 0,
            r.location?.latitude ? Number(r.location.latitude) : 0
          ]
        },
        address: r.location?.address || "",
        locality: r.location?.locality || "",
        city: r.location?.city || "",
        zipcode: r.location?.zipcode || "",
        country_id: r.location?.country_id || 0,
        cuisines: r.cuisines ? r.cuisines.split(",").map(c => c.trim()) : [],
        average_cost_for_two: r.average_cost_for_two ? Number(r.average_cost_for_two) : 0,
        price_range: r.price_range ? Number(r.price_range) : 0,
        currency: r.currency || "",
        aggregate_rating: r.user_rating?.aggregate_rating ? Number(r.user_rating.aggregate_rating) : 0,
        rating_text: r.user_rating?.rating_text || "",
        votes: r.user_rating?.votes ? Number(r.user_rating.votes) : 0,
        offers: r.offers || [],
        highlights: r.establishment_types || [],
      }));

      // 🔹 Step 1: Deduplicate inside file itself
      const uniqueData = [
        ...new Map(formattedData.map(r => [r.restaurant_id, r])).values()
      ];

      // 🔹 Step 2: Remove those already in DB
      const existingIds = await Restaurant.find(
        { restaurant_id: { $in: uniqueData.map(r => r.restaurant_id) } },
        { restaurant_id: 1, _id: 0 }
      ).lean();

      const existingIdSet = new Set(existingIds.map(r => r.restaurant_id));
      const filteredData = uniqueData.filter(r => !existingIdSet.has(r.restaurant_id));

      // 🔹 Step 3: Insert remaining
      if (filteredData.length > 0) {
        try {
          await Restaurant.insertMany(filteredData, { ordered: false });
          console.log(`✅ Inserted ${filteredData.length} new records from ${file}`);
        } catch (err) {
          console.error(`❌ Error inserting ${file}:`, err.message);
        }
      } else {
        console.log(`⚠️ All records in ${file} are duplicates, skipping`);
      }
    }

    console.log("🎉 All files processed!");
    mongoose.disconnect();
  } catch (error) {
    console.error("❌ Error loading data:", error);
    mongoose.disconnect();
  }
}

loadData();
