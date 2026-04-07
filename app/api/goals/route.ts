import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import CompanyGoal from "@/models/CompanyGoal";
import ActivityLog from "@/models/ActivityLog";

export async function GET() {
  try {
    await dbConnect();
    const goals = await CompanyGoal.find({}).sort({ createdAt: -1 });
    return NextResponse.json(goals, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const newGoal = await CompanyGoal.create(body);

    await ActivityLog.create({
      entityType: 'Goal',
      entityId: newGoal._id,
      entityName: newGoal.title,
      action: 'goal_created',
      message: `Goal "${newGoal.title}" was created`,
      meta: { priority: newGoal.priority, deadline: newGoal.deadline },
    });

    return NextResponse.json(newGoal, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
