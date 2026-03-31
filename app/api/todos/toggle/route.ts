import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Lead from "@/models/Lead";
import Project from "@/models/Project";
import CompanyGoal from "@/models/CompanyGoal";

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

    doc[taskField] = doc[taskField].map((t: any) => {
      if (t._id.toString() === taskId) {
        t.isCompleted = !t.isCompleted;
      }
      return t;
    });

    await doc.save();
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
