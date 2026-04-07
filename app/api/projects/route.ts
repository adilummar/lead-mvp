import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Project from "@/models/Project";
import ActivityLog from "@/models/ActivityLog";

export async function GET() {
  try {
    await dbConnect();
    const projects = await Project.find({}).populate("salesmanId").populate("leadId").sort({ createdAt: -1 });
    return NextResponse.json(projects, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const newProject = await Project.create(body);

    await ActivityLog.create({
      entityType: 'Project',
      entityId: newProject._id,
      entityName: newProject.title,
      action: 'project_created',
      message: `Project "${newProject.title}" was created`,
      meta: { status: newProject.status, totalBudget: newProject.totalBudget },
    });

    return NextResponse.json(newProject, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
