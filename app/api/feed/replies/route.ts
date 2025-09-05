import { type NextRequest, NextResponse } from "next/server"
import { createClient, createServiceRoleClient, resolveUserDisplayNames } from "@/lib/supabase"
import { getServerTimeDifference } from "@/lib/time-utils"
import { notificationService } from "@/lib/notification-service"

export async function POST(request: NextRequest) {
  try {
    const { questionId, userId, reply } = await request.json()

    if (!questionId || !userId || !reply) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Use service role client to bypass RLS for testing
    const supabase = await createServiceRoleClient()

    // Get the user's display name using the utility function
    const userMap = await resolveUserDisplayNames([userId])
    const userName = userMap.get(userId) || "Unknown User"

    const { data: newReply, error } = await supabase
      .from('feed_replies')
      .insert({
        question_id: questionId,
        user_id: userId,
        reply: reply,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating reply:", error)
      return NextResponse.json({ error: "Failed to create reply" }, { status: 500 })
    }

    // Return reply with user name included
    const responseData = {
      reply: {
        ...newReply,
        user_name: userName
      }
    }

    // Send push notification for the reply (in background, don't wait for it)
    if (newReply) {
      // Get the post owner's user ID
      const { data: post } = await supabase
        .from('feed_questions')
        .select('created_by')
        .eq('id', questionId)
        .single();
      
      if (post && post.created_by !== userId) {
        // Send notification in background
        notificationService.sendReplyNotification(
          userId,
          post.created_by,
          questionId,
          newReply.id
        ).catch(error => {
          console.error('Error sending reply notification:', error);
        });
      }
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error("Error creating reply:", error)
    return NextResponse.json({ error: "Failed to create reply" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { replyId, userId } = await request.json()

    if (!replyId || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createClient()

    // First, get the reply to check ownership and timestamp
    const { data: reply, error: fetchError } = await supabase
      .from('feed_replies')
      .select('user_id, created_at')
      .eq('id', replyId)
      .single()

    if (fetchError || !reply) {
      return NextResponse.json({ error: "Reply not found" }, { status: 404 })
    }

    // Check if the user owns this reply
    if (reply.user_id !== userId) {
      return NextResponse.json({ error: "Unauthorized to delete this reply" }, { status: 403 })
    }

    // Check if 10 minutes have passed since creation using shared time utility
    const minutesDiff = getServerTimeDifference(reply.created_at)

    console.log('Server time calculation debug:', {
      replyId,
      minutesDiff,
      canDelete: minutesDiff < 10
    });

    if (minutesDiff >= 10) {
      return NextResponse.json({
        error: "Cannot delete reply after 10 minutes of posting",
        minutesElapsed: minutesDiff
      }, { status: 400 })
    }

    // Delete the reply
    const { error: deleteError } = await supabase
      .from('feed_replies')
      .delete()
      .eq('id', replyId)
      .eq('user_id', userId) // Extra security check

    if (deleteError) {
      console.error("Error deleting reply:", deleteError)
      return NextResponse.json({ error: "Failed to delete reply" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Reply deleted successfully" })
  } catch (error) {
    console.error("Error deleting reply:", error)
    return NextResponse.json({ error: "Failed to delete reply" }, { status: 500 })
  }
}
