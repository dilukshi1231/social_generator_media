/**
 * Form Types
 * Type definitions for form inputs and validation
 */

export interface LoginFormData {
    username: string;
    password: string;
}

export interface RegisterFormData {
    email: string;
    username: string;
    password: string;
    confirmPassword: string;
    full_name?: string;
    user_type?: string;
}

export interface ContentGenerateFormData {
    topic: string;
    auto_approve?: boolean;
}

export interface ContentCreateFormData {
    topic: string;
    facebook_caption?: string;
    instagram_caption?: string;
    linkedin_caption?: string;
    twitter_caption?: string;
    threads_caption?: string;
    pinterest_caption?: string;
    image_prompt?: string;
    image_url?: string;
    auto_approve?: boolean;
}

export interface PostCreateFormData {
    content_id: number;
    platforms: string[];
    scheduled_for?: string;
}

export interface ApprovalFormData {
    approved: boolean;
    feedback?: string;
}

export interface SettingsFormData {
    full_name?: string;
    email?: string;
    current_password?: string;
    new_password?: string;
    confirm_password?: string;
}
