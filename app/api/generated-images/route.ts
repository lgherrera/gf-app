// app/api/generated-images/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("generated_images")
    .select("id, girlfriend_id, prompt, image_url, aspect_ratio, model, created_at")
    .eq("user_id", userId)
    .eq("status", "saved")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching generated images:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ images: data });
}