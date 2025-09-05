"use client"

import { Star } from "lucide-react"

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

interface HighlightedMemoriesProps {
  photos: Photo[]
  onPhotoClick: (photo: Photo) => void
}

export function HighlightedMemories({ photos, onPhotoClick }: HighlightedMemoriesProps) {
  const highlightedPhotos = photos.filter((photo) => photo.isHighlighted)

  if (highlightedPhotos.length === 0) return null

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <Star className="h-5 w-5 text-primary" />
        Memories we cherish
      </h2>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {highlightedPhotos.map((photo) => (
          <button
            key={`highlight-${photo.id}`}
            onClick={() => onPhotoClick(photo)}
            className="flex-shrink-0 relative group"
          >
            <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-primary/30">
              <img src={photo.url || "/placeholder.svg"} alt={photo.caption} className="w-full h-full object-cover" />
            </div>
            <Star className="absolute -top-1 -right-1 h-4 w-4 text-primary fill-primary bg-background rounded-full p-0.5" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-xl" />
          </button>
        ))}
      </div>
    </div>
  )
}
