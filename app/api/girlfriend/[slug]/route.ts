// app/api/girlfriend/[slug]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { withContentFilter } from "@/lib/girlfriends";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  if (!slug) {
    return NextResponse.json({ error: "Slug is required" }, { status: 400 });
  }

  const { data, error } = await withContentFilter(
    supabase
      .from("girlfriends")
      .select("id, name, slug, avatar, image_url")
      .eq("slug", slug)
  ).single();

  if (error || !data) {
    return NextResponse.json({ error: "Girlfriend not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}