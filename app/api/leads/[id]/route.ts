import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Lead from "@/models/Lead";
import LeadActivity from "@/models/LeadActivity";
import ActivityLog from "@/models/ActivityLog";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await dbConnect();
    const body = await req.json();

    const oldLead = await Lead.findById(id);
    if (!oldLead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

    // Check for status change to auto-log
    if (body.status && oldLead.status !== body.status) {
      await LeadActivity.create({
        leadId: id,
        message: `Status changed: ${oldLead.status} → ${body.status}`,
        type: 'StatusChange',
      });
      await ActivityLog.create({
        entityType: 'Lead',
        entityId: id,
        entityName: oldLead.name,
        action: 'status_changed',
        message: `Lead "${oldLead.name}" status changed: ${oldLead.status} → ${body.status}`,
        meta: { oldStatus: oldLead.status, newStatus: body.status },
      });

      // Log "contacted" action specifically
      if (body.status === 'Contacted') {
        await ActivityLog.create({
          entityType: 'Lead',
          entityId: id,
          entityName: oldLead.name,
          action: 'lead_contacted',
          message: `Lead "${oldLead.name}" was contacted`,
          meta: { contactedAt: new Date() },
        });
      }
    }

    // Detect todo additions
    if (body.todos && oldLead.todos) {
      const oldCount = oldLead.todos.length;
      const newCount = body.todos.length;
      if (newCount > oldCount) {
        const addedTodo = body.todos[body.todos.length - 1];
        await ActivityLog.create({
          entityType: 'Lead',
          entityId: id,
          entityName: oldLead.name,
          action: 'todo_added',
          message: `Todo added to lead "${oldLead.name}": "${addedTodo.taskName}"`,
          meta: { taskName: addedTodo.taskName, dueDate: addedTodo.dueDate },
        });
      }
    }

    const updatedLead = await Lead.findByIdAndUpdate(id, body, { new: true, runValidators: true });
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
    // Also clean up activity history
    await LeadActivity.deleteMany({ leadId: id });
    await ActivityLog.deleteMany({ entityType: 'Lead', entityId: id });
    return NextResponse.json({ message: "Lead deleted successfully" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
