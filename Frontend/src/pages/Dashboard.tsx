import { AppLayout } from '@/components/layout/AppLayout';
import { PostGrid } from '@/components/posts/PostGrid';
import { usePosts } from '@/contexts/PostsContext';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Clock, CheckCircle2 } from 'lucide-react';

export default function Dashboard() {
  const { posts, deletePost, updatePostStatus } = usePosts();
  const { isAdmin } = useAuth();

  const unresolvedPosts = posts.filter(p => p.status === 'unresolved');
  const inProgressPosts = posts.filter(p => p.status === 'in_progress');
  const resolvedPosts = posts.filter(p => p.status === 'resolved');

  return (
    <AppLayout>
      <Tabs defaultValue="all" className="w-full">
        <div className="sticky top-14 z-30 bg-background border-b border-border">
          <TabsList className="w-full h-12 p-1 bg-muted/50 rounded-none">
            <TabsTrigger value="all" className="flex-1 data-[state=active]:bg-card">
              All
            </TabsTrigger>
            <TabsTrigger value="unresolved" className="flex-1 gap-1 data-[state=active]:bg-card">
              <AlertCircle className="w-3.5 h-3.5 text-destructive" />
              {unresolvedPosts.length}
            </TabsTrigger>
            <TabsTrigger value="progress" className="flex-1 gap-1 data-[state=active]:bg-card">
              <Clock className="w-3.5 h-3.5 text-warning" />
              {inProgressPosts.length}
            </TabsTrigger>
            <TabsTrigger value="resolved" className="flex-1 gap-1 data-[state=active]:bg-card">
              <CheckCircle2 className="w-3.5 h-3.5 text-success" />
              {resolvedPosts.length}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="all" className="mt-0">
          <PostGrid 
            posts={posts} 
            showAdminActions={isAdmin}
            onDelete={deletePost}
            onStatusChange={updatePostStatus}
          />
        </TabsContent>
        <TabsContent value="unresolved" className="mt-0">
          <PostGrid 
            posts={unresolvedPosts} 
            showAdminActions={isAdmin}
            onDelete={deletePost}
            onStatusChange={updatePostStatus}
            emptyMessage="No unresolved issues"
          />
        </TabsContent>
        <TabsContent value="progress" className="mt-0">
          <PostGrid 
            posts={inProgressPosts} 
            showAdminActions={isAdmin}
            onDelete={deletePost}
            onStatusChange={updatePostStatus}
            emptyMessage="No issues in progress"
          />
        </TabsContent>
        <TabsContent value="resolved" className="mt-0">
          <PostGrid 
            posts={resolvedPosts} 
            showAdminActions={isAdmin}
            onDelete={deletePost}
            onStatusChange={updatePostStatus}
            emptyMessage="No resolved issues yet"
          />
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
