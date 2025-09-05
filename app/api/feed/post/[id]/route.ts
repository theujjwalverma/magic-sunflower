import { type NextRequest, NextResponse } from "next/server"
import { createClient, resolveUserDisplayNames } from "@/lib/supabase"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const postId = params.id
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!postId || !userId) {
      return NextResponse.json({ error: "Post ID and User ID are required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Get the specific question
    const { data: question, error: questionError } = await supabase
      .from('feed_questions')
      .select('*')
      .eq('id', postId)
      .single()

    if (questionError) {
      console.error("Error fetching question:", questionError)
      return NextResponse.json({ error: "Failed to fetch question" }, { status: 500 })
    }

    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 })
    }

    // Get all replies for this question (chronological order - oldest first)
    const { data: replies, error: repliesError } = await supabase
      .from('feed_replies')
      .select('*')
      .eq('question_id', postId)
      .order('created_at', { ascending: true })

    if (repliesError) {
      console.error("Error fetching replies:", repliesError)
      return NextResponse.json({ error: "Failed to fetch replies" }, { status: 500 })
    }

    // Get all unique user IDs
    const userIds = new Set<string>()
    userIds.add(question.created_by)
    replies.forEach(reply => {
      if (reply.user_id) userIds.add(reply.user_id)
    })

    // Resolve user display names
    const userMap = await resolveUserDisplayNames(Array.from(userIds))

    // Format the question with user names and replies
    const formattedQuestion = {
      ...question,
      created_by_name: userMap.get(question.created_by) || 'Unknown User',
      replies: replies.map(reply => ({
        ...reply,
        user_name: userMap.get(reply.user_id) || 'Unknown User'
      }))
    }

    return NextResponse.json({ question: formattedQuestion })
  } catch (error) {
    console.error("Error fetching post:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
