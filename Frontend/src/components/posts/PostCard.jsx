import { Heart, MessageCircle } from "lucide-react";

export default function PostCard() {
  return (
    <div className="bg-white border rounded-lg">
      <img
        src="https://images.unsplash.com/photo-1581091012184-5c7f7f6c3c70"
        className="w-full h-56 object-cover rounded-t-lg"
      />

      <div className="p-3">
        <h3 className="font-semibold">Road Construction Issue</h3>
        <p className="text-sm text-gray-600">
          Unsafe construction work causing traffic problems.
        </p>

        <div className="flex gap-4 mt-2 text-gray-600">
          <span className="flex items-center gap-1">
            <Heart size={16} /> 156
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle size={16} /> 2
          </span>
        </div>
      </div>
    </div>
  );
}
