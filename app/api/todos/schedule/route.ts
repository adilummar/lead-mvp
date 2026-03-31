import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Lead from "@/models/Lead";
import Project from "@/models/Project";
import CompanyGoal from "@/models/CompanyGoal";

// Unified endpoint to schedule / unschedule a subtask into Master Todo
export async function POST(req: Request) {
  try {
    await dbConnect();
    const { source, sourceId, taskId, addedToTodo, assignedToDay, priority } = await req.json();

    const taskField = source === "Lead" ? "todos" : source === "Project" ? "tasks" : "subtasks";

    let doc: any = null;
    if (source === "Lead")    doc = await Lead.findById(sourceId);
    if (source === "Project") doc = await Project.findById(sourceId);
    if (source === "Goal")    doc = await CompanyGoal.findById(sourceId);

    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

    doc[taskField] = doc[taskField].map((t: any) => {
      if (t._id.toString() === taskId) {
        t.addedToTodo = addedToTodo;
        if (assignedToDay) t.assignedToDay = assignedToDay;
        if (priority) t.priority = priority;
      }
      return t;
    });

    await doc.save();
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
