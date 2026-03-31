import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Lead from "@/models/Lead";
import Project from "@/models/Project";
import CompanyGoal from "@/models/CompanyGoal";

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
        todos.push({ ...todo.toObject(), source: "Lead", sourceName: lead.name, sourceId: lead._id });
      });
    });

    projects.forEach((project) => {
      project.tasks.filter((t: any) => t.addedToTodo).forEach((task: any) => {
        todos.push({ ...task.toObject(), source: "Project", sourceName: project.title, sourceId: project._id });
      });
    });

    goals.forEach((goal) => {
      goal.subtasks.filter((t: any) => t.addedToTodo).forEach((task: any) => {
        todos.push({ ...task.toObject(), source: "Goal", sourceName: goal.title, sourceId: goal._id });
      });
    });

    return NextResponse.json(todos, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
