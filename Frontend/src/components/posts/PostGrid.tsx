import { Post, IssueStatus } from '@/types';
import { PostCard } from './PostCard';
import { PostGridCard } from './PostGridCard';

interface PostGridProps {
  posts: Post[];
  showActions?: boolean;
  showAdminActions?: boolean;
  onEdit?: (post: Post) => void;
  onDelete?: (id: string) => void;
  onStatusChange?: (postId: string, status: IssueStatus) => void;
  emptyMessage?: string;
  variant?: 'list' | 'grid';
}

export function PostGrid({ 
  posts, 
  showActions = false, 
  showAdminActions = false,
  onEdit, 
  onDelete, 
  onStatusChange,
  emptyMessage = 'No posts found',
  variant = 'list'
}: PostGridProps) {
  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
          <span className="text-4xl">📭</span>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">{emptyMessage}</h3>
        <p className="text-sm text-muted-foreground">
          Check back later for updates
        </p>
      </div>
    );
  }

  if (variant === 'grid') {
    return (
      <div className="grid grid-cols-3 gap-1 sm:gap-2 md:gap-3 p-4">
        {posts.map(post => (
          <PostGridCard 
            key={post.id} 
            post={post}
            onEdit={onEdit}
            onDelete={onDelete}
            onStatusChange={onStatusChange}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {posts.map(post => (
        <PostCard 
          key={post.id} 
          post={post} 
          showActions={showActions}
          showAdminActions={showAdminActions}
          onEdit={onEdit}
          onDelete={onDelete}
          onStatusChange={onStatusChange}
        />
      ))}
    </div>
  );
}
