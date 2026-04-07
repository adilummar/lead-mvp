import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Lead from "@/models/Lead";

// Seed owners if they don't exist (only runs once on fresh DB)
async function seedOwners() {
  const ownerCount = await User.countDocuments({ isOwner: true });
  if (ownerCount === 0) {
    const owners = [
      { name: "Adil", email: "adil@bandb.com", role: "Admin", isOwner: true, designation: "Co-Founder" },
      { name: "Shakir", email: "shakir@bandb.com", role: "Admin", isOwner: true, designation: "Co-Founder" },
    ];
    for (const owner of owners) {
      await User.create(owner);
    }
  }
}

export async function GET() {
  try {
    await dbConnect();
    await seedOwners();

    const users = await User.find({}).sort({ isOwner: -1, createdAt: 1 }).lean();

    // Compute lead stats for each user
    const usersWithStats = await Promise.all(
      users.map(async (user: any) => {
        const [totalLeads, closedLeads, lostLeads] = await Promise.all([
          Lead.countDocuments({ salesmanId: user._id }),
          Lead.countDocuments({ salesmanId: user._id, status: "Closed" }),
          Lead.countDocuments({ salesmanId: user._id, status: "Lost" }),
        ]);
        const conversionRate = totalLeads > 0 ? Math.round((closedLeads / totalLeads) * 100) : 0;
        return {
          ...user,
          stats: { totalLeads, closedLeads, lostLeads, conversionRate },
        };
      })
    );

    return NextResponse.json(usersWithStats, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const newUser = await User.create(body);
    return NextResponse.json(newUser, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
