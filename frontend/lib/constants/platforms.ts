/**
 * Platform constants
 * Configuration for supported social media platforms
 */

export enum Platform {
    FACEBOOK = 'facebook',
    INSTAGRAM = 'instagram',
    LINKEDIN = 'linkedin',
    TWITTER = 'twitter',
    THREADS = 'threads',
    TIKTOK = 'tiktok',
    PINTEREST = 'pinterest',
}

export const PLATFORM_NAMES: Record<Platform, string> = {
    [Platform.FACEBOOK]: 'Facebook',
    [Platform.INSTAGRAM]: 'Instagram',
    [Platform.LINKEDIN]: 'LinkedIn',
    [Platform.TWITTER]: 'Twitter / X',
    [Platform.THREADS]: 'Threads',
    [Platform.TIKTOK]: 'TikTok',
    [Platform.PINTEREST]: 'Pinterest',
};

export const PLATFORM_COLORS: Record<Platform, string> = {
    [Platform.FACEBOOK]: '#1877F2',
    [Platform.INSTAGRAM]: '#E4405F',
    [Platform.LINKEDIN]: '#0A66C2',
    [Platform.TWITTER]: '#1DA1F2',
    [Platform.THREADS]: '#000000',
    [Platform.TIKTOK]: '#000000',
    [Platform.PINTEREST]: '#E60023',
};

export const PLATFORM_LIMITS = {
    [Platform.FACEBOOK]: {
        maxCaptionLength: 63206,
        maxHashtags: 30,
        supportsImage: true,
        supportsVideo: true,
        supportsCarousel: true,
    },
    [Platform.INSTAGRAM]: {
        maxCaptionLength: 2200,
        maxHashtags: 30,
        supportsImage: true,
        supportsVideo: true,
        supportsCarousel: true,
    },
    [Platform.LINKEDIN]: {
        maxCaptionLength: 3000,
        maxHashtags: 10,
        supportsImage: true,
        supportsVideo: true,
        supportsCarousel: true,
    },
    [Platform.TWITTER]: {
        maxCaptionLength: 280,
        maxHashtags: 10,
        supportsImage: true,
        supportsVideo: true,
        supportsCarousel: false,
    },
    [Platform.THREADS]: {
        maxCaptionLength: 500,
        maxHashtags: 10,
        supportsImage: true,
        supportsVideo: true,
        supportsCarousel: false,
    },
    [Platform.TIKTOK]: {
        maxCaptionLength: 2200,
        maxHashtags: 30,
        supportsImage: true,
        supportsVideo: true,
        supportsCarousel: false,
    },
    [Platform.PINTEREST]: {
        maxCaptionLength: 500,
        maxHashtags: 20,
        supportsImage: true,
        supportsVideo: true,
        supportsCarousel: false,
    },
} as const;
