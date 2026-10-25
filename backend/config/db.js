const mongoose = require("mongoose");

async function connectDB() {
  const mongoURI = process.env.MONGO_URI;

  if (!mongoURI) {
    throw new Error("MONGO_URI is missing in backend/.env");
  }

  await mongoose.connect(mongoURI, {
    serverSelectionTimeoutMS: 10000,
  });

  console.log("MongoDB Atlas connected successfully!");
}

module.exports = connectDB;