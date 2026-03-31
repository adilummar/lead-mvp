import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import CompanyGoal from "@/models/CompanyGoal";

export async function GET() {
  try {
    await dbConnect();
    const goals = await CompanyGoal.find({}).sort({ createdAt: -1 });
    return NextResponse.json(goals, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const newGoal = await CompanyGoal.create(body);
    return NextResponse.json(newGoal, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
