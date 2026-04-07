import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import ActivityLog from "@/models/ActivityLog";

export async function GET(req: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);

    const entityType = searchParams.get("entityType");
    const entityId   = searchParams.get("entityId");
    const from       = searchParams.get("from");
    const to         = searchParams.get("to");
    const action     = searchParams.get("action");
    const limit      = parseInt(searchParams.get("limit") || "100");

    const filter: Record<string, any> = {};
    if (entityType) filter.entityType = entityType;
    if (entityId)   filter.entityId   = entityId;
    if (action)     filter.action     = action;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = toDate;
      }
    }

    const activities = await ActivityLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit);

    return NextResponse.json(activities);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
