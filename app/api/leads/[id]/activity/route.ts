import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import LeadActivity from "@/models/LeadActivity";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await dbConnect();
    const activities = await LeadActivity.find({ leadId: id }).sort({ createdAt: -1 });
    return NextResponse.json(activities, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await dbConnect();
    const body = await req.json();
    const activity = await LeadActivity.create({
      leadId: id,
      message: body.message,
      type: body.type || "Note",
    });
    return NextResponse.json(activity, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
