import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import mongoose from "mongoose";

export async function GET() {
  try {
    await dbConnect();

    const db = mongoose.connection.db;
    if (!db) {
      return NextResponse.json({ error: "No DB connection" }, { status: 500 });
    }

    // List all collections and their document counts
    const collections = await db.listCollections().toArray();

    const stats = await Promise.all(
      collections.map(async (col) => {
        const count = await db.collection(col.name).countDocuments();
        return { collection: col.name, documents: count };
      })
    );

    return NextResponse.json({
      status: "✅ Connected to MongoDB Atlas",
      database: db.databaseName,
      collections: stats,
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: "❌ Connection failed", error: error.message },
      { status: 500 }
    );
  }
}
