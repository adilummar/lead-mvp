import mongoose from "mongoose";

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
      throw new Error(
        "Please define the MONGODB_URI environment variable in .env.local"
      );
    }

    const opts = {
      bufferCommands: false,
      // ── Performance: reduce cold-start wait ──
      serverSelectionTimeoutMS: 5000,   // fail fast if Atlas is unreachable
      connectTimeoutMS: 10000,          // TCP handshake timeout
      socketTimeoutMS: 45000,           // idle socket timeout
      maxPoolSize: 10,                  // reuse connections
      minPoolSize: 1,                   // keep at least 1 alive
    };

    cached.promise = mongoose
      .connect(uri, opts)
      .then((m) => {
        console.log("✅ MongoDB connected successfully");
        return m;
      })
      .catch((err) => {
        cached.promise = null;
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
