/**
 * Status constants
 * Enums and mappings for various status types
 */

export enum ContentStatus {
    DRAFT = 'draft',
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    ARCHIVED = 'archived',
}

export enum PostStatus {
    SCHEDULED = 'scheduled',
    PUBLISHING = 'publishing',
    PUBLISHED = 'published',
    FAILED = 'failed',
    CANCELLED = 'cancelled',
}

export enum UserType {
    INDIVIDUAL = 'individual',
    BUSINESS = 'business',
    AGENCY = 'agency',
    ENTERPRISE = 'enterprise',
}

// Status display names
export const CONTENT_STATUS_NAMES: Record<ContentStatus, string> = {
    [ContentStatus.DRAFT]: 'Draft',
    [ContentStatus.PENDING]: 'Pending Review',
    [ContentStatus.APPROVED]: 'Approved',
    [ContentStatus.REJECTED]: 'Rejected',
    [ContentStatus.ARCHIVED]: 'Archived',
};

export const POST_STATUS_NAMES: Record<PostStatus, string> = {
    [PostStatus.SCHEDULED]: 'Scheduled',
    [PostStatus.PUBLISHING]: 'Publishing',
    [PostStatus.PUBLISHED]: 'Published',
    [PostStatus.FAILED]: 'Failed',
    [PostStatus.CANCELLED]: 'Cancelled',
};

// Status colors (Tailwind CSS classes)
export const CONTENT_STATUS_COLORS: Record<ContentStatus, string> = {
    [ContentStatus.DRAFT]: 'bg-gray-100 text-gray-800',
    [ContentStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
    [ContentStatus.APPROVED]: 'bg-green-100 text-green-800',
    [ContentStatus.REJECTED]: 'bg-red-100 text-red-800',
    [ContentStatus.ARCHIVED]: 'bg-gray-100 text-gray-600',
};

export const POST_STATUS_COLORS: Record<PostStatus, string> = {
    [PostStatus.SCHEDULED]: 'bg-blue-100 text-blue-800',
    [PostStatus.PUBLISHING]: 'bg-purple-100 text-purple-800',
    [PostStatus.PUBLISHED]: 'bg-green-100 text-green-800',
    [PostStatus.FAILED]: 'bg-red-100 text-red-800',
    [PostStatus.CANCELLED]: 'bg-gray-100 text-gray-600',
};
