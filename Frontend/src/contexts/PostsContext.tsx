import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { postsApi } from '@/lib/api';

// Types
export type IssueStatus = 'unresolved' | 'in_progress' | 'resolved';
export type IssueCategory = 'roads' | 'water' | 'electricity' | 'sanitation' | 'other';

export interface Comment {
  id: string;
  text: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  createdAt: string;
}

export interface Post {
  id: string;
  imageUrl: string;
  caption: string;
  createdAt: string;
  location: {
    address?: string;
    city?: string;
    village?: string;
    coordinates?: { lat: number; lng: number };
  };
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  likes: number;
  likedBy: string[];
  comments: Comment[];
  status: IssueStatus;
  category: IssueCategory;
  adminResponse?: {
    message: string;
    respondedAt: string;
    adminName: string;
  };
}

interface PostsContextType {
  posts: Post[];
  loading: boolean;
  addPost: (post: Omit<Post, 'id' | 'createdAt'>) => Promise<{ success: boolean; error?: string }>;
  updatePost: (id: string, updates: Partial<Post>) => void;
  deletePost: (id: string) => Promise<boolean>;
  getUserPosts: (userId: string) => Post[];
  searchPosts: (query: string) => Post[];
  filterPosts: (filters: { status?: IssueStatus; category?: IssueCategory }) => Post[];
  addComment: (postId: string, comment: Omit<Comment, 'id' | 'createdAt'>) => Promise<boolean>;
  updateUserInPosts: (userId: string, updates: { name?: string; avatar?: string }) => void;
  likePost: (postId: string, userId: string) => Promise<boolean>;
  unlikePost: (postId: string, userId: string) => Promise<boolean>;
  updatePostStatus: (postId: string, status: IssueStatus, adminResponse?: string) => Promise<boolean>;
  refreshPosts: () => Promise<void>;
  addNewPost: (post: Post) => void;
}

const PostsContext = createContext<PostsContextType | undefined>(undefined);

/* -------------------- NORMALIZER -------------------- */
// FIX: Properly normalize likedBy to string[] for consistent comparison
const normalizeLikedBy = (likes: any[]): string[] => {
  if (!Array.isArray(likes)) return [];
  
  return likes.map((l: any) => {
    // Handle ObjectId objects from MongoDB
    if (typeof l === 'object' && l !== null) {
      // Check for _id field (populated user object)
      if (l._id) return String(l._id);
      // Check for id field
      if (l.id) return String(l.id);
      // Try toString() for ObjectId
      if (typeof l.toString === 'function' && l.toString() !== '[object Object]') {
        return l.toString();
      }
    }
    // Already a string
    return String(l);
  });
};

const normalizePost = (p: any): Post => ({
  id: p._id || p.id,
  imageUrl: p.image || (Array.isArray(p.images) ? p.images[0] : '') || p.imageUrl || '',
  caption: p.description || p.caption || '',
  createdAt: p.createdAt,
  location: {
    address: p.address,
    city: p.location?.city,
    village: p.location?.village,
    coordinates: p.location?.coordinates
      ? { lat: p.location.coordinates[1], lng: p.location.coordinates[0] }
      : undefined,
  },
  user: {
    id: p.user?._id || p.user?.id || '',
    name: p.user?.name || 'Anonymous',
    avatar: p.user?.avatar,
  },
  likes: p.likes?.length || p.likesCount || 0,
  // FIX: Use proper normalization function
  likedBy: normalizeLikedBy(p.likes || []),
  comments: (p.comments || []).map((c: any) => ({
    id: c._id || c.id,
    text: c.message || c.text,
    user: {
      id: c.user?._id || c.user?.id || '',
      name: c.user?.name || 'Anonymous',
      avatar: c.user?.avatar,
    },
    createdAt: c.createdAt,
  })),
  status: (p.status || 'unresolved').toLowerCase().replace(' ', '_') as IssueStatus,
  category: (p.category || 'other') as IssueCategory,
  adminResponse: p.adminResponse,
});

export function PostsProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  /* -------------------- FETCH POSTS -------------------- */
  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);

      let lat: number | undefined;
      let lng: number | undefined;

      if (navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((res, rej) =>
            navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
          );
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
        } catch {
          console.log('Geolocation not available, fetching all posts');
        }
      }

      const res = await postsApi.getNearby({ lat, lng, radius: 50000 });
      console.log('Posts API response:', res);

      if (res.success && res.data) {
        const postsArray = res.data.posts || res.data;
        if (Array.isArray(postsArray)) {
          setPosts(postsArray.map(normalizePost));
          console.log('Posts loaded:', postsArray.length);
        } else {
          console.warn('Unexpected posts data format:', res.data);
          setPosts([]);
        }
      } else {
        console.error('Failed to fetch posts:', res.error);
        setPosts([]);
      }
    } catch (e) {
      console.error('Fetch posts failed:', e);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  /* -------------------- ACTIONS -------------------- */

  const refreshPosts = async () => fetchPosts();

  const addNewPost = (post: Post) => {
    setPosts(prev => [post, ...prev]);
  };

  const addPost = async (post: Omit<Post, 'id' | 'createdAt'>) => {
    try {
      const res = await postsApi.create({
        title: post.caption.slice(0, 50),
        description: post.caption,
        category: post.category,
        address: post.location?.address || '',
        location: {
          type: 'Point',
          coordinates: [
            post.location?.coordinates?.lng || 0,
            post.location?.coordinates?.lat || 0,
          ],
        },
        imageBase64: post.imageUrl,
      });

      if (res.success && res.data) {
        const postData = (res.data as any).post || res.data;
        const normalized = normalizePost(postData);
        setPosts(prev => [normalized, ...prev]);
        return { success: true };
      }
      return { success: false, error: res.error };
    } catch {
      return { success: false, error: 'Post creation failed' };
    }
  };

  const updatePost = (id: string, updates: Partial<Post>) =>
    setPosts(p => p.map(post => (post.id === id ? { ...post, ...updates } : post)));

  const deletePost = async (id: string) => {
    const res = await postsApi.delete(id);
    if (res.success) {
      setPosts(p => p.filter(post => post.id !== id));
      return true;
    }
    return false;
  };

  const getUserPosts = (userId: string) =>
    posts.filter(post => post.user.id === userId);

  const searchPosts = (query: string) =>
    posts.filter(p =>
      [p.caption, p.location?.address, p.location?.city]
        .join(' ')
        .toLowerCase()
        .includes(query.toLowerCase())
    );

  const filterPosts = (filters: { status?: IssueStatus; category?: IssueCategory }) =>
    posts.filter(p => {
      if (filters.status && p.status !== filters.status) return false;
      if (filters.category && p.category !== filters.category) return false;
      return true;
    });

  const addComment = async (postId: string, comment: Omit<Comment, 'id' | 'createdAt'>) => {
    const res = await postsApi.addComment(postId, comment.text);
    if (!res.success) return false;

    setPosts(prev =>
      prev.map(p =>
        p.id === postId
          ? {
              ...p,
              comments: [
                ...(p.comments || []),
                { ...comment, id: Date.now().toString(), createdAt: new Date().toISOString() },
              ],
            }
          : p
      )
    );
    return true;
  };

  const updateUserInPosts = (userId: string, updates: { name?: string; avatar?: string }) =>
    setPosts(prev =>
      prev.map(p => ({
        ...p,
        user: p.user.id === userId ? { ...p.user, ...updates } : p.user,
        comments: p.comments?.map(c =>
          c.user.id === userId ? { ...c, user: { ...c.user, ...updates } } : c
        ),
      }))
    );

  const likePost = async (postId: string, userId: string): Promise<boolean> => {
    const res = await postsApi.like(postId);
    if (!res.success) return false;

    setPosts(prev =>
      prev.map(p =>
        p.id === postId && !p.likedBy.includes(userId)
          ? { ...p, likes: p.likes + 1, likedBy: [...p.likedBy, userId] }
          : p
      )
    );
    return true;
  };

  const unlikePost = async (postId: string, userId: string) => {
    const res = await postsApi.unlike(postId);
    if (!res.success) {
      console.error('[PostsContext] Unlike failed:', res.error);
      return false;
    }

    console.log('[PostsContext] Unlike successful, updating state for post:', postId);
    setPosts(prev =>
      prev.map(p =>
        p.id === postId
          ? { ...p, likes: Math.max(p.likes - 1, 0), likedBy: p.likedBy.filter(id => id !== userId) }
          : p
      )
    );
    return true;
  };

  const updatePostStatus = async (postId: string, status: IssueStatus, adminResponse?: string) => {
    const res = await postsApi.updateStatus(postId, status);
    if (!res.success) return false;

    setPosts(prev =>
      prev.map(p =>
        p.id === postId
          ? {
              ...p,
              status,
              adminResponse: adminResponse
                ? { message: adminResponse, respondedAt: new Date().toISOString(), adminName: 'City Admin' }
                : p.adminResponse,
            }
          : p
      )
    );
    return true;
  };

  return (
    <PostsContext.Provider
      value={{
        posts,
        loading,
        addPost,
        updatePost,
        deletePost,
        getUserPosts,
        searchPosts,
        filterPosts,
        addComment,
        updateUserInPosts,
        likePost,
        unlikePost,
        updatePostStatus,
        refreshPosts,
        addNewPost,
      }}
    >
      {children}
    </PostsContext.Provider>
  );
}

export function usePosts() {
  const ctx = useContext(PostsContext);
  if (!ctx) throw new Error('usePosts must be used within PostsProvider');
  return ctx;
}
