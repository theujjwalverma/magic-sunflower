"use client";
import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { toast } from "sonner";
import { useUser } from "@/lib/useUser";

export default function FeedSubscriptions() {
  const { user } = useUser();
  const [coupleId, setCoupleId] = useState<string | null>(null);

  useEffect(() => {
    const fetchCoupleId = async () => {
      if (!user) return;

      try {
        const response = await fetch(`/api/couples?userId=${user.id}`);
        const data = await response.json();

        if (response.ok && data.couples && data.couples.length > 0) {
          setCoupleId(data.couples[0].id);
        }
      } catch (error) {
        console.error("Error fetching couple ID:", error);
      }
    };

    fetchCoupleId();
  }, [user]);

  useEffect(() => {
    if (!user || !coupleId) return;

    const supabase = createBrowserSupabaseClient();

    const channel = supabase
      .channel("realtime-feed")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "feed_questions",
        },
        async (payload) => {
          try {
            // Verify if the question belongs to the user's couple
            const { data: questionData, error: questionError } = await supabase
              .from("feed_questions")
              .select("couple_id, created_by")
              .eq("id", payload.new.id)
              .single();

            if (questionError) {
              console.error("Error fetching question details:", questionError);
              return;
            }

            if (
              questionData.couple_id === coupleId &&
              questionData.created_by !== user.id
            ) {
              const questionContent = JSON.parse(payload.new.question);
              toast("New Question", {
                description:
                  questionContent.textContent?.substring(0, 50) + "...",
              });
            }
          } catch (error) {
            console.error("Real-time question update error:", error);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "feed_replies",
        },
        async (payload) => {
          try {
            // Verify if the reply belongs to the user's couple
            const { data: replyData, error: replyError } = await supabase
              .from("feed_replies")
              .select("question_id, user_id")
              .eq("id", payload.new.id)
              .single();

            if (replyError) {
              console.error("Error fetching reply details:", replyError);
              return;
            }

            // Check if the reply is for a question in the user's couple
            const { data: questionData, error: questionError } = await supabase
              .from("feed_questions")
              .select("couple_id")
              .eq("id", replyData.question_id)
              .single();

            if (questionError) {
              console.error(
                "Error fetching question for reply:",
                questionError
              );
              return;
            }

            if (
              questionData.couple_id === coupleId &&
              replyData.user_id !== user.id
            ) {
              toast("New Reply", {
                description: payload.new.reply.substring(0, 50) + "...",
              });
            }
          } catch (error) {
            console.error("Real-time reply update error:", error);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user, coupleId]);

  return null;
}
