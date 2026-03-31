import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Lead from "@/models/Lead";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await dbConnect();
    const body = await req.json();
    const updatedLead = await Lead.findByIdAndUpdate(id, body, { new: true, runValidators: true });
    if (!updatedLead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    return NextResponse.json(updatedLead, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await dbConnect();
    const deletedLead = await Lead.findByIdAndDelete(id);
    if (!deletedLead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    return NextResponse.json({ message: "Lead deleted successfully" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
