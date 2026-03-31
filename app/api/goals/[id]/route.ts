import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import CompanyGoal from "@/models/CompanyGoal";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await dbConnect();
    const body = await req.json();
    const updated = await CompanyGoal.findByIdAndUpdate(id, body, { new: true });
    if (!updated) return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await dbConnect();
    await CompanyGoal.findByIdAndDelete(id);
    return NextResponse.json({ message: "Goal deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
