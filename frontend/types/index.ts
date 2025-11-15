// User types
export interface User {
  id: number;
  email: string;
  username: string;
  full_name?: string;
  user_type: 'individual' | 'business';
  business_name?: string;
  business_description?: string;
  industry?: string;
  website?: string;
  is_active: boolean;
  is_verified: boolean;
  is_premium: boolean;
  created_at: string;
  updated_at?: string;
  last_login?: string;
}

// Social Account types
export type PlatformType = 'facebook' | 'instagram' | 'linkedin' | 'twitter' | 'tiktok';

export interface SocialAccount {
  id: number;
  platform: PlatformType;
  username?: string;
  display_name?: string;
  platform_user_id?: string;
  is_active: boolean;
  is_connected: boolean;
  connected_at: string;
  last_posted_at?: string;
}

// Content types
export type ContentStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'published';

export interface Content {
  id: number;
  topic: string;
  facebook_caption?: string;
  instagram_caption?: string;
  linkedin_caption?: string;
  pinterest_caption?: string;
  twitter_caption?: string;
  threads_caption?: string;
  image_prompt?: string;
  image_caption?: string;
  image_url?: string;
  video_url?: string | null;
  audio_url?: string | null;
  status: ContentStatus;
  created_at: string;
  approved_at?: string;
}

// Post types
export type PostStatus = 'scheduled' | 'posting' | 'published' | 'failed';

export interface Post {
  id: number;
  content_id: number;
  platform: PlatformType;
  caption: string;
  status: PostStatus;
  platform_post_id?: string;
  platform_post_url?: string;
  scheduled_for?: string;
  posted_at?: string;
  error_message?: string;
  created_at: string;
}

// API Response types
export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface PlatformInfo {
  name: string;
  value: string;
  icon: string;
  color: string;
}

export interface PostStats {
  post_id: number;
  platform: PlatformType;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  impressions_count: number;
}