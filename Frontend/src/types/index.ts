export type UserRole = 'user' | 'admin';

export type IssueStatus = 'unresolved' | 'in_progress' | 'resolved';

export type IssueCategory = 'road' | 'water' | 'electricity' | 'sanitation' | 'other';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  role: UserRole;
}

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

export interface GeoLocation {
  lat: number;
  lng: number;
}

export interface Post {
  id: string;
  imageUrl: string;
  caption: string;
  createdAt: string;
  location?: {
    address?: string;
    city?: string;
    village?: string;
    coordinates?: GeoLocation;
  };
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  likes?: number;
  likedBy?: string[];
  comments?: Comment[];
  status: IssueStatus;
  category: IssueCategory;
  adminResponse?: {
    message: string;
    respondedAt: string;
    adminName: string;
  };
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export type NotificationType = 'like' | 'comment' | 'status_update' | 'admin_response' | 'nearby_post';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  postId?: string;
  fromUser?: {
    id: string;
    name: string;
    avatar?: string;
  };
  createdAt: string;
  read: boolean;
}

export interface DuplicateIssue {
  id: string;
  reason: 'image_similarity' | 'text_similarity' | 'location_proximity';
  similarity: number;
  post: Post;
}
