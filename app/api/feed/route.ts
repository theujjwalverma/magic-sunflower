import { type NextRequest, NextResponse } from "next/server"
import { createClient, resolveUserDisplayNames } from "@/lib/supabase"
import { toast } from "sonner"


// GET /api/feed - Get all feed questions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const coupleId = searchParams.get("coupleId")

    if (!coupleId) {
      return NextResponse.json({ error: "Couple ID is required" }, { status: 400 })
    }

    const supabase = await createClient()

    // First get feed questions
    const { data: questions, error: questionsError } = await supabase
      .from('feed_questions')
      .select('*')
      .eq('couple_id', coupleId)
      .order('created_at', { ascending: false })

    if (questionsError) {
      console.error("Error fetching feed questions:", questionsError)
      return NextResponse.json({ error: "Failed to fetch feed questions" }, { status: 500 })
    }

    // Add real-time listener for feed_questions
    supabase
      .channel('feed_questions')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'feed_questions' }, (payload) => {
        console.log('New feed question added:', payload.new)
        toast.success('New post added!')
      })
      .subscribe()

    // Add real-time listener for feed_replies
    supabase
      .channel('feed_replies')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'feed_replies' }, (payload) => {
        console.log('New feed reply added:', payload.new)
        toast.success('New reply added!')
      })
      .subscribe()

    // Get all unique user IDs from questions and replies
    const userIds = new Set<string>()
    questions.forEach(q => {
      if (q.created_by) userIds.add(q.created_by)
    })

    // Get feed replies for all questions to collect all user IDs
    const questionIds = questions.map(q => q.id)
    const { data: replies, error: repliesError } = await supabase
      .from('feed_replies')
      .select('*')
      .in('question_id', questionIds)
      .order('created_at', { ascending: false })

    if (repliesError) {
      console.error("Error fetching feed replies:", repliesError)
      return NextResponse.json({ error: "Failed to fetch feed replies" }, { status: 500 })
    }

    // Add reply user IDs to the set
    replies.forEach(reply => {
      if (reply.user_id) userIds.add(reply.user_id)
    })

    // Resolve all user display names using the utility function
    const userMap = await resolveUserDisplayNames(Array.from(userIds))

    // Group replies by question ID
    const repliesByQuestion = new Map<string, any[]>()
    replies.forEach(reply => {
      if (!repliesByQuestion.has(reply.question_id)) {
        repliesByQuestion.set(reply.question_id, [])
      }
      repliesByQuestion.get(reply.question_id)!.push({
        ...reply,
        user_name: userMap.get(reply.user_id) || 'Unknown User'
      })
    })

    // Get reactions for all questions
    const reactionQuestionIds = questions.map(q => q.id)
    const { data: reactions, error: reactionsError } = await supabase
      .from('feed_reactions')
      .select('*')
      .in('question_id', reactionQuestionIds)

    if (reactionsError) {
      console.error("Error fetching feed reactions:", reactionsError)
    }

    // Group reactions by question ID
    const reactionsByQuestion = new Map<string, any[]>()
    reactions?.forEach(reaction => {
      if (!reactionsByQuestion.has(reaction.question_id)) {
        reactionsByQuestion.set(reaction.question_id, [])
      }
      reactionsByQuestion.get(reaction.question_id)!.push(reaction)
    })

    // Format questions with user names, grouped replies, and reactions
    const formattedQuestions = questions.map(q => ({
      ...q,
      created_by_name: userMap.get(q.created_by) || 'Unknown User',
      replies: repliesByQuestion.get(q.id) || [],
      reactions: reactionsByQuestion.get(q.id) || []
    }))

    return NextResponse.json({ questions: formattedQuestions })
  } catch (error) {
    console.error("Error fetching feed questions:", error)
    return NextResponse.json({ error: "Failed to fetch feed questions" }, { status: 500 })
  }
}

// POST /api/feed - Create a new question
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Handle both old format and new structured format
    let coupleId, question, createdBy;

    if (body.textContent !== undefined || body.embedUrls !== undefined) {
      // New structured format
      const { coupleId: cid, textContent, embedUrls, createdBy: cby } = body;
      coupleId = cid;
      createdBy = cby;

      // Convert structured data to JSON string for storage
      question = JSON.stringify({
        textContent: textContent || "",
        embedUrls: embedUrls || []
      });
    } else {
      // Old format for backward compatibility
      ({ coupleId, question, createdBy } = body);
    }

    if (!coupleId || !question || !createdBy) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('feed_questions')
      .insert({
        couple_id: coupleId,
        question,
        created_by: createdBy,
      })
      .select('id, question, created_by, created_at')
      .single()

    if (error) {
      console.error("Error creating question:", error)
      return NextResponse.json({ error: "Failed to create question" }, { status: 500 })
    }

    // Get user display name
    const userMap = await resolveUserDisplayNames([createdBy])

    const questionWithUser = {
      ...data,
      created_by_name: userMap.get(createdBy) || 'Unknown User',
      replies: [],
      likes_count: 0,
      is_liked: false
    }

    return NextResponse.json({ question: questionWithUser })
  } catch (error) {
    console.error("Error creating question:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
