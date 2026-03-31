import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Lead from "@/models/Lead";
import Project from "@/models/Project";
import CompanyGoal from "@/models/CompanyGoal";

export async function GET() {
  try {
    await dbConnect();

    const [totalLeads, closedLeads, totalProjects, completedProjects, goals] = await Promise.all([
      Lead.countDocuments(),
      Lead.countDocuments({ status: "Closed" }),
      Project.countDocuments(),
      Project.countDocuments({ status: "Completed" }),
      CompanyGoal.countDocuments(),
    ]);

    const projects = await Project.find({});
    const totalRevenue = projects.reduce((acc, p) => acc + (p.amountPaid || 0), 0);
    const totalOutstanding = projects.reduce((acc, p) => acc + ((p.totalBudget || 0) - (p.amountPaid || 0)), 0);

    // Lead inflow per month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const leadsPerMonth = await Lead.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } }, count: { $sum: 1 } } },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const chartData = leadsPerMonth.map((d: any) => ({
      month: monthNames[d._id.month - 1],
      leads: d.count,
    }));

    return NextResponse.json({
      totalLeads,
      closedLeads,
      conversionRate: totalLeads > 0 ? Math.round((closedLeads / totalLeads) * 100) : 0,
      totalProjects,
      completedProjects,
      totalRevenue,
      totalOutstanding,
      goals,
      chartData,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
