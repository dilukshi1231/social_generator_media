/**
 * API Response Types
 * Type definitions for API responses
 */

import { ContentStatus, PostStatus, UserType } from '@/lib/constants';

export interface ApiError {
    error: {
        type: string;
        message: string;
        details?: unknown;
        request_id?: string;
    };
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    page_size: number;
    pages: number;
}

export interface AuthTokens {
    access_token: string;
    refresh_token: string;
    token_type: string;
}

export interface User {
    id: number;
    email: string;
    username: string;
    full_name?: string;
    user_type: UserType;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface Content {
    id: number;
    user_id: number;
    topic: string;
    status: ContentStatus;
    facebook_caption?: string;
    instagram_caption?: string;
    linkedin_caption?: string;
    twitter_caption?: string;
    threads_caption?: string;
    pinterest_caption?: string;
    image_url?: string;
    image_prompt?: string;
    feedback?: string;
    created_at: string;
    updated_at: string;
    approved_at?: string;
}

export interface SocialAccount {
    id: number;
    user_id: number;
    platform: string;
    username?: string;
    display_name?: string;
    platform_user_id?: string;
    access_token: string;
    refresh_token?: string;
    token_expires_at?: string;
    is_active: boolean;
    platform_data?: Record<string, unknown>;
    created_at: string;
    updated_at: string;
    last_verified_at?: string;
}

export interface Post {
    id: number;
    user_id: number;
    content_id: number;
    social_account_id: number;
    platform: string;
    status: PostStatus;
    scheduled_for?: string;
    published_at?: string;
    platform_post_id?: string;
    platform_url?: string;
    caption: string;
    image_url?: string;
    error_message?: string;
    retry_count: number;
    analytics_data?: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}

export interface Platform {
    name: string;
    display_name: string;
    is_available: boolean;
    requires_oauth: boolean;
    max_caption_length: number;
    supports_images: boolean;
    supports_videos: boolean;
}
