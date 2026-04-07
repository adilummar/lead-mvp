import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Project from "@/models/Project";
import ActivityLog from "@/models/ActivityLog";

// POST /api/finance/expense — add an expense to a project
export async function POST(req: Request) {
  try {
    await dbConnect();
    const { projectId, amount, desc } = await req.json();

    if (!projectId || !amount || !desc) {
      return NextResponse.json({ error: "projectId, amount and desc are required" }, { status: 400 });
    }

    const project = await Project.findById(projectId);
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    project.expenses = [...(project.expenses || []), { amount: Number(amount), desc }];
    await project.save();

    await ActivityLog.create({
      entityType: 'Finance',
      entityId: projectId,
      entityName: project.title,
      action: 'expense_added',
      message: `Expense recorded for "${project.title}": ${desc} — ₹${amount}`,
      meta: { amount: Number(amount), desc, projectId, projectTitle: project.title },
    });

    return NextResponse.json({ ok: true, expense: { amount, desc } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/finance/expense — remove an expense by index
export async function DELETE(req: Request) {
  try {
    await dbConnect();
    const { projectId, index } = await req.json();

    const project: any = await Project.findById(projectId);
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const removedExpense = project.expenses[index];
    project.expenses = project.expenses.filter((_: any, i: number) => i !== index);
    await project.save();

    if (removedExpense) {
      await ActivityLog.create({
        entityType: 'Finance',
        entityId: projectId,
        entityName: project.title,
        action: 'expense_removed',
        message: `Expense removed from "${project.title}": ${removedExpense.desc} — ₹${removedExpense.amount}`,
        meta: { amount: removedExpense.amount, desc: removedExpense.desc },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
