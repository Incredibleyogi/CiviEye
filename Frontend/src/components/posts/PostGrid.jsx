import { Heart, MessageCircle } from "lucide-react";

export default function PostGrid() {
  return (
    <div className="grid grid-cols-3 gap-2px">
      <div className="relative group aspect-square">
        <img
          src="https://images.unsplash.com/photo-1581091012184-5c7f7f6c3c70"
          className="w-full h-full object-cover"
        />

        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-4 text-white transition">
          <span className="flex gap-1 items-center">
            <Heart size={16} /> 156
          </span>
          <span className="flex gap-1 items-center">
            <MessageCircle size={16} /> 2
          </span>
        </div>
      </div>
    </div>
  );
}
