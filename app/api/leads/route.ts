import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Lead from "@/models/Lead";
import User from "@/models/User";
import ActivityLog from "@/models/ActivityLog";

export async function GET() {
  try {
    await dbConnect();
    const leads = await Lead.find({}).populate("salesmanId").sort({ createdAt: -1 });
    return NextResponse.json(leads, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    
    let user = await User.findOne({ email: "admin@bandb.com" });
    if (!user) {
      user = await User.create({
        name: "Admin User",
        email: "admin@bandb.com",
        role: "Admin"
      });
    }

    const dataToSave = {
      ...body,
      salesmanId: body.salesmanId || user._id, 
    };

    const newLead = await Lead.create(dataToSave);

    // Log activity
    await ActivityLog.create({
      entityType: 'Lead',
      entityId: newLead._id,
      entityName: newLead.name,
      action: 'lead_created',
      message: `Lead "${newLead.name}" was added to the system`,
      meta: { contactNumber: newLead.contactNumber, leadSource: newLead.leadSource, status: newLead.status },
    });

    return NextResponse.json(newLead, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
