import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Lead from "@/models/Lead";
import Project from "@/models/Project";
import CompanyGoal from "@/models/CompanyGoal";
import ActivityLog from "@/models/ActivityLog";

// Toggle isCompleted on a specific subtask
export async function POST(req: Request) {
  try {
    await dbConnect();
    const { source, sourceId, taskId } = await req.json();

    const taskField = source === "Lead" ? "todos" : source === "Project" ? "tasks" : "subtasks";

    let doc: any = null;
    if (source === "Lead")    doc = await Lead.findById(sourceId);
    if (source === "Project") doc = await Project.findById(sourceId);
    if (source === "Goal")    doc = await CompanyGoal.findById(sourceId);

    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

    let taskName = "";
    let nowCompleted = false;

    doc[taskField] = doc[taskField].map((t: any) => {
      if (t._id.toString() === taskId) {
        nowCompleted = !t.isCompleted;
        t.isCompleted = nowCompleted;
        t.completedAt = nowCompleted ? new Date() : undefined;
        taskName = t.taskName;
      }
      return t;
    });

    await doc.save();

    const entityName = source === "Lead" ? doc.name : source === "Project" ? doc.title : doc.title;

    // Auto-log lead activity for task completion
    if (source === "Lead" && nowCompleted) {
      const LeadActivity = (await import("@/models/LeadActivity")).default;
      await LeadActivity.create({
        leadId: sourceId,
        message: `Task completed: "${taskName}"`,
        type: 'TaskDone',
      });
    }

    // Auto-log project update for task completion
    if (source === "Project" && nowCompleted) {
      const ProjectUpdate = (await import("@/models/ProjectUpdate")).default;
      await ProjectUpdate.create({
        projectId: sourceId,
        message: `Task completed: ${taskName}`,
        type: 'TaskDone',
        taskName,
      });
    }

    // Unified activity log
    await ActivityLog.create({
      entityType: source as any,
      entityId: sourceId,
      entityName,
      action: nowCompleted ? 'todo_completed' : 'todo_reopened',
      message: nowCompleted
        ? `Task "${taskName}" completed in ${source}: "${entityName}"`
        : `Task "${taskName}" reopened in ${source}: "${entityName}"`,
      meta: { taskName, completedAt: nowCompleted ? new Date() : null, source },
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
