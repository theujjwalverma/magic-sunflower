"use client";

import { useState } from "react";
import {
  Plus,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Grid3X3,
} from "lucide-react";
import { BottomTabs } from "@/components/navigation/bottom-tabs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface Photo {
  id: string;
  url: string;
  caption: string;
  author: "me" | "partner";
  authorName: string;
  timestamp: string;
  comments: Comment[];
  likes: number;
  isLiked: boolean;
  isHighlighted: boolean;
}

interface Comment {
  id: string;
  author: "me" | "partner";
  authorName: string;
  content: string;
  timestamp: string;
}

const samplePhotos: Photo[] = [
  {
    id: "1",
    url: "/romantic-couple-sunset.png",
    caption: "Our first sunset together 🌅",
    author: "partner",
    authorName: "Sarah",
    timestamp: "2 days ago",
    likes: 2,
    isLiked: true,
    isHighlighted: true,
    comments: [
      {
        id: "c1",
        author: "me",
        authorName: "Alex",
        content: "This was magical! I love you ❤️",
        timestamp: "2 days ago",
      },
    ],
  },
  {
    id: "2",
    url: "/couple-cooking.png",
    caption: "Cooking disaster turned into the best date night 😂",
    author: "me",
    authorName: "Alex",
    timestamp: "1 week ago",
    likes: 1,
    isLiked: false,
    isHighlighted: false,
    comments: [],
  },
  {
    id: "3",
    url: "/couple-mountain-hike.png",
    caption: "Adventure buddies for life 🏔️",
    author: "partner",
    authorName: "Sarah",
    timestamp: "2 weeks ago",
    likes: 3,
    isLiked: true,
    isHighlighted: true,
    comments: [
      {
        id: "c2",
        author: "partner",
        authorName: "Sarah",
        content: "Can't wait for our next adventure!",
        timestamp: "2 weeks ago",
      },
      {
        id: "c3",
        author: "me",
        authorName: "Alex",
        content: "Already planning the next one 😉",
        timestamp: "2 weeks ago",
      },
    ],
  },
];

export function ProfileTab() {
  const [photos, setPhotos] = useState<Photo[]>(samplePhotos);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [newComment, setNewComment] = useState("");
  const [isAddingPhoto, setIsAddingPhoto] = useState(false);
  const [newPhotoCaption, setNewPhotoCaption] = useState("");

  const handleLike = (photoId: string) => {
    setPhotos((prev) =>
      prev.map((photo) =>
        photo.id === photoId
          ? {
              ...photo,
              isLiked: !photo.isLiked,
              likes: photo.isLiked ? photo.likes - 1 : photo.likes + 1,
            }
          : photo
      )
    );
  };

  const handleComment = (photoId: string) => {
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: Date.now().toString(),
      author: "me",
      authorName: "Alex",
      content: newComment,
      timestamp: "Just now",
    };

    setPhotos((prev) =>
      prev.map((photo) =>
        photo.id === photoId
          ? { ...photo, comments: [...photo.comments, comment] }
          : photo
      )
    );

    setNewComment("");
  };

  const handleAddPhoto = () => {
    if (!newPhotoCaption.trim()) return;

    const newPhoto: Photo = {
      id: Date.now().toString(),
      url: "/couple-memory.png",
      caption: newPhotoCaption,
      author: "me",
      authorName: "Alex",
      timestamp: "Just now",
      likes: 0,
      isLiked: false,
      isHighlighted: false,
      comments: [],
    };

    setPhotos([newPhoto, ...photos]);
    setNewPhotoCaption("");
    setIsAddingPhoto(false);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <h1 className="text-xl font-bold text-black">Profile</h1>
          <Button variant="ghost" size="icon" className="rounded-full">
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="max-w-md mx-auto pb-20">
        {/* Profile info */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-black">Our Love Story</h2>
              <p className="text-gray-600">@our_love_story</p>
              <p className="text-black mt-2">Two hearts, one story 💕</p>
            </div>
            <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-2xl">💕</span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-6 mb-4">
            <div>
              <span className="font-bold text-black">{photos.length}</span>
              <span className="text-gray-600 ml-1">memories</span>
            </div>
            <div>
              <span className="font-bold text-black">2</span>
              <span className="text-gray-600 ml-1">hearts</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 mb-4">
            <Dialog open={isAddingPhoto} onOpenChange={setIsAddingPhoto}>
              <DialogTrigger asChild>
                <Button className="flex-1 bg-black hover:bg-gray-800 text-white">
                  Add Memory
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Memory</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <Plus className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      Click to upload photo
                    </p>
                  </div>
                  <Textarea
                    placeholder="Add a caption..."
                    value={newPhotoCaption}
                    onChange={(e) => setNewPhotoCaption(e.target.value)}
                    className="border-gray-200 focus:border-black"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsAddingPhoto(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddPhoto}
                      disabled={!newPhotoCaption.trim()}
                      className="flex-1 bg-black hover:bg-gray-800 text-white"
                    >
                      Share
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button
              variant="outline"
              className="border-gray-300 bg-transparent"
            >
              Share Profile
            </Button>
          </div>
        </div>

        {/* Tab selector */}
        <div className="border-b border-gray-200">
          <div className="flex">
            <button className="flex-1 py-3 flex items-center justify-center gap-2 border-b-2 border-black">
              <Grid3X3 className="h-4 w-4" />
              <span className="text-sm font-medium">Posts</span>
            </button>
          </div>
        </div>

        <div className="p-1">
          <div className="grid grid-cols-3 gap-1">
            {photos.map((photo) => (
              <button
                key={photo.id}
                onClick={() => setSelectedPhoto(photo)}
                className="aspect-square overflow-hidden relative group"
              >
                <img
                  src={photo.url || "/placeholder.svg"}
                  alt={photo.caption}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                <div className="absolute top-2 right-2 flex gap-1">
                  {photo.comments.length > 0 && (
                    <div className="bg-black/60 rounded-full p-1">
                      <MessageCircle className="h-3 w-3 text-white" />
                    </div>
                  )}
                  {photo.isLiked && (
                    <div className="bg-black/60 rounded-full p-1">
                      <Heart className="h-3 w-3 text-red-500 fill-current" />
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Photo detail modal */}
        {selectedPhoto && (
          <Dialog
            open={!!selectedPhoto}
            onOpenChange={() => setSelectedPhoto(null)}
          >
            <DialogContent className="sm:max-w-md">
              <div className="max-w-md mx-auto w-full">
                <div className="space-y-4">
                  {/* Photo */}
                  <div className="relative">
                    <img
                      src={selectedPhoto.url || "/placeholder.svg"}
                      alt={selectedPhoto.caption}
                      className="w-full h-64 object-cover rounded-xl"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedPhoto(null)}
                      className="absolute top-2 right-2 bg-black/50 text-white hover:bg-black/70 rounded-full"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Photo info */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium">
                            {selectedPhoto.authorName[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {selectedPhoto.authorName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {selectedPhoto.timestamp}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLike(selectedPhoto.id)}
                          className={cn(
                            "rounded-full",
                            selectedPhoto.isLiked && "text-red-500"
                          )}
                        >
                          <Heart
                            className={cn(
                              "h-4 w-4 mr-1",
                              selectedPhoto.isLiked && "fill-current"
                            )}
                          />
                          {selectedPhoto.likes}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-full h-8 w-8"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <p className="text-foreground">{selectedPhoto.caption}</p>

                    {/* Comments */}
                    {selectedPhoto.comments.length > 0 && (
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {selectedPhoto.comments.map((comment) => (
                          <div key={comment.id} className="flex gap-2">
                            <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-medium">
                                {comment.authorName[0]}
                              </span>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm">
                                <span className="font-medium">
                                  {comment.authorName}
                                </span>{" "}
                                {comment.content}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {comment.timestamp}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add comment */}
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyPress={(e) =>
                          e.key === "Enter" && handleComment(selectedPhoto.id)
                        }
                        className="rounded-xl"
                      />
                      <Button
                        size="icon"
                        onClick={() => handleComment(selectedPhoto.id)}
                        disabled={!newComment.trim()}
                        className="rounded-full bg-primary hover:bg-primary/90"
                      >
                        <Heart className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Empty state */}
        {photos.length === 0 && (
          <div className="text-center py-12 px-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Grid3X3 className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-black mb-2">
              No posts yet
            </h3>
            <p className="text-gray-600 mb-4">
              Share your first memory together!
            </p>
            <Button
              onClick={() => setIsAddingPhoto(true)}
              className="bg-black hover:bg-gray-800 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Share photo
            </Button>
          </div>
        )}
      </div>

      <BottomTabs />
    </div>
  );
}
