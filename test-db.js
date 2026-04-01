import dbConnect from "./lib/mongodb.js";
import Lead from "./models/Lead.js";

async function test() {
  process.env.MONGODB_URI = "auto";
  try {
    console.log("Connecting...");
    await dbConnect();
    console.log("Connected! Creating model...");
    const count = await Lead.countDocuments();
    console.log("Lead count in memory DB:", count);
    process.exit(0);
  } catch (err) {
    console.error("Test failed:", err);
    process.exit(1);
  }
}

test();
