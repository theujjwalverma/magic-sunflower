"use client"

import { Heart, MessageCircle, Star } from "lucide-react"

interface Photo {
  id: string
  url: string
  caption: string
  author: "me" | "partner"
  authorName: string
  timestamp: string
  comments: any[]
  likes: number
  isLiked: boolean
  isHighlighted: boolean
}

interface PhotoGridProps {
  photos: Photo[]
  onPhotoClick: (photo: Photo) => void
}

export function PhotoGrid({ photos, onPhotoClick }: PhotoGridProps) {
  return (
    <div className="grid grid-cols-3 gap-1">
      {photos.map((photo) => (
        <button
          key={photo.id}
          onClick={() => onPhotoClick(photo)}
          className="aspect-square rounded-lg overflow-hidden relative group"
        >
          <img src={photo.url || "/placeholder.svg"} alt={photo.caption} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />

          {/* Photo indicators */}
          <div className="absolute bottom-1 right-1 flex gap-1">
            {photo.isHighlighted && (
              <div className="bg-black/60 rounded-full p-1">
                <Star className="h-3 w-3 text-primary fill-current" />
              </div>
            )}
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

          {/* Photo overlay info */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="absolute bottom-2 left-2 text-white">
              <p className="text-xs font-medium truncate">{photo.caption}</p>
              <p className="text-xs opacity-80">{photo.timestamp}</p>
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}
