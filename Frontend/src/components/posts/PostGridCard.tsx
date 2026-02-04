import { useState } from 'react';
import { Post, IssueStatus } from '@/types';
import { Heart, MessageCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { PostCard } from './PostCard';

interface PostGridCardProps {
  post: Post;
  onEdit?: (post: Post) => void;
  onDelete?: (id: string) => void;
  onStatusChange?: (postId: string, status: IssueStatus) => void;
}

export function PostGridCard({ post, onEdit, onDelete, onStatusChange }: PostGridCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Grid Card */}
      <div
        className="relative aspect-square bg-muted cursor-pointer group overflow-hidden rounded-lg"
        onClick={() => setIsOpen(true)}
      >
        {/* Image */}
        <img
          src={post.imageUrl}
          alt={post.caption}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          loading="lazy"
        />

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-6">
          <div className="flex items-center gap-2 text-white">
            <Heart className="w-6 h-6 fill-white" />
            <span className="font-semibold text-sm">{post.likes || 0}</span>
          </div>
          <div className="flex items-center gap-2 text-white">
            <MessageCircle className="w-6 h-6 fill-white" />
            <span className="font-semibold text-sm">{post.comments?.length || 0}</span>
          </div>
        </div>
      </div>

      {/* Full Post Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 bg-background">
          <DialogHeader className="sr-only">
            <h2>Post Details</h2>
          </DialogHeader>
          <div className="p-4">
            <PostCard 
              post={post}
              showAdminActions
              onEdit={onEdit}
              onDelete={onDelete}
              onStatusChange={onStatusChange}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
