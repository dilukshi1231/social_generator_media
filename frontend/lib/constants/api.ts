/**
 * API endpoints constants
 * Centralized location for all API endpoint paths
 */

export const API_ENDPOINTS = {
    // Authentication
    AUTH: {
        REGISTER: '/api/v1/auth/register',
        LOGIN: '/api/v1/auth/login',
        LOGOUT: '/api/v1/auth/logout',
        REFRESH: '/api/v1/auth/refresh',
        ME: '/api/v1/auth/me',
    },

    // Content
    CONTENT: {
        BASE: '/api/v1/content',
        GENERATE: '/api/v1/content/generate',
        CREATE: '/api/v1/content/create',
        BY_ID: (id: number) => `/api/v1/content/${id}`,
        APPROVE: (id: number) => `/api/v1/content/${id}/approve`,
        REGENERATE_CAPTIONS: (id: number) => `/api/v1/content/${id}/regenerate-captions`,
        REGENERATE_IMAGE: (id: number) => `/api/v1/content/${id}/regenerate-image`,
    },

    // Social Accounts
    SOCIAL_ACCOUNTS: {
        BASE: '/api/v1/social-accounts',
        BY_ID: (id: number) => `/api/v1/social-accounts/${id}`,
        VERIFY: (id: number) => `/api/v1/social-accounts/${id}/verify`,
        PLATFORMS: '/api/v1/social-accounts/platforms/available',
    },

    // OAuth
    OAUTH: {
        AUTHORIZE: (platform: string) => `/api/v1/oauth/${platform}/authorize`,
        CALLBACK: (platform: string) => `/api/v1/oauth/${platform}/callback`,
    },

    // Posts
    POSTS: {
        BASE: '/api/v1/posts',
        BY_ID: (id: number) => `/api/v1/posts/${id}`,
        RETRY: (id: number) => `/api/v1/posts/${id}/retry`,
        STATS: (id: number) => `/api/v1/posts/${id}/stats`,
    },

    // Health
    HEALTH: '/health',
} as const;
