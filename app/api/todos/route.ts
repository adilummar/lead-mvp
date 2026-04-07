import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Lead from "@/models/Lead";
import Project from "@/models/Project";
import CompanyGoal from "@/models/CompanyGoal";

/**
 * Re-compute the display bucket for a task based on its real dueDate.
 * This ensures "Tomorrow" tasks automatically become "Today" when the day arrives,
 * rather than staying frozen as "Tomorrow" forever.
 */
function computeAssignedToDay(task: any): "Today" | "Tomorrow" | "Later" {
  if (!task.dueDate) return task.assignedToDay ?? "Later";

  // Use local midnight dates to avoid timezone skew
  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrowMidnight = new Date(todayMidnight);
  tomorrowMidnight.setDate(tomorrowMidnight.getDate() + 1);

  const due = new Date(task.dueDate);
  const dueMidnight = new Date(due.getFullYear(), due.getMonth(), due.getDate());

  if (dueMidnight <= todayMidnight) return "Today";
  if (dueMidnight.getTime() === tomorrowMidnight.getTime()) return "Tomorrow";
  return "Later";
}

// Only returns subtasks that were explicitly scheduled into the Master Todo
export async function GET() {
  try {
    await dbConnect();

    const leads = await Lead.find({});
    const projects = await Project.find({});
    const goals = await CompanyGoal.find({});

    const todos: any[] = [];

    leads.forEach((lead) => {
      lead.todos.filter((t: any) => t.addedToTodo).forEach((todo: any) => {
        const obj = todo.toObject();
        todos.push({ ...obj, assignedToDay: computeAssignedToDay(obj), source: "Lead", sourceName: lead.name, sourceId: lead._id });
      });
    });

    projects.forEach((project) => {
      project.tasks.filter((t: any) => t.addedToTodo).forEach((task: any) => {
        const obj = task.toObject();
        todos.push({ ...obj, assignedToDay: computeAssignedToDay(obj), source: "Project", sourceName: project.title, sourceId: project._id });
      });
    });

    goals.forEach((goal) => {
      goal.subtasks.filter((t: any) => t.addedToTodo).forEach((task: any) => {
        const obj = task.toObject();
        todos.push({ ...obj, assignedToDay: computeAssignedToDay(obj), source: "Goal", sourceName: goal.title, sourceId: goal._id });
      });
    });

    return NextResponse.json(todos, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
