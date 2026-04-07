import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Lead from "@/models/Lead";
import Project from "@/models/Project";
import CompanyGoal from "@/models/CompanyGoal";
import ProjectUpdate from "@/models/ProjectUpdate";

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { source, sourceId, taskName } = await req.json();

    if (!source || !sourceId || !taskName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let doc: any = null;
    let taskField = "";

    if (source === "Lead") {
      doc = await Lead.findById(sourceId);
      taskField = "todos";
    } else if (source === "Project") {
      doc = await Project.findById(sourceId);
      taskField = "tasks";
    } else if (source === "Goal") {
      doc = await CompanyGoal.findById(sourceId);
      taskField = "subtasks";
    }

    if (!doc) {
      return NextResponse.json({ error: "Source not found" }, { status: 404 });
    }

    const newSubtask = {
      taskName,
      isCompleted: false,
      priority: "Medium",
      assignedToDay: "Later",
      addedToTodo: false,
    };

    doc[taskField].push(newSubtask);
    await doc.save();

    // Log history for Project
    if (source === "Project") {
      await ProjectUpdate.create({
        projectId: doc._id,
        message: `New subtask added: ${taskName}`,
        type: 'Manual',
        taskName: taskName,
      });
    }

    return NextResponse.json({ ok: true, subtask: doc[taskField][doc[taskField].length - 1] }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
