import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Lead from "@/models/Lead";
import Project from "@/models/Project";
import CompanyGoal from "@/models/CompanyGoal";
import ActivityLog from "@/models/ActivityLog";

export async function GET(req: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "overview";
    const from = searchParams.get("from");
    const to   = searchParams.get("to");

    // Build date range filter
    const dateFilter: Record<string, any> = {};
    if (from || to) {
      dateFilter.createdAt = {};
      if (from) dateFilter.createdAt.$gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        dateFilter.createdAt.$lte = toDate;
      }
    }

    if (type === "overview") {
      const [
        leadsAdded, leadsContacted, leadsClosed,
        projectsCreated, projectsCompleted,
        tasksAdded, tasksCompleted,
        recentActivities,
      ] = await Promise.all([
        ActivityLog.countDocuments({ ...dateFilter, action: "lead_created" }),
        ActivityLog.countDocuments({ ...dateFilter, action: "lead_contacted" }),
        ActivityLog.countDocuments({ ...dateFilter, action: "status_changed", "meta.newStatus": "Closed" }),
        ActivityLog.countDocuments({ ...dateFilter, action: "project_created" }),
        ActivityLog.countDocuments({ ...dateFilter, action: "status_changed", "meta.newStatus": "Completed", entityType: "Project" }),
        ActivityLog.countDocuments({ ...dateFilter, action: "todo_added" }),
        ActivityLog.countDocuments({ ...dateFilter, action: "todo_completed" }),
        ActivityLog.find(dateFilter).sort({ createdAt: -1 }).limit(50),
      ]);
      return NextResponse.json({
        leadsAdded, leadsContacted, leadsClosed,
        projectsCreated, projectsCompleted,
        tasksAdded, tasksCompleted,
        recentActivities,
      });
    }

    if (type === "leads") {
      const leads = await Lead.find({}).populate("salesmanId").sort({ createdAt: -1 });
      const result = await Promise.all(leads.map(async (lead: any) => {
        const activities = await ActivityLog.find({ entityType: "Lead", entityId: lead._id }).sort({ createdAt: -1 });
        const todosCompleted = lead.todos?.filter((t: any) => t.isCompleted).length || 0;
        const lastActivity = activities[0];
        const firstContacted = activities.find((a: any) => a.action === "lead_contacted");
        return {
          _id: lead._id,
          name: lead.name,
          contactNumber: lead.contactNumber,
          status: lead.status,
          leadSource: lead.leadSource,
          salesman: lead.salesmanId?.name || "—",
          createdAt: lead.createdAt,
          todosTotal: lead.todos?.length || 0,
          todosCompleted,
          firstContactedAt: firstContacted?.createdAt || null,
          lastActivityAt: lastActivity?.createdAt || lead.updatedAt,
          activitiesCount: activities.length,
          activities: activities.slice(0, 20),
        };
      }));
      return NextResponse.json(result);
    }

    if (type === "projects") {
      const projects = await Project.find({}).populate("salesmanId").sort({ createdAt: -1 });
      const result = await Promise.all(projects.map(async (project: any) => {
        const activities = await ActivityLog.find({ entityType: "Project", entityId: project._id }).sort({ createdAt: -1 });
        const tasksTotal = project.tasks?.length || 0;
        const tasksDone  = project.tasks?.filter((t: any) => t.isCompleted).length || 0;
        const expenseTotal = (project.expenses || []).reduce((s: number, e: any) => s + (e.amount || 0), 0);
        return {
          _id: project._id,
          title: project.title,
          status: project.status,
          paymentStatus: project.paymentStatus,
          totalBudget: project.totalBudget || 0,
          amountPaid: project.amountPaid || 0,
          expenseTotal,
          tasksTotal,
          tasksDone,
          createdAt: project.createdAt,
          lastActivityAt: activities[0]?.createdAt || project.updatedAt,
          activitiesCount: activities.length,
          activities: activities.slice(0, 20),
        };
      }));
      return NextResponse.json(result);
    }

    if (type === "goals") {
      const goals = await CompanyGoal.find({}).sort({ createdAt: -1 });
      const result = await Promise.all(goals.map(async (goal: any) => {
        const activities = await ActivityLog.find({ entityType: "Goal", entityId: goal._id }).sort({ createdAt: -1 });
        const total = goal.subtasks?.length || 0;
        const done  = goal.subtasks?.filter((t: any) => t.isCompleted).length || 0;
        return {
          _id: goal._id,
          title: goal.title,
          priority: goal.priority,
          deadline: goal.deadline,
          subtasksTotal: total,
          subtasksDone: done,
          pct: total > 0 ? Math.round((done / total) * 100) : 0,
          createdAt: (goal as any).createdAt,
          lastActivityAt: activities[0]?.createdAt || (goal as any).updatedAt,
          activities: activities.slice(0, 20),
        };
      }));
      return NextResponse.json(result);
    }

    if (type === "finance") {
      const activities = await ActivityLog.find({
        ...dateFilter,
        entityType: "Finance",
      }).sort({ createdAt: -1 }).limit(200);

      // Revenue events from projects
      const paymentEvents = await ActivityLog.find({
        ...dateFilter,
        action: "payment_received",
      }).sort({ createdAt: -1 }).limit(200);

      const allFinanceEvents = [...activities, ...paymentEvents]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const totalExpenses = activities
        .filter(a => a.action === "expense_added")
        .reduce((s, a) => s + (a.meta?.amount || 0), 0);

      return NextResponse.json({ events: allFinanceEvents, totalExpenses });
    }

    if (type === "team") {
      const User = (await import("@/models/User")).default;
      const members = await User.find({}).sort({ joinedAt: -1 });
      const result = await Promise.all(members.map(async (member: any) => {
        const leadsAssigned = await Lead.countDocuments({ salesmanId: member._id });
        const tasksCompleted = await ActivityLog.countDocuments({
          ...dateFilter,
          action: "todo_completed",
        });
        const memberActivities = await ActivityLog.find({ ...dateFilter }).sort({ createdAt: -1 }).limit(5);
        return {
          _id: member._id,
          name: member.name,
          email: member.email,
          role: member.role,
          designation: member.designation,
          joinedAt: member.joinedAt,
          leadsAssigned,
          tasksCompleted,
          lastActive: memberActivities[0]?.createdAt || member.joinedAt,
        };
      }));
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Unknown report type" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
