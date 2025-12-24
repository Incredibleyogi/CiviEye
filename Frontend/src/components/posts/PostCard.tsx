import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, MapPin, MoreHorizontal, Pencil, Trash2, Send, Clock, CheckCircle2, AlertCircle, Shield } from 'lucide-react';
import { Post, IssueStatus } from '@/types';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { usePosts } from '@/contexts/PostsContext';

interface PostCardProps {
  post: Post;
  showActions?: boolean;
  showAdminActions?: boolean;
  onEdit?: (post: Post) => void;
  onDelete?: (id: string) => void;
  onStatusChange?: (postId: string, status: IssueStatus) => void;
}

const STATUS_CONFIG: Record<IssueStatus, { label: string; icon: typeof AlertCircle; className: string }> = {
  unresolved: { label: 'Unresolved', icon: AlertCircle, className: 'bg-destructive/10 text-destructive border-destructive/20' },
  in_progress: { label: 'In Progress', icon: Clock, className: 'bg-warning/10 text-warning border-warning/20' },
  resolved: { label: 'Resolved', icon: CheckCircle2, className: 'bg-success/10 text-success border-success/20' },
};

const CATEGORY_ICONS: Record<string, string> = {
  road: '🛣️',
  water: '💧',
  electricity: '⚡',
  sanitation: '🗑️',
  other: '📍',
};

export function PostCard({ post, showActions = false, showAdminActions = false, onEdit, onDelete, onStatusChange }: PostCardProps) {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { addComment, likePost, unlikePost } = usePosts();
  const [isLiked, setIsLiked] = useState(post.likedBy?.includes(user?.id || '') || false);
  const [likes, setLikes] = useState(post.likes || 0);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');

  const handleLike = () => {
    if (!user) return;
    
    if (isLiked) {
      unlikePost(post.id, user.id);
      setLikes(prev => prev - 1);
    } else {
      likePost(post.id, user.id);
      setLikes(prev => prev + 1);
    }
    setIsLiked(!isLiked);
  };

  const handleAddComment = () => {
    if (!newComment.trim() || !user) return;

    addComment(post.id, {
      text: newComment.trim(),
      user: {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
      },
    });
    setNewComment('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddComment();
    }
  };

  const handleUserClick = (userId: string) => {
    if (userId === user?.id) {
      navigate('/profile');
    } else {
      navigate(`/user/${userId}`);
    }
  };

  const locationText = [post.location?.address, post.location?.city, post.location?.village]
    .filter(Boolean)
    .join(', ');

  const comments = post.comments || [];
  const statusConfig = STATUS_CONFIG[post.status];
  const StatusIcon = statusConfig.icon;
  const isOwner = user?.id === post.user.id;

  return (
    <article className="bg-card border-b border-border animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => handleUserClick(post.user.id)}
        >
          <img
            src={post.user.avatar || `https://ui-avatars.com/api/?name=${post.user.name}&background=random`}
            alt={post.user.name}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/20"
          />
          <div>
            <h3 className="font-semibold text-sm text-foreground hover:underline">{post.user.name}</h3>
            {locationText && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {locationText}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Badge */}
          <Badge variant="outline" className={cn('text-xs font-medium gap-1', statusConfig.className)}>
            <StatusIcon className="w-3 h-3" />
            {statusConfig.label}
          </Badge>

          {/* Actions Menu */}
          {(showActions || (showAdminActions && isAdmin) || isOwner) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isOwner && (
                  <>
                    <DropdownMenuItem onClick={() => onEdit?.(post)}>
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete?.(post.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
                {isAdmin && (
                  <>
                    <DropdownMenuItem onClick={() => onStatusChange?.(post.id, 'in_progress')}>
                      <Clock className="w-4 h-4 mr-2 text-warning" />
                      Mark In Progress
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onStatusChange?.(post.id, 'resolved')}>
                      <CheckCircle2 className="w-4 h-4 mr-2 text-success" />
                      Mark Resolved
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Category Tag */}
      <div className="px-4 pb-2">
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
          {CATEGORY_ICONS[post.category]} {post.category.charAt(0).toUpperCase() + post.category.slice(1)}
        </span>
      </div>

      {/* Image */}
      <div className="relative aspect-square bg-muted">
        <img
          src={post.imageUrl}
          alt={post.caption}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      {/* Actions */}
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-4">
          <button
            onClick={handleLike}
            className="flex items-center gap-1 transition-transform active:scale-90"
          >
            <Heart
              className={cn(
                'w-6 h-6 transition-all duration-200',
                isLiked ? 'fill-destructive text-destructive scale-110' : 'text-foreground'
              )}
            />
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1"
          >
            <MessageCircle className={cn(
              'w-6 h-6',
              showComments ? 'text-primary' : 'text-foreground'
            )} />
          </button>
        </div>

        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">{likes.toLocaleString()} likes</p>
          <p className="text-sm text-foreground">
            <span className="font-semibold">{post.user.name}</span>{' '}
            {post.caption}
          </p>
          
          {/* Admin Response */}
          {post.adminResponse && (
            <div className="mt-3 p-3 rounded-lg bg-secondary/10 border border-secondary/20">
              <div className="flex items-center gap-1.5 text-secondary text-xs font-medium mb-1">
                <Shield className="w-3.5 h-3.5" />
                Official Response
              </div>
              <p className="text-sm text-foreground">{post.adminResponse.message}</p>
              <p className="text-xs text-muted-foreground mt-1">
                — {post.adminResponse.adminName}, {formatDistanceToNow(new Date(post.adminResponse.respondedAt), { addSuffix: true })}
              </p>
            </div>
          )}
          
          {comments.length > 0 && !showComments && (
            <button
              onClick={() => setShowComments(true)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              View all {comments.length} comments
            </button>
          )}
          <p className="text-xs text-muted-foreground uppercase">
            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
          </p>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="pt-3 border-t border-border space-y-3 animate-fade-in">
            <div className="max-h-48 overflow-y-auto space-y-3">
              {comments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">No comments yet. Be the first!</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-2">
                    <img
                      src={comment.user.avatar || `https://ui-avatars.com/api/?name=${comment.user.name}&background=random&size=32`}
                      alt={comment.user.name}
                      className="w-7 h-7 rounded-full object-cover flex-shrink-0 cursor-pointer hover:opacity-80"
                      onClick={() => handleUserClick(comment.user.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span
                          className="font-semibold text-foreground cursor-pointer hover:underline"
                          onClick={() => handleUserClick(comment.user.id)}
                        >
                          {comment.user.name}
                        </span>{' '}
                        <span className="text-foreground">{comment.text}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add Comment Input */}
            <div className="flex items-center gap-2">
              <img
                src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name || 'U'}&background=random&size=32`}
                alt="You"
                className="w-7 h-7 rounded-full object-cover flex-shrink-0"
              />
              <div className="flex-1 flex gap-2">
                <Input
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 h-9 text-sm"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className="h-9 w-9"
                >
                  <Send className={cn(
                    'w-4 h-4',
                    newComment.trim() ? 'text-primary' : 'text-muted-foreground'
                  )} />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
