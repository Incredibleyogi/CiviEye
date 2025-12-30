import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Post, Comment, IssueStatus, IssueCategory } from '@/types';
import { postsApi } from '@/lib/api';
import { useAuth } from './AuthContext';

interface PostsContextType {
  posts: Post[];
  loading: boolean;
  addPost: (post: Omit<Post, 'id' | 'createdAt'>) => Promise<{ success: boolean; error?: string }>;
  updatePost: (id: string, updates: Partial<Post>) => void;
  deletePost: (id: string) => Promise<boolean>;
  getUserPosts: (userId: string) => Post[];
  searchPosts: (query: string) => Post[];
  filterPosts: (filters: { status?: IssueStatus; category?: IssueCategory; radius?: number }) => Post[];
  addComment: (postId: string, comment: Omit<Comment, 'id' | 'createdAt'>) => Promise<boolean>;
  updateUserInPosts: (userId: string, updates: { name?: string; avatar?: string }) => void;
  likePost: (postId: string, userId: string) => Promise<boolean>;
  unlikePost: (postId: string, userId: string) => void;
  updatePostStatus: (postId: string, status: IssueStatus, adminResponse?: string) => Promise<boolean>;
  refreshPosts: () => Promise<void>;
  addNewPost: (post: Post) => void;
}

const PostsContext = createContext<PostsContextType | undefined>(undefined);

export function PostsProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [myPosts, setMyPosts] = useState<Post[]>([]);  // Not used currently
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();

  const fetchPosts = async () => {
    try {
      setLoading(true);
      // Get user location for nearby posts
      let lat: number | undefined;
      let lng: number | undefined;
      
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
          });
          lat = position.coords.latitude;
          lng = position.coords.longitude;
        } catch {
          console.log('Location not available, fetching all posts');
        }
      }

      const response = await postsApi.getNearby({ lat, lng, radius: 50 });
      
      if (response.success && response.data) {
        const postsData = (response.data as { posts?: Post[] }).posts || response.data;
        if (Array.isArray(postsData)) {
          // Transform backend data to match frontend structure
          const transformedPosts = postsData.map((p: any) => ({
            id: p._id || p.id,
            // Backend returns 'image' as a string URL from Cloudinary
            imageUrl: p.image || p.imageUrl || '',
            caption: p.description || p.caption || '',
            createdAt: p.createdAt,
            location: {
              address: p.address,
              city: p.location?.city,
              village: p.location?.village,
              coordinates: p.location?.coordinates ? {
                lat: p.location.coordinates[1],
                lng: p.location.coordinates[0]
              } : undefined
            },
            user: {
              id: p.user?._id || p.user?.id || '',
              name: p.user?.name || 'Anonymous',
              avatar: p.user?.avatar
            },
            likes: p.likes?.length || 0,
            likedBy: (p.likes || []).map((l: any) => l.toString ? l.toString() : l),
            comments: (p.comments || []).map((c: any) => ({
              id: c._id || c.id,
              text: c.message || c.text,
              user: {
                id: c.user?._id || c.user?.id || '',
                name: c.user?.name || 'Anonymous',
                avatar: c.user?.avatar
              },
              createdAt: c.createdAt
            })),
            status: p.status || 'unresolved',
            category: p.category || 'other',
            adminResponse: p.adminResponse
          }));
          setPosts(transformedPosts);
        }
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchPosts();
    } else {
      setPosts([]);
      setLoading(false);
    }
  }, [isAuthenticated]);

  const refreshPosts = async () => {
    await fetchPosts();
  };

  const addNewPost = (post: Post) => {
    setPosts(prev => [post, ...prev]);
  };

  const addPost = async (post: Omit<Post, 'id' | 'createdAt'>): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await postsApi.create({
        title: post.caption.substring(0, 50),
        description: post.caption,
        category: post.category,
        address: post.location?.address || '',
        location: {
          type: 'Point',
          coordinates: [
            post.location?.coordinates?.lng || 0,
            post.location?.coordinates?.lat || 0
          ]
        },
        imageBase64: post.imageUrl
      });

      if (response.success && response.data) {
        // Backend may return { post: {...} } or the post directly
        const postData = (response.data as any).post || response.data;
        const newPost: Post = {
          id: postData._id || postData.id || Date.now().toString(),
          // Backend returns 'image' as a string URL from Cloudinary
          imageUrl: postData.image || post.imageUrl,
          caption: postData.description || post.caption,
          createdAt: postData.createdAt || new Date().toISOString(),
          location: {
            address: postData.address || post.location?.address,
            city: postData.location?.city || post.location?.city,
            coordinates: postData.location?.coordinates ? {
              lat: postData.location.coordinates[1],
              lng: postData.location.coordinates[0]
            } : post.location?.coordinates
          },
          user: {
            id: postData.user?._id || postData.user?.id || post.user.id,
            name: postData.user?.name || post.user.name,
            avatar: postData.user?.avatar || post.user.avatar
          },
          likes: postData.likesCount || 0,
          likedBy: postData.likedBy || [],
          comments: [],
          status: postData.status || 'unresolved',
          category: postData.category || post.category,
        };
        setPosts(prev => [newPost, ...prev]);
        return { success: true };
      }
      
      return { success: false, error: response.error };
    } catch (error) {
      console.error('Error creating post:', error);
      return { success: false, error: 'Failed to create post' };
    }
  };

  const updatePost = (id: string, updates: Partial<Post>) => {
    setPosts(prev =>
      prev.map(post => (post.id === id ? { ...post, ...updates } : post))
    );
  };

  const deletePost = async (id: string): Promise<boolean> => {
    try {
      const response = await postsApi.delete(id);
      if (response.success) {
        setPosts(prev => prev.filter(post => post.id !== id));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting post:', error);
      return false;
    }
  };

  const getUserPosts = (userId: string) => {
    return posts.filter(post => post.user.id === userId);
  };

  const searchPosts = (query: string) => {
    const lowerQuery = query.toLowerCase();
    return posts.filter(
      post =>
        post.location?.address?.toLowerCase().includes(lowerQuery) ||
        post.location?.city?.toLowerCase().includes(lowerQuery) ||
        post.location?.village?.toLowerCase().includes(lowerQuery) ||
        post.caption.toLowerCase().includes(lowerQuery)
    );
  };

  const filterPosts = (filters: { status?: IssueStatus; category?: IssueCategory; radius?: number }) => {
    return posts.filter(post => {
      if (filters.status && post.status !== filters.status) return false;
      if (filters.category && post.category !== filters.category) return false;
      return true;
    });
  };

  const addComment = async (postId: string, comment: Omit<Comment, 'id' | 'createdAt'>): Promise<boolean> => {
    try {
      const response = await postsApi.addComment(postId, comment.text);
      
      if (response.success) {
        const newComment: Comment = {
          ...comment,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
        };
        setPosts(prev =>
          prev.map(post =>
            post.id === postId
              ? { ...post, comments: [...(post.comments || []), newComment] }
              : post
          )
        );
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error adding comment:', error);
      return false;
    }
  };

  const updateUserInPosts = (userId: string, updates: { name?: string; avatar?: string }) => {
    setPosts(prev =>
      prev.map(post => {
        const updatedPost = post.user.id === userId
          ? { ...post, user: { ...post.user, ...updates } }
          : post;

        const updatedComments = (updatedPost.comments || []).map(comment =>
          comment.user.id === userId
            ? { ...comment, user: { ...comment.user, ...updates } }
            : comment
        );

        return { ...updatedPost, comments: updatedComments };
      })
    );
  };

  const likePost = async (postId: string, userId: string): Promise<boolean> => {
    try {
      const response = await postsApi.like(postId);
      
      if (response.success) {
        setPosts(prev =>
          prev.map(post => {
            if (post.id === postId && !post.likedBy?.includes(userId)) {
              return {
                ...post,
                likes: (post.likes || 0) + 1,
                likedBy: [...(post.likedBy || []), userId],
              };
            }
            return post;
          })
        );
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error liking post:', error);
      return false;
    }
  };

  const unlikePost = (postId: string, userId: string) => {
    setPosts(prev =>
      prev.map(post => {
        if (post.id === postId && post.likedBy?.includes(userId)) {
          return {
            ...post,
            likes: Math.max((post.likes || 0) - 1, 0),
            likedBy: post.likedBy?.filter(id => id !== userId) || [],
          };
        }
        return post;
      })
    );
  };

  const updatePostStatus = async (postId: string, status: IssueStatus, adminResponse?: string): Promise<boolean> => {
    try {
      const response = await postsApi.updateStatus(postId, status);
      
      if (response.success) {
        setPosts(prev =>
          prev.map(post => {
            if (post.id === postId) {
              return {
                ...post,
                status,
                adminResponse: adminResponse
                  ? {
                      message: adminResponse,
                      respondedAt: new Date().toISOString(),
                      adminName: 'City Admin',
                    }
                  : post.adminResponse,
              };
            }
            return post;
          })
        );
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating post status:', error);
      return false;
    }
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
  const context = useContext(PostsContext);
  if (context === undefined) {
    throw new Error('usePosts must be used within a PostsProvider');
  }
  return context;
}
