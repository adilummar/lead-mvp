import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Lead from "@/models/Lead";
import Project from "@/models/Project";
import CompanyGoal from "@/models/CompanyGoal";
import ActivityLog from "@/models/ActivityLog";

/**
 * Compute assignedToDay bucket from a real dueDate.
 */
function computeAssignedToDay(dueDate?: Date | string): "Today" | "Tomorrow" | "Later" {
  if (!dueDate) return "Later";
  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrowMidnight = new Date(todayMidnight);
  tomorrowMidnight.setDate(tomorrowMidnight.getDate() + 1);

  const due = new Date(dueDate);
  const dueMidnight = new Date(due.getFullYear(), due.getMonth(), due.getDate());

  if (dueMidnight <= todayMidnight) return "Today";
  if (dueMidnight.getTime() === tomorrowMidnight.getTime()) return "Tomorrow";
  return "Later";
}

// Unified endpoint to schedule / unschedule a subtask into Master Todo
export async function POST(req: Request) {
  try {
    await dbConnect();
    const { source, sourceId, taskId, addedToTodo, assignedToDay, dueDate, priority, assignedToUser } = await req.json();

    const taskField = source === "Lead" ? "todos" : source === "Project" ? "tasks" : "subtasks";

    let doc: any = null;
    if (source === "Lead")    doc = await Lead.findById(sourceId);
    if (source === "Project") doc = await Project.findById(sourceId);
    if (source === "Goal")    doc = await CompanyGoal.findById(sourceId);

    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

    let updatedTaskName = "";
    // Resolve the final dueDate: use explicit dueDate param if provided, or fall back to assignedToDay
    let resolvedDueDate: Date | undefined;
    if (dueDate) {
      resolvedDueDate = new Date(dueDate);
    } else if (assignedToDay === "Today") {
      resolvedDueDate = new Date(); resolvedDueDate.setHours(0, 0, 0, 0);
    } else if (assignedToDay === "Tomorrow") {
      resolvedDueDate = new Date(); resolvedDueDate.setDate(resolvedDueDate.getDate() + 1); resolvedDueDate.setHours(0, 0, 0, 0);
    }

    const computedDay = resolvedDueDate ? computeAssignedToDay(resolvedDueDate) : (assignedToDay || "Later");

    doc[taskField] = doc[taskField].map((t: any) => {
      if (t._id.toString() === taskId) {
        t.addedToTodo = addedToTodo;
        if (resolvedDueDate) t.dueDate = resolvedDueDate;
        t.assignedToDay = computedDay;
        if (priority) t.priority = priority;
        if (assignedToUser !== undefined) t.assignedToUser = assignedToUser ? assignedToUser : undefined;
        if (!t.createdDate) t.createdDate = new Date();
        updatedTaskName = t.taskName;
      }
      return t;
    });

    await doc.save();

    const entityName = source === "Lead" ? doc.name : source === "Project" ? doc.title : doc.title;

    // Log history if project (keep backward compat)
    if (source === "Project" && addedToTodo) {
      const ProjectUpdate = (await import("@/models/ProjectUpdate")).default;
      await ProjectUpdate.create({
        projectId: doc._id,
        message: `Task scheduled to todos: ${updatedTaskName}`,
        type: 'Manual',
        taskName: updatedTaskName,
      });
    }

    // Unified activity log
    if (addedToTodo) {
      await ActivityLog.create({
        entityType: source as any,
        entityId: sourceId,
        entityName,
        action: 'todo_scheduled',
        message: `Task "${updatedTaskName}" scheduled${resolvedDueDate ? ` for ${resolvedDueDate.toLocaleDateString('en-IN')}` : ''} from ${source}: "${entityName}"`,
        meta: { taskName: updatedTaskName, dueDate: resolvedDueDate, assignedToDay: computedDay, priority, source },
      });
    } else {
      await ActivityLog.create({
        entityType: source as any,
        entityId: sourceId,
        entityName,
        action: 'todo_unscheduled',
        message: `Task "${updatedTaskName}" removed from schedule in ${source}: "${entityName}"`,
        meta: { taskName: updatedTaskName },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
