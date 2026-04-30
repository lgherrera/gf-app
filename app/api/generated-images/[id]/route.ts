// app/api/generated-images/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { status } = await req.json() as { status: string };

  if (!id) {
    return NextResponse.json({ error: "Image ID is required" }, { status: 400 });
  }

  if (!["saved", "trashed"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const { error } = await supabase
    .from("generated_images")
    .update({ status })
    .eq("id", id);

  if (error) {
    console.error("Error updating image status:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}