import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import CompanyGoal from "@/models/CompanyGoal";
import ActivityLog from "@/models/ActivityLog";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await dbConnect();
    const body = await req.json();

    const oldGoal = await CompanyGoal.findById(id);
    const updated = await CompanyGoal.findByIdAndUpdate(id, body, { new: true });
    if (!updated) return NextResponse.json({ error: "Goal not found" }, { status: 404 });

    if (oldGoal) {
      // Detect subtask changes
      const oldCount = oldGoal.subtasks?.length || 0;
      const newCount = body.subtasks?.length || 0;

      if (newCount > oldCount) {
        const added = body.subtasks[body.subtasks.length - 1];
        await ActivityLog.create({
          entityType: 'Goal',
          entityId: id,
          entityName: oldGoal.title,
          action: 'todo_added',
          message: `Task added to goal "${oldGoal.title}": "${added.taskName}"`,
          meta: { taskName: added.taskName },
        });
      }

      // Detect task completions
      if (body.subtasks && oldGoal.subtasks) {
        for (let i = 0; i < body.subtasks.length && i < oldGoal.subtasks.length; i++) {
          const wasCompleted = oldGoal.subtasks[i]?.isCompleted;
          const isNowCompleted = body.subtasks[i]?.isCompleted;
          if (!wasCompleted && isNowCompleted) {
            await ActivityLog.create({
              entityType: 'Goal',
              entityId: id,
              entityName: oldGoal.title,
              action: 'todo_completed',
              message: `Task completed in goal "${oldGoal.title}": "${body.subtasks[i].taskName}"`,
              meta: { taskName: body.subtasks[i].taskName, completedAt: new Date() },
            });
          }
        }
      }

      // Detect title/priority/deadline change
      if (body.title && body.title !== oldGoal.title) {
        await ActivityLog.create({
          entityType: 'Goal',
          entityId: id,
          entityName: updated.title,
          action: 'goal_updated',
          message: `Goal renamed: "${oldGoal.title}" → "${body.title}"`,
          meta: { oldTitle: oldGoal.title, newTitle: body.title },
        });
      }
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await dbConnect();
    const goal = await CompanyGoal.findById(id);
    await CompanyGoal.findByIdAndDelete(id);
    await ActivityLog.deleteMany({ entityType: 'Goal', entityId: id });
    return NextResponse.json({ message: "Goal deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
