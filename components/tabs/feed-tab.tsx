"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Trash2,
  Reply,
  SmilePlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { HtmlContent } from "@/components/ui/html-content";
import { EmbedCreator } from "@/components/ui/embed-creator";
import { ThreadPreview } from "@/components/ui/thread-preview";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerFooter,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import {
  createBrowserSupabaseClient,
  resolveUserDisplayNames,
} from "@/lib/supabase";
import {
  formatLocalTime,
  canDeletePost,
  getMinutesUntilCanDelete,
  formatRemainingTime,
  getTimeDifferenceInMinutes,
} from "@/lib/time-utils";
import { useSearchParams } from "next/navigation";
import { LoaderRing, Loader } from "@/components/ui/loader";
import { BottomTabs } from "@/components/navigation/bottom-tabs";

interface Reply {
  id: number;
  user_id: string;
  reply: string;
  created_at: string;
  user_name: string;
}

interface Question {
  id: number;
  question: string;
  created_by: string;
  created_by_name: string;
  created_at: string;
  replies: Reply[];
  reactions: any[];
  likes_count?: number;
  is_liked?: boolean;
  user_reaction?: string;
}

export function FeedTab() {
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
  const [isCreatingQuestion, setIsCreatingQuestion] = useState(false);
  const [commentsDrawerOpen, setCommentsDrawerOpen] = useState<number | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [coupleInfo, setCoupleInfo] = useState<any>(null);

  // Embed preview state
  const [embedPreviews, setEmbedPreviews] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  // Emoji reaction state
  const [emojiPickerOpen, setEmojiPickerOpen] = useState<number | null>(null);
  const [emojiReactions, setEmojiReactions] = useState<{
    [key: number]: string;
  }>({});

  // Slide to delete state
  const [slideOffset, setSlideOffset] = useState<{ [key: number]: number }>({});
  const [startX, setStartX] = useState<number | null>(null);
  const [isSliding, setIsSliding] = useState<number | null>(null);

  // Mouse event state
  const [mouseStartX, setMouseStartX] = useState<number | null>(null);
  const [isMouseSliding, setIsMouseSliding] = useState<number | null>(null);

  // URL parameters for highlighting posts from notifications
  const searchParams = useSearchParams();
  const highlightId = searchParams?.get("highlight");
  const highlightType = searchParams?.get("type");

  // Per-post audio control state - tracks mute state for each post
  const [postMuteStates, setPostMuteStates] = useState<{
    [postId: number]: boolean;
  }>({});

  // Function to detect if a post contains YouTube videos
  const hasYouTubeVideos = (postContent: string) => {
    try {
      // Check if content is a JSON string with embed URLs
      const parsed = JSON.parse(postContent);
      if (parsed.embedUrls && Array.isArray(parsed.embedUrls)) {
        return parsed.embedUrls.some(
          (url: string) =>
            url.includes("youtube.com") || url.includes("youtu.be")
        );
      }
      return false;
    } catch (e) {
      // If not JSON, check for YouTube patterns in raw text
      return (
        postContent.includes("youtube.com") || postContent.includes("youtu.be")
      );
    }
  };

  // Function to toggle mute state for a specific post
  const togglePostMute = (postId: number) => {
    setPostMuteStates((prev) => ({
      ...prev,
      [postId]: !prev[postId], // Toggle the current state (undefined becomes false, false becomes true)
    }));
  };

  useEffect(() => {
    if (user) {
      fetchCoupleId();
    }
  }, [user]);

  useEffect(() => {
    if (coupleId) {
      fetchQuestions();
      setupRealtimeSubscriptions().then((cleanup) => {
        // Store cleanup function for component unmount
        return cleanup;
      });
    }
  }, [coupleId]);

  // Set up real-time subscriptions
  const setupRealtimeSubscriptions = async () => {
    if (!coupleId) return;

    // Default empty cleanup function
    let cleanup = () => {};

    try {
      console.log("Setting up real-time subscriptions for couple:", coupleId);

      const supabase = createBrowserSupabaseClient();

      // Subscribe to feed_questions changes
      const questionsSubscription = supabase
        .channel("feed_questions_changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "feed_questions",
            filter: `couple_id=eq.${coupleId}`,
          },
          (payload: any) => {
            console.log("Feed questions change:", payload);
            handleQuestionChange(payload);
          }
        )
        .subscribe();

      // Subscribe to feed_replies changes
      const repliesSubscription = supabase
        .channel("feed_replies_changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "feed_replies",
          },
          (payload: any) => {
            console.log("Feed replies change:", payload);
            handleReplyChange(payload);
          }
        )
        .subscribe();

      // Subscribe to feed_reactions changes
      const reactionsSubscription = supabase
        .channel("feed_reactions_changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "feed_reactions",
          },
          (payload: any) => {
            console.log("Feed reactions change:", payload);
            handleReactionChange(payload);
          }
        )
        .subscribe();

      // Store cleanup function
      cleanup = () => {
        questionsSubscription.unsubscribe();
        repliesSubscription.unsubscribe();
        reactionsSubscription.unsubscribe();
      };
    } catch (err) {
      console.error("Realtime setup failed:", err);
      setError(
        "Failed to connect to real-time updates. Please refresh the page."
      );
    }

    // Return cleanup function for useEffect
    return cleanup;
  };

  // Handle real-time question changes
  const handleQuestionChange = async (payload: any) => {
    if (payload.eventType === "INSERT") {
      // New question added
      const newQuestion = payload.new;

      // Get user display name
      const userMap = await resolveUserDisplayNames([newQuestion.created_by]);

      const formattedQuestion = {
        ...newQuestion,
        created_by_name: userMap.get(newQuestion.created_by) || "Unknown User",
        replies: [],
        reactions: [],
        likes_count: 0,
        is_liked: false,
      };

      setQuestions((prev) => {
        // Prevent duplicate entries
        if (prev.some((q) => q.id === formattedQuestion.id)) return prev;
        return [formattedQuestion, ...prev];
      });
    } else if (payload.eventType === "DELETE") {
      // Question deleted
      setQuestions((prev) => prev.filter((q) => q.id !== payload.old.id));
    }
  };

  // Handle real-time reply changes
  const handleReplyChange = async (payload: any) => {
    if (payload.eventType === "INSERT") {
      // New reply added
      const newReply = payload.new;

      // Get user display name
      const userMap = await resolveClientUserDisplayNames([newReply.user_id]);

      const formattedReply = {
        ...newReply,
        user_name: userMap.get(newReply.user_id) || "Unknown User",
      };

      setQuestions((prev) =>
        prev.map((question) => {
          if (question.id === newReply.question_id) {
            // Prevent duplicate replies
            if (question.replies.some((r) => r.id === formattedReply.id)) {
              return question;
            }
            return {
              ...question,
              replies: [...question.replies, formattedReply].sort(
                (a, b) =>
                  new Date(a.created_at).getTime() -
                  new Date(b.created_at).getTime()
              ),
            };
          }
          return question;
        })
      );
    } else if (payload.eventType === "DELETE") {
      // Reply deleted
      const deletedReply = payload.old;
      setQuestions((prev) =>
        prev.map((question) =>
          question.id === deletedReply.question_id
            ? {
                ...question,
                replies: question.replies.filter(
                  (reply) => reply.id !== deletedReply.id
                ),
              }
            : question
        )
      );
    }
  };

  // Handle real-time reaction changes
  const handleReactionChange = (payload: any) => {
    if (payload.eventType === "INSERT") {
      // New reaction added
      const newReaction = payload.new;

      setQuestions((prev) =>
        prev.map((question) =>
          question.id === newReaction.question_id
            ? {
                ...question,
                reactions: [...question.reactions, newReaction],
              }
            : question
        )
      );

      // Update emoji reactions state if it's the current user
      if (newReaction.user_id === user?.id) {
        setEmojiReactions((prev) => ({
          ...prev,
          [newReaction.question_id]: newReaction.emoji,
        }));
      }
    } else if (payload.eventType === "DELETE") {
      // Reaction deleted
      const deletedReaction = payload.old;

      setQuestions((prev) =>
        prev.map((question) =>
          question.id === deletedReaction.question_id
            ? {
                ...question,
                reactions: question.reactions.filter(
                  (reaction) => reaction.id !== deletedReaction.id
                ),
              }
            : question
        )
      );

      // Update emoji reactions state if it's the current user
      if (deletedReaction.user_id === user?.id) {
        setEmojiReactions((prev) => {
          const newState = { ...prev };
          delete newState[deletedReaction.question_id];
          return newState;
        });
      }
    }
  };

  const fetchCoupleId = async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(`/api/couples?userId=${user.id}`);
      const data = await response.json();

      if (response.ok && data.couples && data.couples.length > 0) {
        const couple = data.couples[0];
        setCoupleId(couple.id);
        setCoupleInfo(couple);
      } else {
        // Create a new couple if none exists
        const createResponse = await fetch("/api/couples", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            partner1Id: user.id,
            partner2Id: "partner-placeholder",
            coupleUsername: `${user.displayName || "user"}-partner`,
          }),
        });

        const createData = await createResponse.json();
        if (createResponse.ok) {
          setCoupleId(createData.couple.id);
          setCoupleInfo(createData.couple);
        }
      }
    } catch (error) {
      console.error("Error fetching couple ID:", error);
    }
  };

  const fetchQuestions = async () => {
    if (!coupleId) return;

    try {
      const response = await fetch(`/api/feed?coupleId=${coupleId}`);
      const data = await response.json();
      if (response.ok) {
        setQuestions(data.questions);

        // Initialize emoji reactions from the API data
        const initialReactions: { [key: number]: string } = {};
        data.questions.forEach((question: Question) => {
          // Find current user's reaction for this question
          const userReaction = question.reactions.find(
            (reaction: any) => reaction.user_id === user?.id
          );
          if (userReaction) {
            initialReactions[question.id] = userReaction.emoji;
          }
        });
        setEmojiReactions(initialReactions);

        // Handle highlighting after questions are loaded
        if (highlightId && data.questions.length > 0) {
          handleNotificationNavigation(data.questions);
        }
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle navigation from notifications
  const handleNotificationNavigation = (questionsList: Question[]) => {
    if (!highlightId) return;

    setTimeout(() => {
      let targetQuestionId: number | null = null;

      if (highlightType === "reply") {
        const questionWithReply = questionsList.find((q) =>
          q.replies.some((reply) => reply.id.toString() === highlightId)
        );
        if (questionWithReply) {
          targetQuestionId = questionWithReply.id;
        }
      } else {
        const targetQuestion = questionsList.find(
          (q) => q.id.toString() === highlightId
        );
        if (targetQuestion) {
          targetQuestionId = targetQuestion.id;
        }
      }

      if (targetQuestionId) {
        setCommentsDrawerOpen(targetQuestionId);
      }
    }, 100);
  };

  const handleCreateQuestion = async () => {
    if (
      (!newQuestion.trim() && embedPreviews.length === 0) ||
      !coupleId ||
      !user
    )
      return;

    const postData = {
      textContent: newQuestion.trim(),
      embedUrls: embedPreviews,
      createdBy: user.id,
      coupleId,
    };

    const optimisticQuestion: Question = {
      id: Date.now(),
      question: JSON.stringify(postData),
      created_by: user.id,
      created_by_name: user.displayName || "You",
      created_at: new Date().toISOString(),
      replies: [],
      reactions: [],
      likes_count: 0,
      is_liked: false,
    };

    setQuestions((prev) => [optimisticQuestion, ...prev]);
    setNewQuestion("");
    setEmbedPreviews([]);
    setShowPreview(false);
    setIsCreatingQuestion(false);

    try {
      const response = await fetch("/api/feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postData),
      });

      if (response.ok) {
        const data = await response.json();
        setQuestions((prev) =>
          prev.map((q) =>
            q.id === optimisticQuestion.id
              ? {
                  ...data.question,
                  created_by_name: user.displayName || "You",
                  replies: [],
                  likes_count: 0,
                  is_liked: false,
                }
              : q
          )
        );
      } else {
        setQuestions((prev) =>
          prev.filter((q) => q.id !== optimisticQuestion.id)
        );
        console.error("Failed to create question");
      }
    } catch (error) {
      setQuestions((prev) =>
        prev.filter((q) => q.id !== optimisticQuestion.id)
      );
      console.error("Error creating question:", error);
    }
  };

  const handleReply = async (questionId: number) => {
    const content = replyText[questionId];
    if (!content?.trim() || !user) return;

    setReplyingTo(questionId);

    try {
      const response = await fetch("/api/feed/replies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId,
          userId: user.id,
          reply: content,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const newReply = data.reply;
        setQuestions((prev) =>
          prev.map((q) =>
            q.id === questionId
              ? { ...q, replies: [...q.replies, newReply] }
              : q
          )
        );
        setReplyText((prev) => ({ ...prev, [questionId]: "" }));
      } else {
        const errorData = await response.text();
        console.error("Reply creation failed:", errorData);
      }
    } catch (error) {
      console.error("Error creating reply:", error);
    } finally {
      setReplyingTo(null);
    }
  };

  const handleLike = (questionId: number) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId
          ? {
              ...q,
              is_liked: !q.is_liked,
              likes_count: (q.likes_count || 0) + (q.is_liked ? -1 : 1),
            }
          : q
      )
    );
  };

  const handleReplyTextChange = (questionId: number, value: string) => {
    setReplyText((prev) => ({ ...prev, [questionId]: value }));
  };

  const isPartnerOfPostOwner = (postOwnerId: string) => {
    if (!user?.id || !coupleInfo) return false;
    const partnerId =
      coupleInfo.partner1_id === user.id
        ? coupleInfo.partner2_id
        : coupleInfo.partner1_id;
    return partnerId === postOwnerId;
  };

  const isPostOwner = (postOwnerId: string) => {
    return user?.id === postOwnerId;
  };

  const handleEmojiReaction = async (questionId: number, emoji: string) => {
    if (!user) return;

    const currentReaction = emojiReactions[questionId];

    if (currentReaction === emoji) {
      const newReactions = { ...emojiReactions };
      delete newReactions[questionId];
      setEmojiReactions(newReactions);

      try {
        await fetch("/api/feed/reactions", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            questionId,
            userId: user.id,
            emoji,
          }),
        });
      } catch (error) {
        setEmojiReactions((prev) => ({
          ...prev,
          [questionId]: emoji,
        }));
      }
    } else {
      setEmojiReactions((prev) => ({
        ...prev,
        [questionId]: emoji,
      }));

      try {
        await fetch("/api/feed/reactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            questionId,
            userId: user.id,
            emoji,
          }),
        });
      } catch (error) {
        const originalReaction = currentReaction;
        if (originalReaction) {
          setEmojiReactions((prev) => ({
            ...prev,
            [questionId]: originalReaction,
          }));
        } else {
          setEmojiReactions((prev) => {
            const newState = { ...prev };
            delete newState[questionId];
            return newState;
          });
        }
      }
    }

    setEmojiPickerOpen(null);
  };

  const toggleEmojiPicker = (questionId: number) => {
    setEmojiPickerOpen(emojiPickerOpen === questionId ? null : questionId);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest(".emoji-picker")) {
        setEmojiPickerOpen(null);
      }
    };

    if (emojiPickerOpen !== null) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [emojiPickerOpen]);

  const canDeleteReply = (reply: Reply) => {
    if (!user || reply.user_id !== user.id) return false;
    return canDeletePost(reply.created_at);
  };

  const handleTouchStart = (e: React.TouchEvent, replyId: number) => {
    const reply = questions
      .flatMap((q) => q.replies)
      .find((r) => r.id === replyId);

    if (reply && canDeleteReply(reply)) {
      setStartX(e.touches[0].clientX);
      setIsSliding(replyId);
    }
  };

  const handleTouchMove = (e: React.TouchEvent, replyId: number) => {
    if (startX === null || isSliding !== replyId) return;

    const currentX = e.touches[0].clientX;
    const diffX = startX - currentX;

    if (diffX > 0) {
      const maxSlide = 80;
      const offset = Math.min(diffX, maxSlide);
      setSlideOffset((prev) => ({ ...prev, [replyId]: offset }));
    }
  };

  const handleTouchEnd = (replyId: number) => {
    const threshold = 50;
    const currentOffset = slideOffset[replyId] || 0;

    if (
      currentOffset >= threshold &&
      canDeleteReply(
        questions.flatMap((q) => q.replies).find((r) => r.id === replyId)!
      )
    ) {
      handleDeleteReply(replyId);
    }

    setSlideOffset((prev) => ({ ...prev, [replyId]: 0 }));
    setStartX(null);
    setIsSliding(null);
  };

  const handleDeleteReply = async (replyId: number) => {
    if (!user) return;

    const reply = questions
      .flatMap((q) => q.replies)
      .find((r) => r.id === replyId);
    console.log("Attempting to delete reply:", {
      replyId,
      userId: user.id,
      replyCreatedAt: reply?.created_at,
      replyAge: reply
        ? getTimeDifferenceInMinutes(reply.created_at)
        : "unknown",
    });

    try {
      const response = await fetch("/api/feed/replies", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          replyId,
          userId: user.id,
        }),
      });

      if (response.ok) {
        console.log("Reply deleted successfully");
        setQuestions((prev) =>
          prev.map((question) => ({
            ...question,
            replies: question.replies.filter((reply) => reply.id !== replyId),
          }))
        );
      } else {
        const errorData = await response.json();
        console.error("Delete reply failed:", errorData);
        alert(errorData.error || "Failed to delete reply");
      }
    } catch (error) {
      console.error("Error deleting reply:", error);
      alert("Failed to delete reply");
    }
  };

  const handleMouseDown = (e: React.MouseEvent, replyId: number) => {
    const reply = questions
      .flatMap((q) => q.replies)
      .find((r) => r.id === replyId);

    if (reply && canDeleteReply(reply)) {
      e.preventDefault();
      setMouseStartX(e.clientX);
      setIsMouseSliding(replyId);
    }
  };

  const handleMouseMove = (e: React.MouseEvent, replyId: number) => {
    if (mouseStartX === null || isMouseSliding !== replyId) return;

    const currentX = e.clientX;
    const diffX = mouseStartX - currentX;

    if (diffX > 0) {
      const maxSlide = 100;
      const offset = Math.min(diffX, maxSlide);
      setSlideOffset((prev) => ({ ...prev, [replyId]: offset }));
    }
  };

  const handleMouseUp = (replyId: number) => {
    const threshold = 60;
    const currentOffset = slideOffset[replyId] || 0;

    if (
      currentOffset >= threshold &&
      canDeleteReply(
        questions.flatMap((q) => q.replies).find((r) => r.id === replyId)!
      )
    ) {
      handleDeleteReply(replyId);
    }

    setSlideOffset((prev) => ({ ...prev, [replyId]: 0 }));
    setMouseStartX(null);
    setIsMouseSliding(null);
  };

  const handleMouseLeave = (replyId: number) => {
    setSlideOffset((prev) => ({ ...prev, [replyId]: 0 }));
    setMouseStartX(null);
    setIsMouseSliding(null);
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isMouseSliding !== null) {
        handleMouseMove(e as any, isMouseSliding);
      }
    };

    const handleGlobalMouseUp = () => {
      if (isMouseSliding !== null) {
        handleMouseUp(isMouseSliding);
      }
    };

    if (isMouseSliding !== null) {
      document.addEventListener("mousemove", handleGlobalMouseMove);
      document.addEventListener("mouseup", handleGlobalMouseUp);
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleGlobalMouseMove);
      document.removeEventListener("mouseup", handleGlobalMouseUp);
      document.body.style.userSelect = "";
    };
  }, [isMouseSliding, mouseStartX, slideOffset, questions]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-11">
          <div className="flex items-center justify-between max-w-md mx-auto">
            <h1 className="text-2xl font-bold text-black">Seeds</h1>
            <Button
              onClick={() => setIsCreatingQuestion(true)}
              size="sm"
              className="bg-black hover:bg-gray-800 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Thread
            </Button>
          </div>
        </div>

        <div className="max-w-md mx-auto pb-20">
          <div className="flex items-center justify-center py-12">
            <LoaderRing size="lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white p-4">
        <div className="max-w-md mx-auto bg-red-50 p-4 rounded-lg">
          <h2 className="text-red-600 font-medium">Feed Error</h2>
          <p className="text-red-500 text-sm mt-2">{error}</p>
          <Button className="mt-4" onClick={() => setError(null)}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-11">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-black">Threads</h1>
          <Button
            onClick={() => setIsCreatingQuestion(true)}
            size="sm"
            className="bg-black hover:bg-gray-800 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Thread
          </Button>
        </div>
      </div>

      <Drawer open={isCreatingQuestion} onOpenChange={setIsCreatingQuestion}>
        <DrawerContent>
          <div className="max-w-md mx-auto w-full">
            <DrawerHeader className="flex flex-row items-center justify-between px-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsCreatingQuestion(false)}
                  className="h-8 w-8"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </Button>
                <DrawerTitle>New thread</DrawerTitle>
              </div>
              <Button
                onClick={handleCreateQuestion}
                className="bg-black hover:bg-gray-800 text-white px-4"
                disabled={!newQuestion.trim() && embedPreviews.length === 0}
              >
                Post
              </Button>
            </DrawerHeader>
            <div className="space-y-4 px-4 flex-1">
              <RichTextEditor
                content={newQuestion}
                onChange={setNewQuestion}
                placeholder="What's new"
                className="min-h-[200px]"
              />
            </div>
            <div className="px-4 pb-4">
              <EmbedCreator
                onPreviewEmbed={(url, type) => {
                  setEmbedPreviews((prev) => [...prev, url]);
                  if (!showPreview) setShowPreview(true);
                }}
                previewEmbeds={embedPreviews}
                onRemoveEmbed={(index) => {
                  setEmbedPreviews((prev) =>
                    prev.filter((_, i) => i !== index)
                  );
                }}
              />
            </div>
            <ThreadPreview
              content={newQuestion}
              embeds={embedPreviews}
              showPreview={showPreview}
              onTogglePreview={() => setShowPreview(!showPreview)}
              onRemoveEmbed={(index) => {
                setEmbedPreviews((prev) => prev.filter((_, i) => i !== index));
              }}
            />
          </div>
        </DrawerContent>
      </Drawer>

      <div className="max-w-md mx-auto">
        {questions.map((question) => (
          <div
            key={question.id}
            id={`question-${question.id}`}
            className="border-b border-gray-100 p-4"
          >
            <div className="flex gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-medium text-gray-600">
                  {question.created_by_name[0]}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-black">
                    {question.created_by_name}
                  </span>
                  <span className="text-gray-500 text-sm">
                    {formatLocalTime(question.created_at)}
                  </span>

                  <div className="flex items-center gap-1 ml-auto">
                    {/* Per-post mute button - only show if post has YouTube videos */}
                    {hasYouTubeVideos(question.question) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => togglePostMute(question.id)}
                        className="h-6 w-6 hover:bg-gray-100"
                        title={
                          postMuteStates[question.id]
                            ? "Unmute video"
                            : "Mute video"
                        }
                      >
                        {postMuteStates[question.id] ? (
                          <svg
                            className="h-4 w-4"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z" />
                          </svg>
                        ) : (
                          <svg
                            className="h-4 w-4"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5zm8-1.5v9L9.5 13H7v-2h2.5L13 7.5z" />
                          </svg>
                        )}
                      </Button>
                    )}

                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <HtmlContent
                  content={question.question}
                  className="text-black mb-3"
                  globalMuted={postMuteStates[question.id] || false}
                />

                {question.replies.length > 1 && (
                  <button
                    onClick={() => setCommentsDrawerOpen(question.id)}
                    className="text-xs text-gray-500 hover:text-gray-700 mb-3 transition-colors"
                  >
                    {question.replies.length} replies
                  </button>
                )}

                {question.replies.length > 0 && (
                  <div className="mb-3">
                    <div className="space-y-2">
                      {question.replies
                        .sort(
                          (a, b) =>
                            new Date(b.created_at).getTime() -
                            new Date(a.created_at).getTime()
                        )
                        .slice(0, 1)
                        .map((reply) => (
                          <div key={reply.id} className="flex gap-2">
                            <div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-medium text-gray-600">
                                {reply.user_name[0]}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1 mb-0.5">
                                <span className="font-medium text-xs text-gray-700">
                                  {reply.user_name}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {formatLocalTime(reply.created_at)}
                                </span>
                              </div>
                              <p className="text-xs text-gray-700 leading-tight">
                                {reply.reply}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-4">
                  {isPartnerOfPostOwner(question.created_by) && (
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleEmojiPicker(question.id)}
                        className={cn(
                          "h-8",
                          emojiReactions[question.id] && "text-blue-500"
                        )}
                      >
                        {emojiReactions[question.id] ? (
                          <span className="text-lg mr-1">
                            {emojiReactions[question.id]}
                          </span>
                        ) : (
                          <SmilePlus className="h-4 w-4" />
                        )}
                      </Button>

                      {emojiPickerOpen === question.id && (
                        <div className="emoji-picker absolute bottom-full mb-2 left-0 bg-white border border-gray-200 rounded-lg shadow-lg p-1 z-50 h-8">
                          <div className="flex gap-1">
                            {[
                              "❤️",
                              "👍",
                              "👎",
                              "😂",
                              "😮",
                              "😢",
                              "😡",
                              "🔥",
                            ].map((emoji) => (
                              <button
                                key={emoji}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEmojiReaction(question.id, emoji);
                                }}
                                className="text-lg hover:scale-110 transition-transform rounded"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {isPostOwner(question.created_by) &&
                    emojiReactions[question.id] && (
                      <div className="flex items-center h-8 px-2">
                        <span className="text-lg">
                          {emojiReactions[question.id]}
                        </span>
                      </div>
                    )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCommentsDrawerOpen(question.id)}
                    className="h-8"
                  >
                    <Reply className="h-4 w-4 mr-1" />
                    Reply
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {questions.length === 0 && (
          <div className="text-center py-12 px-4">
            <h3 className="text-lg font-medium text-black mb-2">
              No threads yet
            </h3>
            <p className="text-gray-600 mb-4">
              Start a conversation with your partner!
            </p>
            <Button
              onClick={() => setIsCreatingQuestion(true)}
              className="bg-black hover:bg-gray-800 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create thread
            </Button>
          </div>
        )}

        <Drawer
          open={commentsDrawerOpen !== null}
          onOpenChange={(open) => {
            if (!open) {
              setCommentsDrawerOpen(null);
            }
          }}
        >
          <DrawerContent className="max-h-[80vh] max-w-md mx-auto w-full">
            <DrawerHeader>
              <DrawerTitle>Comments</DrawerTitle>
            </DrawerHeader>

            <div className="flex-1 overflow-y-auto px-4">
              {commentsDrawerOpen &&
                (() => {
                  const currentQuestion = questions.find(
                    (q) => q.id === commentsDrawerOpen
                  );
                  if (!currentQuestion) return null;

                  return (
                    <>
                      <div className="border-b border-gray-100 pb-4 mb-4">
                        <div className="flex gap-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-medium text-gray-600">
                              {currentQuestion.created_by_name[0]}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold text-black">
                                {currentQuestion.created_by_name}
                              </span>
                              <span className="text-gray-500 text-sm">
                                {formatLocalTime(currentQuestion.created_at)}
                              </span>
                            </div>
                            <HtmlContent
                              content={currentQuestion.question}
                              className="text-black"
                              globalMuted={
                                postMuteStates[currentQuestion.id] || false
                              }
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {currentQuestion.replies.length > 0 ? (
                          currentQuestion.replies.map((reply) => {
                            const offset = slideOffset[reply.id] || 0;
                            const canDelete = canDeleteReply(reply);

                            return (
                              <div
                                key={reply.id}
                                className="relative overflow-hidden"
                              >
                                <div
                                  className={cn(
                                    "absolute inset-y-0 right-0 bg-red-500 flex items-center justify-center transition-all duration-200",
                                    offset > 0 ? "w-20" : "w-0"
                                  )}
                                >
                                  <Trash2 className="h-5 w-5 text-white" />
                                </div>

                                <div
                                  className={cn(
                                    "bg-gray-50 rounded-lg p-3 transition-transform duration-200 relative z-10 select-none",
                                    offset > 0 && "bg-red-50",
                                    canDelete &&
                                      "cursor-grab active:cursor-grabbing"
                                  )}
                                  style={{
                                    transform: `translateX(-${offset}px)`,
                                  }}
                                  onTouchStart={(e) =>
                                    handleTouchStart(e, reply.id)
                                  }
                                  onTouchMove={(e) =>
                                    handleTouchMove(e, reply.id)
                                  }
                                  onTouchEnd={() => handleTouchEnd(reply.id)}
                                  onMouseDown={(e) =>
                                    handleMouseDown(e, reply.id)
                                  }
                                  onMouseLeave={() =>
                                    handleMouseLeave(reply.id)
                                  }
                                >
                                  <div className="flex items-center gap-2 mb-1">
                                    <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                                      <span className="text-xs font-medium text-gray-600">
                                        {reply.user_name[0]}
                                      </span>
                                    </div>
                                    <span className="font-medium text-sm">
                                      {reply.user_name}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {formatLocalTime(reply.created_at)}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-800">
                                    {reply.reply}
                                  </p>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            No comments yet. Be the first to reply!
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}
            </div>

            {commentsDrawerOpen && (
              <DrawerFooter className="border-t border-gray-100">
                <div className="flex gap-2 w-full">
                  <Input
                    placeholder="Write a comment..."
                    value={replyText[commentsDrawerOpen] || ""}
                    onChange={(e) =>
                      handleReplyTextChange(commentsDrawerOpen, e.target.value)
                    }
                    onKeyPress={(e) =>
                      e.key === "Enter" && handleReply(commentsDrawerOpen)
                    }
                    className="border-gray-200 focus:border-black"
                  />
                  <Button
                    onClick={() => handleReply(commentsDrawerOpen)}
                    disabled={
                      !replyText[commentsDrawerOpen]?.trim() ||
                      replyingTo === commentsDrawerOpen
                    }
                    className="bg-black hover:bg-gray-800 text-white px-6"
                  >
                    {replyingTo === commentsDrawerOpen ? (
                      <>
                        <Loader size="sm" className="mr-2" />
                        Posting...
                      </>
                    ) : (
                      "Post"
                    )}
                  </Button>
                </div>
              </DrawerFooter>
            )}
          </DrawerContent>
        </Drawer>
      </div>
      <BottomTabs />
    </div>
  );
}
