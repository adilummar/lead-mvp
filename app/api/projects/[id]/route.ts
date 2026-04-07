import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Project from "@/models/Project";
import ActivityLog from "@/models/ActivityLog";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await dbConnect();
    const project = await Project.findById(id).populate("salesmanId").populate("leadId");
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    return NextResponse.json(project, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await dbConnect();
    const body = await req.json();

    const oldProject = await Project.findById(id);

    const updated = await Project.findByIdAndUpdate(id, body, { new: true, runValidators: true });
    if (!updated) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    if (oldProject) {
      // Log status change
      if (body.status && oldProject.status !== body.status) {
        await ActivityLog.create({
          entityType: 'Project',
          entityId: id,
          entityName: oldProject.title,
          action: 'status_changed',
          message: `Project "${oldProject.title}" status changed: ${oldProject.status} → ${body.status}`,
          meta: { oldStatus: oldProject.status, newStatus: body.status },
        });
      }
      // Log payment update
      if (body.amountPaid !== undefined && body.amountPaid !== oldProject.amountPaid) {
        await ActivityLog.create({
          entityType: 'Project',
          entityId: id,
          entityName: oldProject.title,
          action: 'payment_received',
          message: `Payment updated for "${oldProject.title}": ₹${oldProject.amountPaid} → ₹${body.amountPaid}`,
          meta: { oldAmount: oldProject.amountPaid, newAmount: body.amountPaid, totalBudget: oldProject.totalBudget },
        });
      }
      // Log payment status change
      if (body.paymentStatus && body.paymentStatus !== oldProject.paymentStatus) {
        await ActivityLog.create({
          entityType: 'Finance',
          entityId: id,
          entityName: oldProject.title,
          action: 'payment_status_changed',
          message: `Payment status for "${oldProject.title}": ${oldProject.paymentStatus} → ${body.paymentStatus}`,
          meta: { oldStatus: oldProject.paymentStatus, newStatus: body.paymentStatus, amountPaid: body.amountPaid },
        });
      }
    }

    return NextResponse.json(updated, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await dbConnect();
    const deleted = await Project.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    await ActivityLog.deleteMany({ entityType: 'Project', entityId: id });
    return NextResponse.json({ message: "Project deleted" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
