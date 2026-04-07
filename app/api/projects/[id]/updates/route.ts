import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import ProjectUpdate from "@/models/ProjectUpdate";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await dbConnect();
    const updates = await ProjectUpdate.find({ projectId: id }).sort({ date: -1, createdAt: -1 });
    return NextResponse.json(updates, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await dbConnect();
    const body = await req.json();
    const update = await ProjectUpdate.create({
      projectId: id,
      message: body.message,
      type: body.type || "Manual",
      date: body.date || new Date(),
      taskName: body.taskName,
    });
    return NextResponse.json(update, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const updateId = searchParams.get("updateId");
    if (!updateId) return NextResponse.json({ error: "updateId required" }, { status: 400 });
    await ProjectUpdate.findByIdAndDelete(updateId);
    return NextResponse.json({ message: "Deleted" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
