import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { PostGrid } from '@/components/posts/PostGrid';
import { Grid3X3, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
}

interface Post {
  id: string;
  imageUrl: string;
  caption: string;
  category: string;
  status: string;
  likes: number;
  likedBy: string[];
  comments: any[];
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  location?: {
    address?: string;
    city?: string;
    village?: string;
  };
}

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser} = useAuth();
  const token = localStorage.getItem('civiceye_token');
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect to own profile if viewing self
  useEffect(() => {
    if (userId === currentUser?.id) {
      navigate('/profile', { replace: true });
    }
  }, [userId, currentUser?.id, navigate]);

  // Fetch user profile and posts
  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) return;

       if (!token) {
      console.log('No token available yet');
      return;
    }
      
      setLoading(true);
      // setError(null);

      try {
        // Fetch user profile
        console.log('Fetching user:', userId); // Debug log
        const profileRes = await fetch(
          `${import.meta.env.VITE_API_URL}/auth/user/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
         console.log('Profile response status:', profileRes.status); // Debug log

        if (!profileRes.ok) {
          if (profileRes.status === 404) {
            throw new Error('User not found');
          }
          throw new Error('Failed to load profile');
        }

        const profileData = await profileRes.json();
        console.log('Profile data:', profileData); // Debug log
        setProfile(profileData.user);

        // Fetch user's posts
        const postsRes = await fetch(
          `${import.meta.env.VITE_API_URL}/posts/user/${userId}`,
          {
            cache: "no-store",  // Add this
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (postsRes.ok) {
          const postsData = await postsRes.json();
          console.log('Posts response:', postsData); // Debug log
          setPosts(postsData.posts || postsData|| []);
        }
      } catch (err: any) {
         console.error('Fetch error:', err); // Debug log
        setError(err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId, token]);

  if (loading) {
    return (
      <AppLayout showLogo={false} title="Profile">
        <div className="animate-fade-in">
          <div className="p-6 text-center border-b border-border">
            <Skeleton className="w-24 h-24 rounded-full mx-auto mb-4" />
            <Skeleton className="h-6 w-32 mx-auto mb-2" />
            <Skeleton className="h-4 w-48 mx-auto" />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error || !profile) {
    return (
      <AppLayout showLogo={false} title="Profile">
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-6">
          <p className="text-destructive mb-4">{error || 'User not found'}</p>
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout showLogo={false} title={profile.name}>
      <div className="animate-fade-in">
        {/* Back Button */}
        <div className="p-4 border-b border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>

        {/* Profile Header */}
        <div className="p-6 text-center border-b border-border">
          <img
            src={
              profile.avatar ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&size=96&background=random`
            }
            alt={profile.name}
            className="w-24 h-24 rounded-full mx-auto mb-4 ring-4 ring-primary/20 object-cover"
          />
          <h2 className="text-xl font-bold text-foreground">{profile.name}</h2>
          {profile.bio && (
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
              {profile.bio}
            </p>
          )}

          <div className="flex justify-center mt-6">
            <div className="text-center">
              <p className="text-xl font-bold text-foreground">{posts.length}</p>
              <p className="text-xs text-muted-foreground">Posts</p>
            </div>
          </div>
        </div>

        {/* User Posts */}
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
              posts={posts}
              showActions={false}
              emptyMessage={`${profile.name} hasn't posted any issues yet`}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

