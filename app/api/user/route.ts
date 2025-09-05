import { createServiceRoleClient } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const supabase = await createServiceRoleClient();

    // Get user from auth.users
    const { data: user, error: userError } = await supabase.auth.admin.getUserById(userId);

    if (userError || !user) {
      console.error("Error fetching user:", userError);
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get profile data
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name, username, age, relationship, location, email")
      .eq("id", userId)
      .single();

    if (profileError) {
      console.warn("Profile not found:", profileError);
    }

    return NextResponse.json({
      user: {
        id: user.user.id,
        email: user.user.email,
        created_at: user.user.created_at,
      },
      profile: profile || null,
    });
  } catch (error) {
    console.error("Error in user API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
