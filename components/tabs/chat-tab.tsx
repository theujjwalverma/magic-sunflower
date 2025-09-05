"use client";

import { useState, useRef, useEffect } from "react";
import {
  Heart,
  Send,
  Smile,
  Pin,
  Search,
  Paperclip,
  ChevronUp,
  ChevronDown,
  X,
} from "lucide-react";
import { BottomTabs } from "@/components/navigation/bottom-tabs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatChatTime } from "@/lib/time-utils";

interface Message {
  id: number;
  content: string;
  sender_id: string;
  couple_id: number;
  created_at: string;
  reactions?: Array<{ id: number; emoji: string; user_id: string }>;
  is_pinned?: boolean;
}

const quickReactions = ["❤️", "😂", "👍", "🔥", "🥺"];

const MOCK_COUPLE_ID = 1;
const MOCK_USER_ID = "user1";
const MOCK_PARTNER_ID = "user2";

export function ChatTab() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<number | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<number[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [highlightedMessage, setHighlightedMessage] = useState<number | null>(
    null
  );
  const [showPinnedSection, setShowPinnedSection] = useState(true);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatAreaRef = useRef<HTMLDivElement>(null);

  const emojis = [
    "😀",
    "😂",
    "🥰",
    "😍",
    "🤔",
    "👍",
    "👎",
    "❤️",
    "💕",
    "🔥",
    "✨",
    "🎉",
    "😊",
    "😘",
    "🥺",
    "😭",
  ];

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/messages?coupleId=${MOCK_COUPLE_ID}`);
      const data = await response.json();
      if (response.ok) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const results = messages
        .filter((msg) =>
          msg.content.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .map((msg) => msg.id);
      setSearchResults(results);
      setCurrentSearchIndex(0);
    } else {
      setSearchResults([]);
      setCurrentSearchIndex(0);
      setHighlightedMessage(null);
    }
  }, [searchQuery, messages]);

  const navigateSearch = (direction: "up" | "down") => {
    if (searchResults.length === 0) return;

    let newIndex = currentSearchIndex;
    if (direction === "up") {
      newIndex =
        currentSearchIndex > 0
          ? currentSearchIndex - 1
          : searchResults.length - 1;
    } else {
      newIndex =
        currentSearchIndex < searchResults.length - 1
          ? currentSearchIndex + 1
          : 0;
    }

    setCurrentSearchIndex(newIndex);
    const messageId = searchResults[newIndex];
    setHighlightedMessage(messageId);

    const messageElement = document.getElementById(`message-${messageId}`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => setHighlightedMessage(null), 1000);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coupleId: MOCK_COUPLE_ID,
          senderId: MOCK_USER_ID,
          content: newMessage,
        }),
      });

      if (response.ok) {
        setNewMessage("");
        fetchMessages(); // Refresh messages
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleReaction = async (messageId: number, reaction: string) => {
    try {
      const existingReaction = messages
        .find((m) => m.id === messageId)
        ?.reactions?.find((r) => r.user_id === MOCK_USER_ID);

      if (existingReaction?.emoji === reaction) {
        // Remove reaction
        await fetch(
          `/api/messages/reactions?messageId=${messageId}&userId=${MOCK_USER_ID}`,
          {
            method: "DELETE",
          }
        );
      } else {
        // Add or update reaction
        await fetch("/api/messages/reactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messageId,
            userId: MOCK_USER_ID,
            emoji: reaction,
          }),
        });
      }

      fetchMessages(); // Refresh messages
      setSelectedMessage(null);
    } catch (error) {
      console.error("Error handling reaction:", error);
    }
  };

  const togglePin = async (messageId: number) => {
    try {
      const message = messages.find((m) => m.id === messageId);
      if (message?.is_pinned) {
        // Unpin message
        await fetch(`/api/messages/pin?messageId=${messageId}`, {
          method: "DELETE",
        });
      } else {
        // Pin message
        await fetch("/api/messages/pin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messageId,
            coupleId: MOCK_COUPLE_ID,
            pinnedBy: MOCK_USER_ID,
          }),
        });
      }

      fetchMessages(); // Refresh messages
      setSelectedMessage(null);
    } catch (error) {
      console.error("Error toggling pin:", error);
    }
  };

  const insertEmoji = (emoji: string) => {
    setNewMessage((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  const scrollToPinnedMessage = (messageId: number) => {
    const messageElement = document.getElementById(`message-${messageId}`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedMessage(messageId);
      setTimeout(() => setHighlightedMessage(null), 1000);
    }
  };

  const handleMessageClick = (messageId: number, senderId: string) => {
    if (senderId !== MOCK_USER_ID) {
      setSelectedMessage(selectedMessage === messageId ? null : messageId);
    }
  };

  const getSenderName = (senderId: string) => {
    return senderId === MOCK_USER_ID ? "You" : "Sarah";
  };

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-white">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center gap-3 max-w-md mx-auto">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">S</span>
              </div>
              <div>
                <h2 className="font-semibold text-black">Sarah</h2>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <p className="text-sm text-gray-500">Active now</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center max-w-md mx-auto w-full">
          <div className="text-gray-500">Loading messages...</div>
        </div>

        <BottomTabs />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      <div className="flex-1 flex flex-col min-h-0">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center gap-3 max-w-md mx-auto">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">S</span>
              </div>
              <div>
                <h2 className="font-semibold text-black">Sarah</h2>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <p className="text-sm text-gray-500">Active now</p>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => setShowSearch(!showSearch)}
            >
              <Search className="h-5 w-5" />
            </Button>
          </div>

          {showSearch && (
            <div className="mt-3 flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2 max-w-md mx-auto">
              <Search className="h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent outline-none text-sm"
                autoFocus
              />
              {searchResults.length > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500">
                    {currentSearchIndex + 1}/{searchResults.length}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => navigateSearch("up")}
                  >
                    <ChevronUp className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => navigateSearch("down")}
                  >
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setShowSearch(false)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        {messages.some((msg) => msg.is_pinned) && (
          <div className="sticky top-[73px] z-10 bg-blue-50 border-b border-gray-200">
            <div
              className="px-4 py-2 flex items-center justify-between cursor-pointer"
              onClick={() => setShowPinnedSection(!showPinnedSection)}
            >
              <div className="flex items-center gap-2">
                <Pin className="h-4 w-4 text-blue-600" />
                <p className="text-sm font-medium text-blue-800">
                  Pinned Messages
                </p>
              </div>
              <ChevronUp
                className={cn(
                  "h-4 w-4 text-blue-600 transition-transform",
                  !showPinnedSection && "rotate-180"
                )}
              />
            </div>
            {showPinnedSection && (
              <div className="px-4 pb-3 space-y-2">
                {messages
                  .filter((msg) => msg.is_pinned)
                  .map((msg) => (
                    <div
                      key={`pinned-${msg.id}`}
                      className="text-sm text-blue-800 bg-white rounded-lg px-3 py-2 cursor-pointer hover:bg-blue-50 transition-colors"
                      onClick={() => scrollToPinnedMessage(msg.id)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-blue-600 font-medium">
                          {getSenderName(msg.sender_id)}:
                        </span>
                        <span className="truncate">"{msg.content}"</span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        <div className="flex-1 flex flex-col max-w-md mx-auto w-full">
          <div
            ref={chatAreaRef}
            className="flex-1 p-4 space-y-4 overflow-y-auto min-h-0"
          >
            <div className="text-center">
              <p className="text-sm text-gray-500 bg-gray-100 rounded-full px-4 py-2 inline-block">
                Today
              </p>
            </div>

            {messages.map((message) => (
              <div
                key={message.id}
                id={`message-${message.id}`}
                className={cn(
                  "flex",
                  message.sender_id === MOCK_USER_ID
                    ? "justify-end"
                    : "justify-start"
                )}
              >
                <div className="relative max-w-[80%] group">
                  <div className="relative">
                    <div
                      className={cn(
                        "rounded-2xl px-4 py-2 relative transition-all duration-300",
                        message.sender_id === MOCK_USER_ID
                          ? "bg-black text-white"
                          : "bg-gray-100 text-black cursor-pointer hover:bg-gray-200",
                        highlightedMessage === message.id &&
                          "ring-2 ring-blue-400 bg-blue-100",
                        selectedMessage === message.id && "ring-2 ring-blue-500"
                      )}
                      onClick={() =>
                        handleMessageClick(message.id, message.sender_id)
                      }
                    >
                      {message.is_pinned && (
                        <Pin className="h-3 w-3 text-current absolute -top-1 -left-1" />
                      )}
                      <p>{message.content}</p>
                      <div className="flex items-center justify-between mt-1">
                        <p
                          className={cn(
                            "text-xs",
                            message.sender_id === MOCK_USER_ID
                              ? "text-gray-300"
                              : "text-gray-500"
                          )}
                        >
                          {formatChatTime(message.created_at)}
                        </p>
                        {message.sender_id === MOCK_USER_ID && (
                          <span className="text-xs text-gray-300 ml-2">
                            <Heart className="h-3 w-3 text-red-500 fill-red-500" />
                          </span>
                        )}
                      </div>
                    </div>

                    {selectedMessage === message.id &&
                      message.sender_id !== MOCK_USER_ID && (
                        <div className="absolute -top-14 left-1/2 transform -translate-x-1/2 bg-white border rounded-full px-3 py-2 shadow-lg flex items-center gap-2 z-10">
                          {quickReactions.map((reaction) => (
                            <button
                              key={reaction}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReaction(message.id, reaction);
                              }}
                              className="hover:scale-110 transition-transform p-1 text-lg"
                            >
                              {reaction}
                            </button>
                          ))}
                          <div className="w-px h-6 bg-gray-200 mx-1" />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePin(message.id);
                            }}
                            className="hover:scale-110 transition-transform p-1"
                          >
                            <Pin
                              className={cn(
                                "h-4 w-4",
                                message.is_pinned
                                  ? "text-blue-600 fill-blue-600"
                                  : "text-gray-400"
                              )}
                            />
                          </button>
                        </div>
                      )}
                  </div>

                  {message.reactions && message.reactions.length > 0 && (
                    <div className="flex gap-1 mt-1 ml-2">
                      {message.reactions.map((reaction) => (
                        <span
                          key={reaction.id}
                          className="text-xs bg-white border border-gray-200 rounded-full px-2 py-1 shadow-sm"
                        >
                          {reaction.emoji}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="sticky bottom-0 z-10 p-4 bg-white border-t border-gray-200">
          {showEmojiPicker && (
            <div className="mb-3 bg-white border rounded-lg shadow-lg p-3">
              <div className="grid grid-cols-8 gap-2">
                {emojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => insertEmoji(emoji)}
                    className="text-xl hover:bg-gray-100 rounded p-1 transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="flex-1 bg-gray-100 rounded-full px-4 py-2 flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-full"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                <Smile className="h-4 w-4" />
              </Button>
              <input
                type="text"
                placeholder="Message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                className="flex-1 bg-transparent outline-none text-sm"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-full"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
            </div>

            <Button
              size="icon"
              className="rounded-full bg-black hover:bg-gray-800 text-white"
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <BottomTabs />
    </div>
  );
}
