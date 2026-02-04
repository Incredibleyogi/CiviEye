import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { usePosts } from '@/contexts/PostsContext';
import { Button } from '@/components/ui/button';
import { PostGrid } from '@/components/posts/PostGrid';
import { Settings, LogOut, Shield, Grid3X3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { SettingsSheet } from '@/components/profile/SettingsSheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Post } from '@/types';

function ProfileSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="p-6 text-center border-b border-border">
        <Skeleton className="w-24 h-24 rounded-full mx-auto mb-4" />
        <Skeleton className="h-6 w-32 mx-auto mb-2" />
        <Skeleton className="h-4 w-48 mx-auto" />
        <div className="flex justify-center mt-6">
          <Skeleton className="h-12 w-16" />
        </div>
        <div className="flex gap-2 mt-6">
          <Skeleton className="flex-1 h-9" />
          <Skeleton className="h-9 w-9" />
        </div>
      </div>
    </div>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout, isAdmin, loading } = useAuth();
  const { getUserPosts, deletePost, loading: postsLoading } = usePosts();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const userPosts = getUserPosts(user?.id || '');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleEdit = (post: Post) => {
    // Navigate to edit page with post data
    navigate('/create', { state: { editingPost: post } });
  };

  // Show skeleton while loading user data
  if (loading) {
    return (
      <AppLayout showLogo={false} title="Profile">
        <ProfileSkeleton />
      </AppLayout>
    );
  }

  return (
    <AppLayout showLogo={false} title="Profile">
      <div className="animate-fade-in">
        {/* Profile Header */}
        <div className="p-6 text-center border-b border-border">
          <img
            src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&size=96&background=random`}
            alt={user?.name}
            className="w-24 h-24 rounded-full mx-auto mb-4 ring-4 ring-primary/20 object-cover"
          />
          <div className="flex items-center justify-center gap-2 mb-1">
            <h2 className="text-xl font-bold text-foreground">{user?.name}</h2>
            {isAdmin && (
              <Badge variant="secondary" className="text-xs bg-secondary/20 text-secondary">
                <Shield className="w-3 h-3 mr-0.5" /> Admin
              </Badge>
            )}
          </div>
          {user?.bio && <p className="text-sm text-muted-foreground mt-2">{user.bio}</p>}

          <div className="flex justify-center mt-6">
            <div className="text-center">
              <p className="text-xl font-bold text-foreground">
                {postsLoading ? '...' : userPosts.length}
              </p>
              <p className="text-xs text-muted-foreground">Posts</p>
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <Button
              variant="outline"
              className="flex-1"
              size="sm"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings className="w-4 h-4 mr-2" /> Settings
            </Button>
            <Button variant="outline" onClick={handleLogout} size="sm">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* User Posts Tabs */}
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="w-full h-12 p-0 bg-transparent rounded-none border-b border-border">
            <TabsTrigger
              value="posts"
              className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent"
            >
              <Grid3X3 className="w-5 h-5" />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-0">
            <PostGrid
              posts={userPosts}
              variant="grid"
              onEdit={handleEdit}
              onDelete={deletePost}
              onStatusChange={(postId, status) => console.log(`[Profile] Status change: ${postId} -> ${status}`)}
              emptyMessage="You haven't reported any issues yet"
            />
          </TabsContent>
        </Tabs>
      </div>

      <SettingsSheet open={settingsOpen} onOpenChange={setSettingsOpen} />
    </AppLayout>
  );
}
