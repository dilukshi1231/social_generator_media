/**
 * Application constants
 * General configuration and constants
 */

// Pagination
export const PAGINATION = {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
    PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
} as const;

// File uploads
export const FILE_UPLOAD = {
    MAX_IMAGE_SIZE_MB: 10,
    MAX_VIDEO_SIZE_MB: 100,
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/quicktime', 'video/x-msvideo'],
    IMAGE_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    VIDEO_EXTENSIONS: ['.mp4', '.mov', '.avi'],
} as const;

// Local storage keys
export const STORAGE_KEYS = {
    ACCESS_TOKEN: 'access_token',
    REFRESH_TOKEN: 'refresh_token',
    USER_DATA: 'user_data',
    THEME: 'theme',
    SIDEBAR_COLLAPSED: 'sidebar_collapsed',
} as const;

// Session
export const SESSION = {
    TIMEOUT_MS: 30 * 60 * 1000, // 30 minutes
    WARNING_BEFORE_MS: 5 * 60 * 1000, // Warn 5 minutes before timeout
} as const;

// Debounce/Throttle delays (in milliseconds)
export const DELAYS = {
    SEARCH_DEBOUNCE: 300,
    AUTO_SAVE: 1000,
    TOAST_DURATION: 3000,
    ANIMATION: 400,
} as const;

// Date/Time formats
export const DATE_FORMATS = {
    DISPLAY_DATE: 'MMM dd, yyyy',
    DISPLAY_DATETIME: 'MMM dd, yyyy HH:mm',
    DISPLAY_TIME: 'HH:mm',
    API_DATE: 'yyyy-MM-dd',
    API_DATETIME: "yyyy-MM-dd'T'HH:mm:ss",
} as const;

// Error messages
export const ERROR_MESSAGES = {
    NETWORK_ERROR: 'Network error. Please check your connection.',
    UNAUTHORIZED: 'You need to log in to access this resource.',
    FORBIDDEN: 'You do not have permission to access this resource.',
    NOT_FOUND: 'The requested resource was not found.',
    SERVER_ERROR: 'An unexpected error occurred. Please try again later.',
    VALIDATION_ERROR: 'Please check your input and try again.',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
    LOGIN: 'Successfully logged in!',
    LOGOUT: 'Successfully logged out!',
    REGISTER: 'Account created successfully!',
    CONTENT_GENERATED: 'Content generated successfully!',
    CONTENT_APPROVED: 'Content approved!',
    POST_CREATED: 'Post created successfully!',
    ACCOUNT_CONNECTED: 'Account connected successfully!',
    ACCOUNT_DISCONNECTED: 'Account disconnected!',
} as const;

// Routes
export const ROUTES = {
    HOME: '/',
    LOGIN: '/login',
    REGISTER: '/register',
    DASHBOARD: '/dashboard',
    CONTENT: '/content',
    CONTENT_CREATE: '/content/create',
    CONTENT_APPROVED: '/content/approved',
    POSTS: '/posts',
    ANALYTICS: '/analytics',
    SETTINGS: '/settings',
    SOCIAL_ACCOUNTS: '/dashboard/social-accounts',
} as const;

export * from './api';
export * from './platforms';
export * from './status';
