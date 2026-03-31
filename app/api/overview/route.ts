import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Lead from "@/models/Lead";
import Project from "@/models/Project";
import CompanyGoal from "@/models/CompanyGoal";

export async function GET() {
  try {
    await dbConnect();
    const [leads, projects, goals] = await Promise.all([
      Lead.find({}).sort({ createdAt: -1 }),
      Project.find({}).sort({ createdAt: -1 }),
      CompanyGoal.find({}).sort({ createdAt: -1 }),
    ]);
    return NextResponse.json({ leads, projects, goals });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
