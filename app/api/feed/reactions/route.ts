import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { questionId, userId, emoji } = await request.json()

    console.log("Reaction API - Received request:", { questionId, userId, emoji })

    if (!questionId || !userId || !emoji) {
      console.error("Reaction API - Missing required fields:", { questionId, userId, emoji })
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createClient()

    // Check if the question exists
    const { data: question, error: questionError } = await supabase
      .from('feed_questions')
      .select('id, created_by')
      .eq('id', questionId)
      .single()

    if (questionError || !question) {
      console.error("Reaction API - Question not found:", { questionId, questionError })
      return NextResponse.json({ error: "Question not found" }, { status: 404 })
    }

    console.log("Reaction API - Question found:", question)

    // First, remove any existing reaction from this user on this question
    const { error: deleteError } = await supabase
      .from('feed_reactions')
      .delete()
      .eq('question_id', questionId)
      .eq('user_id', userId)

    if (deleteError) {
      console.error("Reaction API - Error deleting existing reaction:", deleteError)
      // Continue anyway, as this might be the first reaction
    } else {
      console.log("Reaction API - Deleted existing reaction successfully")
    }

    // Then insert the new reaction
    const { data: reaction, error } = await supabase
      .from('feed_reactions')
      .insert({
        question_id: questionId,
        user_id: userId,
        emoji: emoji,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error("Reaction API - Error creating reaction:", {
        error,
        code: error.code,
        details: error.details,
        hint: error.hint,
        message: error.message
      })
      return NextResponse.json({
        error: "Failed to create reaction",
        details: error.message,
        code: error.code
      }, { status: 500 })
    }

    console.log("Reaction API - Reaction created successfully:", reaction)
    return NextResponse.json({ reaction })
  } catch (error) {
    console.error("Reaction API - Unexpected error:", error)
    return NextResponse.json({
      error: "Failed to create reaction",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { questionId, userId, emoji } = await request.json()

    console.log("Reaction API - DELETE request:", { questionId, userId, emoji })

    if (!questionId || !userId || !emoji) {
      console.error("Reaction API - DELETE missing required fields:", { questionId, userId, emoji })
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createClient()

    // Delete the specific reaction
    const { error } = await supabase
      .from('feed_reactions')
      .delete()
      .eq('question_id', questionId)
      .eq('user_id', userId)
      .eq('emoji', emoji)

    if (error) {
      console.error("Reaction API - Error deleting reaction:", {
        error,
        code: error.code,
        details: error.details,
        hint: error.hint,
        message: error.message
      })
      return NextResponse.json({
        error: "Failed to delete reaction",
        details: error.message,
        code: error.code
      }, { status: 500 })
    }

    console.log("Reaction API - Reaction deleted successfully")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Reaction API - DELETE unexpected error:", error)
    return NextResponse.json({
      error: "Failed to delete reaction",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
