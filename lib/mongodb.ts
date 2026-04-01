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
    let uri = process.env.MONGODB_URI;

    if (!uri) {
      throw new Error(
        "Please define the MONGODB_URI environment variable in .env.local"
      );
    }

    // In-memory MongoDB for local zero-config development
    if (uri === "auto") {
      try {
        const { MongoMemoryServer } = await import("mongodb-memory-server");
        if (!(global as any).mongoServer) {
          console.log("🚀 Starting in-memory MongoDB...");
          const mongoServer = await MongoMemoryServer.create();
          (global as any).mongoServer = mongoServer;
        }
        uri = (global as any).mongoServer.getUri();
        console.log("🎯 In-memory DB URI:", uri);
      } catch (err) {
        console.error("❌ Failed to start in-memory MongoDB:", err);
        throw err;
      }
    }

    const opts = { bufferCommands: false };

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
