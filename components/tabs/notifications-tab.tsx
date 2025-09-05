"use client";

import { useState, useEffect } from "react";
import {
  Bell,
  Heart,
  MessageCircle,
  User,
  Trash2,
  SmilePlus,
  Reply,
} from "lucide-react";
import { BottomTabs } from "@/components/navigation/bottom-tabs";
import { useAuth } from "@/lib/auth";
import { formatLocalTime } from "@/lib/time-utils";
import { cn } from "@/lib/utils";
import { HtmlContent } from "@/components/ui/html-content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerFooter,
} from "@/components/ui/drawer";
import { supabase } from "@/lib/supabase";
import { LoaderRing } from "@/components/ui/loader";

interface Notification {
  id: string;
  type: "new_post" | "reaction" | "reply";
  user_name: string;
  content: string; // Full HTML content
  preview_text?: string; // Plain text preview for display
  timestamp: string;
  related_id: string; // question_id or reply_id
  emoji?: string; // For reaction notifications
  is_first_reply?: boolean; // For reply notifications
  context_content?: string; // Context content for replies
}

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
  likes_count?: number;
  is_liked?: boolean;
  user_reaction?: string;
}

export function NotificationsTab() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const limit = 10;

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Question | null>(null);
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
  const [loadingPost, setLoadingPost] = useState(false);
  const [highlightReplyId, setHighlightReplyId] = useState<string | null>(null);

  // Emoji reaction state
  const [emojiPickerOpen, setEmojiPickerOpen] = useState<number | null>(null);
  const [emojiReactions, setEmojiReactions] = useState<{
    [key: number]: string;
  }>({});

  // Notification reactions state
  const [notificationReactions, setNotificationReactions] = useState<{
    [key: string]: string;
  }>({});
  const [notificationEmojiPickerOpen, setNotificationEmojiPickerOpen] =
    useState<string | null>(null);

  // Real-time subscription
  const [subscriptionChannel, setSubscriptionChannel] = useState<any>(null);
  const [newNotificationsCount, setNewNotificationsCount] = useState(0);
  const [coupleInfo, setCoupleInfo] = useState<any>(null);

  // Helper function to check if current user is the partner of a post owner
  const isPartnerOfPostOwner = (postOwnerId: string) => {
    if (!user?.id || !coupleInfo) return false;

    const partnerId =
      coupleInfo.partner1_id === user.id
        ? coupleInfo.partner2_id
        : coupleInfo.partner1_id;

    return partnerId === postOwnerId;
  };

  // Helper function to check if current user owns the post
  const isPostOwner = (postOwnerId: string) => {
    return user?.id === postOwnerId;
  };

  // Fetch couple information for real-time subscriptions
  useEffect(() => {
    const fetchCoupleInfo = async () => {
      if (!user?.id) return;

      try {
        const { data: couple, error } = await supabase
          .from("couples")
          .select("id, partner1_id, partner2_id")
          .or(`partner1_id.eq.${user.id},partner2_id.eq.${user.id}`)
          .single();

        if (!error && couple) {
          setCoupleInfo(couple);
        }
      } catch (error) {
        console.error("Error fetching couple info:", error);
      }
    };

    if (user) {
      fetchCoupleInfo();
    }
  }, [user]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user?.id || !coupleInfo) return;

    const setupRealTimeSubscription = async () => {
      const partnerId =
        coupleInfo.partner1_id === user.id
          ? coupleInfo.partner2_id
          : coupleInfo.partner1_id;

      // Create subscription channel
      const channel = supabase
        .channel(`notifications-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "feed_questions",
            filter: `couple_id=eq.${coupleInfo.id}`,
          },
          (payload) => {
            // Only refresh if it's the partner's new post
            if (payload.new.created_by === partnerId) {
              console.log("New post detected, incrementing notification count");
              setNewNotificationsCount((prev) => prev + 1);
            }
          }
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "feed_reactions",
            filter: `user_id=eq.${partnerId}`,
          },
          (payload) => {
            // Only refresh if the reaction is on user's posts
            console.log(
              "New reaction detected, incrementing notification count"
            );
            setNewNotificationsCount((prev) => prev + 1);
          }
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "feed_replies",
            filter: `user_id=eq.${partnerId}`,
          },
          async (payload) => {
            // Validate that this reply is to one of the user's posts
            try {
              const reply = payload.new;
              const { data: post } = await supabase
                .from("feed_questions")
                .select("created_by")
                .eq("id", reply.question_id)
                .single();

              // Only refresh if the reply is to user's posts
              if (post && post.created_by === user.id) {
                console.log(
                  "New reply to user's post detected, incrementing notification count"
                );
                setNewNotificationsCount((prev) => prev + 1);
                // Don't auto-refresh, let user manually refresh when ready
              }
            } catch (error) {
              console.error("Error validating reply notification:", error);
            }
          }
        )
        .subscribe();

      setSubscriptionChannel(channel);

      return () => {
        channel.unsubscribe();
      };
    };

    const cleanup = setupRealTimeSubscription();

    return () => {
      if (cleanup instanceof Promise) {
        cleanup.then((cleanupFn) => cleanupFn?.());
      }
    };
  }, [user, coupleInfo]);

  // Cleanup subscription on unmount
  useEffect(() => {
    return () => {
      if (subscriptionChannel) {
        subscriptionChannel.unsubscribe();
      }
    };
  }, [subscriptionChannel]);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Reset new notifications count when viewing notifications
      setNewNotificationsCount(0);
    }
  }, [user]);

  const fetchNotifications = async (reset: boolean = true) => {
    if (!user?.id) return;

    try {
      if (reset) {
        setLoading(true);
        setOffset(0);
      } else {
        setLoadingMore(true);
      }

      const currentOffset = reset ? 0 : offset;
      const response = await fetch(
        `/api/notifications?userId=${user.id}&limit=${limit}&offset=${currentOffset}`
      );

      if (response.ok) {
        const data = await response.json();

        if (reset) {
          setNotifications(data.notifications);
        } else {
          // Append new notifications to existing ones
          setNotifications((prev) => [...prev, ...data.notifications]);
        }

        setHasMore(data.hasMore);

        if (!reset) {
          setOffset((prev) => prev + limit);
        }
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreNotifications = () => {
    if (!loadingMore && hasMore) {
      fetchNotifications(false);
    }
  };

  const truncateContent = (content: string, maxWords: number = 8) => {
    const words = content.split(" ");
    if (words.length <= maxWords) return content;
    return words.slice(0, maxWords).join(" ") + "...";
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "new_post":
        return <User className="h-4 w-4 text-blue-500" />;
      case "reaction":
        return <Heart className="h-4 w-4 text-red-500" />;
      case "reply":
        return <MessageCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getNotificationMessage = (notification: Notification) => {
    // Use preview_text if available, otherwise create it from content
    const displayContent =
      notification.preview_text ||
      truncateContent(notification.content.replace(/<[^>]*>/g, "").trim());

    switch (notification.type) {
      case "new_post":
        return `${notification.user_name} posted a new seed: "${displayContent}"`;
      case "reaction":
        const reactionText = notification.emoji ? `${notification.emoji} ` : "";
        return `${notification.user_name} reacted ${reactionText}to your seed: "${displayContent}"`;
      case "reply":
        // Enhanced reply notification with context
        if (notification.is_first_reply && notification.context_content) {
          // First reply: "Your seed got a first reply: 'reply content' to 'original post content...'"
          return `Your seed got a first reply: "${displayContent}" to "${notification.context_content}"`;
        } else if (notification.context_content) {
          // Subsequent reply: "Partner replied back 'reply content' in reply to 'previous reply content...'"
          return `${notification.user_name} replied back "${displayContent}" in reply to "${notification.context_content}"`;
        } else {
          // Fallback to original format
          return `${notification.user_name} replied to your seed comment: "${displayContent}"`;
        }
      default:
        return notification.content;
    }
  };

  const fetchPost = async (postId: string) => {
    if (!user?.id) return;

    setLoadingPost(true);
    try {
      const response = await fetch(
        `/api/feed/post/${postId}?userId=${user.id}`
      );
      if (response.ok) {
        const data = await response.json();
        setSelectedPost(data.question);
        setDrawerOpen(true);
      }
    } catch (error) {
      console.error("Error fetching post:", error);
    } finally {
      setLoadingPost(false);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Extract reply ID for reply notifications (format: "reply_${replyId}")
    let replyIdToHighlight: string | null = null;
    if (notification.type === "reply") {
      const parts = notification.id.split("_");
      if (parts.length >= 2) {
        replyIdToHighlight = parts[1]; // Extract reply ID from notification ID
      }
    }

    // Set highlight state and fetch the post data
    setHighlightReplyId(replyIdToHighlight);
    await fetchPost(notification.related_id);
  };

  const handleReply = async (questionId: number) => {
    const content = replyText[questionId];
    if (!content?.trim() || !user) return;

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
        // Update the selected post with the new reply
        if (selectedPost) {
          setSelectedPost({
            ...selectedPost,
            replies: [...selectedPost.replies, data.reply],
          });
        }
        setReplyText((prev) => ({ ...prev, [questionId]: "" }));

        // Refresh notifications to update counts
        fetchNotifications();
      }
    } catch (error) {
      console.error("Error creating reply:", error);
    }
  };

  const handleReplyTextChange = (questionId: number, value: string) => {
    setReplyText((prev) => ({ ...prev, [questionId]: value }));
  };

  // Emoji reaction handlers
  const handleEmojiReaction = async (questionId: number, emoji: string) => {
    if (!user) return;

    const currentReaction = emojiReactions[questionId];

    if (currentReaction === emoji) {
      // Remove reaction if same emoji is clicked
      const newReactions = { ...emojiReactions };
      delete newReactions[questionId];
      setEmojiReactions(newReactions);

      // Remove from database
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

        // Update selected post reaction state
        if (selectedPost) {
          setSelectedPost({
            ...selectedPost,
            user_reaction: undefined,
          });
        }
      } catch (error) {
        console.error("Error removing reaction:", error);
      }
    } else {
      // Set new reaction
      setEmojiReactions((prev) => ({
        ...prev,
        [questionId]: emoji,
      }));

      // Save to database
      try {
        const response = await fetch("/api/feed/reactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            questionId,
            userId: user.id,
            emoji,
          }),
        });

        if (!response.ok) {
          console.error("Failed to save reaction");
        } else {
          // Update selected post reaction state
          if (selectedPost) {
            setSelectedPost({
              ...selectedPost,
              user_reaction: emoji,
            });
          }
        }
      } catch (error) {
        console.error("Error saving reaction:", error);
      }
    }

    setEmojiPickerOpen(null);
  };

  const toggleEmojiPicker = (questionId: number) => {
    setEmojiPickerOpen(emojiPickerOpen === questionId ? null : questionId);
  };

  // Notification reaction handlers
  const handleNotificationReaction = async (
    notificationId: string,
    questionId: string,
    emoji: string
  ) => {
    if (!user) return;

    const currentReaction = notificationReactions[notificationId];

    if (currentReaction === emoji) {
      // Remove reaction if same emoji is clicked
      const newReactions = { ...notificationReactions };
      delete newReactions[notificationId];
      setNotificationReactions(newReactions);

      // Remove from database
      try {
        await fetch("/api/feed/reactions", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            questionId: parseInt(questionId),
            userId: user.id,
            emoji,
          }),
        });
      } catch (error) {
        console.error("Error removing reaction:", error);
      }
    } else {
      // Set new reaction
      setNotificationReactions((prev) => ({
        ...prev,
        [notificationId]: emoji,
      }));

      // Save to database
      try {
        await fetch("/api/feed/reactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            questionId: parseInt(questionId),
            userId: user.id,
            emoji,
          }),
        });
      } catch (error) {
        console.error("Error saving reaction:", error);
      }
    }

    setNotificationEmojiPickerOpen(null);
  };

  const toggleNotificationEmojiPicker = (notificationId: string) => {
    setNotificationEmojiPickerOpen(
      notificationEmojiPickerOpen === notificationId ? null : notificationId
    );
  };

  // Close emoji picker when clicking outside
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

  // Close notification emoji picker when clicking outside
  useEffect(() => {
    const handleNotificationClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest(".notification-emoji-picker")) {
        setNotificationEmojiPickerOpen(null);
      }
    };

    if (notificationEmojiPickerOpen !== null) {
      document.addEventListener("click", handleNotificationClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleNotificationClickOutside);
    };
  }, [notificationEmojiPickerOpen]);

  // Handle highlighting when drawer opens
  useEffect(() => {
    if (drawerOpen && highlightReplyId && selectedPost) {
      // Small delay to ensure DOM is rendered
      setTimeout(() => {
        const replyElement = document.getElementById(
          `reply-${highlightReplyId}`
        );
        if (replyElement) {
          // Add highlight class
          replyElement.classList.add("highlight-reply");

          // Scroll to the highlighted reply
          replyElement.scrollIntoView({ behavior: "smooth", block: "center" });

          // Remove highlight after 3 seconds
          setTimeout(() => {
            replyElement.classList.remove("highlight-reply");
            setHighlightReplyId(null);
          }, 3000);
        }
      }, 200);
    }
  }, [drawerOpen, highlightReplyId, selectedPost]);

  // Scroll detection for infinite scroll
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      // Debounce scroll events
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const scrollContainer = document.querySelector(".max-w-md.mx-auto");
        if (scrollContainer) {
          const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
          const threshold = 200; // Load more when 200px from bottom

          if (scrollTop + clientHeight >= scrollHeight - threshold) {
            loadMoreNotifications();
          }
        }
      }, 100);
    };

    const scrollContainer = document.querySelector(".max-w-md.mx-auto");
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener("scroll", handleScroll);
      }
      clearTimeout(scrollTimeout);
    };
  }, [hasMore, loadingMore, loadMoreNotifications]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-11">
          <div className="flex items-center justify-between max-w-md mx-auto">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-black">Notifications</h1>
            </div>
          </div>
        </div>

        <div className="max-w-md mx-auto pb-20">
          <div className="flex items-center justify-center py-12">
            <LoaderRing size="lg" />
          </div>
        </div>

        <BottomTabs />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-11">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-black">Notifications</h1>
            {newNotificationsCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full min-w-[20px] text-center">
                {newNotificationsCount > 99 ? "99+" : newNotificationsCount}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto pb-20">
        {notifications.length > 0 ? (
          <>
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-black text-sm leading-relaxed">
                        {getNotificationMessage(notification)}
                        {notification.content.split(" ").length > 8 && (
                          <span className="text-blue-500 ml-1">see more</span>
                        )}
                      </p>
                      <p className="text-gray-500 text-xs mt-1">
                        {formatLocalTime(notification.timestamp)}
                      </p>
                    </div>
                    {/* Reaction button for new_post notifications only - Partner only */}
                    {notification.type === "new_post" &&
                      isPartnerOfPostOwner(notification.related_id) && (
                        <div className="flex-shrink-0 relative">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleNotificationEmojiPicker(notification.id);
                            }}
                            className={cn(
                              "h-8 w-8 p-0",
                              notificationReactions[notification.id] &&
                                "text-blue-500"
                            )}
                          >
                            {notificationReactions[notification.id] ? (
                              <span className="text-lg">
                                {notificationReactions[notification.id]}
                              </span>
                            ) : (
                              <SmilePlus className="h-4 w-4" />
                            )}
                          </Button>

                          {/* Notification Emoji Picker */}
                          {notificationEmojiPickerOpen === notification.id && (
                            <div className="notification-emoji-picker absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-1 z-50">
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
                                      handleNotificationReaction(
                                        notification.id,
                                        notification.related_id,
                                        emoji
                                      );
                                    }}
                                    className="text-lg hover:scale-110 transition-transform rounded p-1"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                    {/* Show existing reactions to post owners (read-only) */}
                    {notification.type === "new_post" &&
                      isPostOwner(notification.related_id) &&
                      notificationReactions[notification.id] && (
                        <div className="flex items-center h-8 px-2">
                          <span className="text-lg">
                            {notificationReactions[notification.id]}
                          </span>
                        </div>
                      )}
                  </div>
                </div>
              ))}
            </div>

            {/* Loading indicator for infinite scroll */}
            {loadingMore && (
              <div className="flex justify-center py-4">
                <div className="text-gray-500 text-sm">
                  Loading more notifications...
                </div>
              </div>
            )}

            {/* End of notifications indicator */}
            {!hasMore && notifications.length > limit && (
              <div className="flex justify-center py-4">
                <div className="text-gray-400 text-xs">
                  No more notifications
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 px-4">
            <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-black mb-2">
              No notifications yet
            </h3>
            <p className="text-gray-600">
              When your partner posts new seeds or interacts with yours, you'll
              see them here.
            </p>
          </div>
        )}
      </div>

      {/* Post Drawer */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="max-h-[80vh] max-w-md mx-auto w-full">
          <div className="max-w-md mx-auto w-full">
            <DrawerHeader>
              <DrawerTitle>Post Details</DrawerTitle>
            </DrawerHeader>

            <div className="flex-1 overflow-y-auto px-4">
              {selectedPost && (
                <>
                  {/* Original Post */}
                  <div className="border-b border-gray-100 pb-4 mb-4">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-gray-600">
                          {selectedPost.created_by_name[0]}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold text-black">
                            {selectedPost.created_by_name}
                          </span>
                          <span className="text-gray-500 text-sm">
                            {formatLocalTime(selectedPost.created_at)}
                          </span>
                        </div>
                        <HtmlContent
                          content={selectedPost.question}
                          className="text-black mb-3"
                        />

                        {/* Emoji Reaction Button */}
                        <div className="relative">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleEmojiPicker(selectedPost.id)}
                            className={cn(
                              "h-8",
                              emojiReactions[selectedPost.id] && "text-blue-500"
                            )}
                          >
                            {emojiReactions[selectedPost.id] ||
                            selectedPost.user_reaction ? (
                              <span className="text-lg mr-1">
                                {emojiReactions[selectedPost.id] ||
                                  selectedPost.user_reaction}
                              </span>
                            ) : (
                              <SmilePlus className="h-4 w-4" />
                            )}
                          </Button>

                          {/* Emoji Picker */}
                          {emojiPickerOpen === selectedPost.id && (
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
                                      handleEmojiReaction(
                                        selectedPost.id,
                                        emoji
                                      );
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
                      </div>
                    </div>
                  </div>

                  {/* Comments Section */}
                  <div className="space-y-3">
                    {selectedPost.replies.length > 0 ? (
                      selectedPost.replies.map((reply) => (
                        <div
                          key={reply.id}
                          id={`reply-${reply.id}`}
                          className="flex gap-2 p-2 rounded-lg transition-all duration-300"
                        >
                          <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-600">
                              {reply.user_name[0]}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 mb-0.5">
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
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No comments yet. Be the first to reply!
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Reply Input */}
            {selectedPost && (
              <DrawerFooter className="border-t border-gray-100">
                <div className="flex gap-2 w-full">
                  <Input
                    placeholder="Write a comment..."
                    value={replyText[selectedPost.id] || ""}
                    onChange={(e) =>
                      handleReplyTextChange(selectedPost.id, e.target.value)
                    }
                    onKeyPress={(e) =>
                      e.key === "Enter" && handleReply(selectedPost.id)
                    }
                    className="border-gray-200 focus:border-black"
                  />
                  <Button
                    onClick={() => handleReply(selectedPost.id)}
                    disabled={!replyText[selectedPost.id]?.trim()}
                    className="bg-black hover:bg-gray-800 text-white px-6"
                  >
                    Post
                  </Button>
                </div>
              </DrawerFooter>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      <BottomTabs />
    </div>
  );
}
