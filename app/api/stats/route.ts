import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Lead from "@/models/Lead";
import Project from "@/models/Project";
import CompanyGoal from "@/models/CompanyGoal";

export async function GET() {
  try {
    await dbConnect();

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Run ALL db queries in parallel — no sequential waiting
    const [
      totalLeads,
      closedLeads,
      totalProjects,
      completedProjects,
      goals,
      projectSums,      // replaces Project.find({}) — aggregated on DB side
      leadsPerMonth,
    ] = await Promise.all([
      Lead.countDocuments(),
      Lead.countDocuments({ status: "Closed" }),
      Project.countDocuments(),
      Project.countDocuments({ status: "Completed" }),
      CompanyGoal.countDocuments(),

      // Single aggregation instead of fetching all documents into memory
      Project.aggregate([
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$amountPaid" },
            totalOutstanding: {
              $sum: { $subtract: [{ $ifNull: ["$totalBudget", 0] }, { $ifNull: ["$amountPaid", 0] }] }
            },
          },
        },
      ]),

      // Lead inflow chart — last 6 months
      Lead.aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo } } },
        { $group: { _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } }, count: { $sum: 1 } } },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),
    ]);

    const totalRevenue = projectSums[0]?.totalRevenue ?? 0;
    const totalOutstanding = projectSums[0]?.totalOutstanding ?? 0;

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const chartData = leadsPerMonth.map((d: any) => ({
      month: monthNames[d._id.month - 1],
      leads: d.count,
    }));

    // Cache the response for 60 seconds on the CDN edge
    return NextResponse.json(
      {
        totalLeads,
        closedLeads,
        conversionRate: totalLeads > 0 ? Math.round((closedLeads / totalLeads) * 100) : 0,
        totalProjects,
        completedProjects,
        totalRevenue,
        totalOutstanding,
        goals,
        chartData,
      },
      {
        headers: {
          "Cache-Control": "s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
