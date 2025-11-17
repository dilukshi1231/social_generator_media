/**
 * Validation utility functions
 */

import { FILE_UPLOAD } from '@/lib/constants';

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate password strength
 */
export function isStrongPassword(password: string): {
    isValid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
        errors.push('Password must contain at least one number');
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

/**
 * Validate image file
 */
export function isValidImage(file: File): {
    isValid: boolean;
    error?: string;
} {
    // Check file type
    if (!(FILE_UPLOAD.ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
        return {
            isValid: false,
            error: `Invalid file type. Allowed: ${FILE_UPLOAD.IMAGE_EXTENSIONS.join(', ')}`,
        };
    }

    // Check file size
    const maxSizeBytes = FILE_UPLOAD.MAX_IMAGE_SIZE_MB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
        return {
            isValid: false,
            error: `File too large. Max size: ${FILE_UPLOAD.MAX_IMAGE_SIZE_MB}MB`,
        };
    }

    return { isValid: true };
}

/**
 * Validate video file
 */
export function isValidVideo(file: File): {
    isValid: boolean;
    error?: string;
} {
    // Check file type
    if (!(FILE_UPLOAD.ALLOWED_VIDEO_TYPES as readonly string[]).includes(file.type)) {
        return {
            isValid: false,
            error: `Invalid file type. Allowed: ${FILE_UPLOAD.VIDEO_EXTENSIONS.join(', ')}`,
        };
    }

    // Check file size
    const maxSizeBytes = FILE_UPLOAD.MAX_VIDEO_SIZE_MB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
        return {
            isValid: false,
            error: `File too large. Max size: ${FILE_UPLOAD.MAX_VIDEO_SIZE_MB}MB`,
        };
    }

    return { isValid: true };
}

/**
 * Validate caption length for platform
 */
export function isValidCaptionLength(
    caption: string,
    platform: string,
    maxLength: number
): {
    isValid: boolean;
    remaining: number;
} {
    const remaining = maxLength - caption.length;
    return {
        isValid: remaining >= 0,
        remaining,
    };
}
