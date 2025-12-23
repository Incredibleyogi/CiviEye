import { Settings } from "lucide-react";
import PostGrid from "../components/posts/PostGrid";

export default function Profile() {
  return (
    <div className="px-4 pt-4">
      <h1 className="text-center font-semibold text-lg mb-4">Profile</h1>

      <div className="flex items-center gap-4">
        <img
          src="https://i.pravatar.cc/150"
          className="w-20 h-20 rounded-full border-2 border-blue-400"
        />

        <div className="flex-1">
          <h2 className="font-semibold text-lg">John Doe</h2>
          <p className="text-sm text-gray-500">
            yogeshkawadkar413@gmail.com
          </p>
          <p className="text-sm">
            Civic activist and community advocate
          </p>
        </div>

        <Settings />
      </div>

      <div className="text-center mt-4">
        <p className="font-semibold text-lg">1</p>
        <p className="text-gray-500 text-sm">Posts</p>
      </div>

      <div className="mt-4 border-t pt-4">
        <PostGrid />
      </div>
    </div>
  );
}
