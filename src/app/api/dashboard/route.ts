import { auth } from "@/lib/auth";
import { ensureSessionsForWeek } from "@/lib/sessions";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const { searchParams } = new URL(req.url);
    const weekStartParam = searchParams.get("weekStart");

    let weekStart: Date;
    if (weekStartParam) {
      weekStart = new Date(weekStartParam + "T00:00:00.000Z");
    } else {
      const now = new Date();
      const day = now.getUTCDay();
      weekStart = new Date(now);
      weekStart.setUTCDate(now.getUTCDate() - day + (day === 0 ? -6 : 1));
      weekStart.setUTCHours(0, 0, 0, 0);
    }

    const sessions = await ensureSessionsForWeek(userId, weekStart);

    const friday = new Date(weekStart);
    friday.setUTCDate(weekStart.getUTCDate() + 4);

    return NextResponse.json({
      sessions,
      weekStart: weekStart.toISOString().split("T")[0],
      weekEnd: friday.toISOString().split("T")[0],
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
