import { type NextRequest, NextResponse } from "next/server"
import { createClient, resolveUserDisplayNames } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const limit = parseInt(searchParams.get("limit") || "10")
    const offset = parseInt(searchParams.get("offset") || "0")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const supabase = await createClient()

    // First, get the user's couple information
    const { data: couple, error: coupleError } = await supabase
      .from('couples')
      .select('id, partner1_id, partner2_id')
      .or(`partner1_id.eq.${userId},partner2_id.eq.${userId}`)
      .single()

    if (coupleError || !couple) {
      console.error("Error fetching couple:", coupleError)
      return NextResponse.json({ error: "User not in a couple" }, { status: 404 })
    }

    // Get the partner ID (the other person in the couple)
    const partnerId = couple.partner1_id === userId ? couple.partner2_id : couple.partner1_id

    const notifications: any[] = []

    // 1. Get new posts by partner (new seeds)
    const { data: newPosts, error: newPostsError } = await supabase
      .from('feed_questions')
      .select('id, question, created_by, created_at')
      .eq('couple_id', couple.id)
      .eq('created_by', partnerId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (!newPostsError && newPosts) {
      // Get user display names for new posts
      const userMap = await resolveUserDisplayNames([partnerId])

      newPosts.forEach(post => {
        // Create plain text preview by stripping HTML tags
        const plainTextContent = post.question.replace(/<[^>]*>/g, '').trim()
        const words = plainTextContent.split(/\s+/)
        const previewText = words.length > 8 ? words.slice(0, 8).join(' ') + '...' : plainTextContent

        notifications.push({
          id: `post_${post.id}`,
          type: 'new_post',
          user_name: userMap.get(partnerId) || 'Partner',
          content: post.question, // Full HTML content
          preview_text: previewText, // Plain text preview
          timestamp: post.created_at,
          related_id: post.id
        })
      })
    }

    // 2. Get reactions on user's posts
    const { data: userPosts, error: userPostsError } = await supabase
      .from('feed_questions')
      .select('id, question, created_at')
      .eq('couple_id', couple.id)
      .eq('created_by', userId)

    if (!userPostsError && userPosts) {
      const userPostIds = userPosts.map(p => p.id)

      if (userPostIds.length > 0) {
        const { data: reactions, error: reactionsError } = await supabase
          .from('feed_reactions')
          .select('id, question_id, emoji, created_at')
          .in('question_id', userPostIds)
          .eq('user_id', partnerId)
          .order('created_at', { ascending: false })

        if (!reactionsError && reactions) {
          const userMap = await resolveUserDisplayNames([partnerId])

          reactions.forEach(reaction => {
            const post = userPosts?.find(p => p.id === reaction.question_id)
            if (post) {
              // Create plain text preview by stripping HTML tags
              const plainTextContent = post.question.replace(/<[^>]*>/g, '').trim()
              const words = plainTextContent.split(/\s+/)
              const previewText = words.length > 8 ? words.slice(0, 8).join(' ') + '...' : plainTextContent

              notifications.push({
                id: `reaction_${reaction.id}`,
                type: 'reaction',
                user_name: userMap.get(partnerId) || 'Partner',
                content: post.question, // Full HTML content
                preview_text: previewText, // Plain text preview
                timestamp: reaction.created_at,
                related_id: reaction.question_id,
                emoji: reaction.emoji
              })
            }
          })
        }
      }
    }

    // 3. Get replies to user's posts or replies
    const userPostIds = userPosts ? userPosts.map(p => p.id) : []

    if (userPostIds.length > 0) {
      const { data: replies, error: repliesError } = await supabase
        .from('feed_replies')
        .select('id, question_id, user_id, reply, created_at')
        .in('question_id', userPostIds)
        .eq('user_id', partnerId)
        .order('created_at', { ascending: false })

      if (!repliesError && replies) {
        const userMap = await resolveUserDisplayNames([partnerId])

        // Get reply counts for each question to determine if it's the first reply
        const replyCounts: { [key: number]: number } = {}
        for (const postId of userPostIds) {
          const { count } = await supabase
            .from('feed_replies')
            .select('*', { count: 'exact', head: true })
            .eq('question_id', postId)
          replyCounts[postId] = count || 0
        }

        // Process replies with proper async handling
        const replyPromises = replies.map(async (reply) => {
          const post = userPosts?.find(p => p.id === reply.question_id)
          if (post) {
            const totalReplies = replyCounts[reply.question_id]
            let contextContent = ''
            let isFirstReply = false

            if (totalReplies === 1) {
              // First reply - show original post content
              isFirstReply = true
              const plainTextPost = post.question.replace(/<[^>]*>/g, '').trim()
              const words = plainTextPost.split(/\s+/)
              contextContent = words.length > 8 ? words.slice(0, 8).join(' ') + '...' : plainTextPost
            } else {
              // Subsequent reply - show previous reply content
              isFirstReply = false
              // Get the previous reply (most recent one before this current reply)
              const { data: previousReplies, error: prevError } = await supabase
                .from('feed_replies')
                .select('reply')
                .eq('question_id', reply.question_id)
                .lt('created_at', reply.created_at)
                .order('created_at', { ascending: false })
                .limit(1)
                .single()

              if (previousReplies && !prevError) {
                const words = previousReplies.reply.split(/\s+/)
                contextContent = words.length > 8 ? words.slice(0, 8).join(' ') + '...' : previousReplies.reply
              }
            }

            return {
              id: `reply_${reply.id}`,
              type: 'reply',
              user_name: userMap.get(partnerId) || 'Partner',
              content: reply.reply,
              timestamp: reply.created_at,
              related_id: reply.question_id,
              is_first_reply: isFirstReply,
              context_content: contextContent
            }
          }
          return null
        })

        // Wait for all reply processing to complete
        const processedReplies = await Promise.all(replyPromises)
        processedReplies.forEach(reply => {
          if (reply) {
            notifications.push(reply)
          }
        })
      }
    }

    // Sort all notifications by timestamp (newest first)
    notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // Apply pagination to the sorted results
    const totalNotifications = notifications.length
    const paginatedNotifications = notifications.slice(offset, offset + limit)
    const hasMore = offset + limit < totalNotifications

    return NextResponse.json({
      notifications: paginatedNotifications,
      hasMore,
      total: totalNotifications
    })
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 })
  }
}
