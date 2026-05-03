// app/api/rendered-images/usage/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const MONTHLY_LIMIT = 50; // keep in sync with /api/generate/image/route.ts

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { count, error } = await supabase
    .from("generated_images")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", startOfMonth);

  if (error) {
    console.error("Error fetching usage:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    used: count ?? 0,
    limit: MONTHLY_LIMIT,
    remaining: MONTHLY_LIMIT - (count ?? 0),
  });
}