import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Project from "@/models/Project";

export async function GET() {
  try {
    await dbConnect();
    const projects = await Project.find({}).sort({ createdAt: 1 });

    let totalBudget = 0;
    let totalEarned = 0;
    let totalExpenses = 0;

    const monthlyMap: Record<string, { income: number; expenses: number; budget: number }> = {};
    const weeklyMap: Record<string, { income: number; expenses: number; label: string }> = {};

    projects.forEach((p: any) => {
      totalBudget   += p.totalBudget || 0;
      totalEarned   += p.amountPaid  || 0;
      const expTotal = (p.expenses || []).reduce((s: number, e: any) => s + (e.amount || 0), 0);
      totalExpenses += expTotal;

      const date = new Date(p.createdAt || Date.now());

      // Monthly key
      const mKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (!monthlyMap[mKey]) monthlyMap[mKey] = { income: 0, expenses: 0, budget: 0 };
      monthlyMap[mKey].income   += p.amountPaid || 0;
      monthlyMap[mKey].expenses += expTotal;
      monthlyMap[mKey].budget   += p.totalBudget || 0;

      // Weekly key (week start = Sunday)
      const ws = new Date(date);
      ws.setDate(date.getDate() - date.getDay());
      const wKey = ws.toISOString().slice(0, 10);
      const wLabel = ws.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (!weeklyMap[wKey]) weeklyMap[wKey] = { income: 0, expenses: 0, label: wLabel };
      weeklyMap[wKey].income   += p.amountPaid || 0;
      weeklyMap[wKey].expenses += expTotal;
    });

    const monthly = Object.entries(monthlyMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-8)
      .map(([key, val]) => ({
        period: new Date(key + "-01").toLocaleString("default", { month: "short", year: "2-digit" }),
        income: val.income,
        expenses: val.expenses,
        budget: val.budget,
        profit: val.income - val.expenses,
      }));

    const weekly = Object.entries(weeklyMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-8)
      .map(([, val]) => ({
        period: val.label,
        income: val.income,
        expenses: val.expenses,
        profit: val.income - val.expenses,
      }));

    return NextResponse.json({
      summary: {
        totalBudget,
        totalEarned,
        totalOutstanding: totalBudget - totalEarned,
        totalExpenses,
        netProfit: totalEarned - totalExpenses,
        collectionRate: totalBudget > 0 ? Math.round((totalEarned / totalBudget) * 100) : 0,
      },
      monthly,
      weekly,
      projects: projects.map((p: any) => ({
        _id: p._id,
        title: p.title,
        status: p.status,
        paymentStatus: p.paymentStatus,
        totalBudget: p.totalBudget || 0,
        amountPaid: p.amountPaid || 0,
        amountLeft: (p.totalBudget || 0) - (p.amountPaid || 0),
        expenseTotal: (p.expenses || []).reduce((s: number, e: any) => s + (e.amount || 0), 0),
        expenses: p.expenses || [],
        createdAt: p.createdAt,
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
