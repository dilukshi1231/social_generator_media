/**
 * Custom hook for content operations
 * Manages content generation, approval, and CRUD operations
 */

'use client';

import { useState } from 'react';
import { contentAPI } from '@/lib/api';
import { Content } from '@/types';
import { toast } from 'sonner';

export function useContent() {
    const [isGenerating, setIsGenerating] = useState(false);
    const [isRegenerating, setIsRegenerating] = useState(false);

    const generateContent = async (topic: string, autoApprove = false) => {
        setIsGenerating(true);
        try {
            const response = await contentAPI.generate({ topic, auto_approve: autoApprove });
            toast.success('Content generated successfully!');
            return response.data as Content;
        } catch (error: unknown) {
            const err = error as { response?: { data?: { error?: { message?: string } } } };
            const message = err.response?.data?.error?.message || 'Failed to generate content';
            toast.error(message);
            throw error;
        } finally {
            setIsGenerating(false);
        }
    };

    const createContent = async (data: {
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
    }) => {
        try {
            const response = await contentAPI.create(data);
            toast.success('Content created successfully!');
            return response.data as Content;
        } catch (error: unknown) {
            const err = error as { response?: { data?: { error?: { message?: string } } } };
            const message = err.response?.data?.error?.message || 'Failed to create content';
            toast.error(message);
            throw error;
        }
    };

    const approveContent = async (id: number, approved: boolean, feedback?: string) => {
        try {
            const response = await contentAPI.approve(id, { approved, feedback });
            toast.success(approved ? 'Content approved!' : 'Content rejected');
            return response.data as Content;
        } catch (error: unknown) {
            const err = error as { response?: { data?: { error?: { message?: string } } } };
            const message = err.response?.data?.error?.message || 'Failed to update content';
            toast.error(message);
            throw error;
        }
    };

    const regenerateCaptions = async (id: number) => {
        setIsRegenerating(true);
        try {
            const response = await contentAPI.regenerateCaptions(id);
            toast.success('Captions regenerated successfully!');
            return response.data as Content;
        } catch (error: unknown) {
            const err = error as { response?: { data?: { error?: { message?: string } } } };
            const message = err.response?.data?.error?.message || 'Failed to regenerate captions';
            toast.error(message);
            throw error;
        } finally {
            setIsRegenerating(false);
        }
    };

    const regenerateImage = async (id: number) => {
        setIsRegenerating(true);
        try {
            const response = await contentAPI.regenerateImage(id);
            toast.success('Image regenerated successfully!');
            return response.data as Content;
        } catch (error: unknown) {
            const err = error as { response?: { data?: { error?: { message?: string } } } };
            const message = err.response?.data?.error?.message || 'Failed to regenerate image';
            toast.error(message);
            throw error;
        } finally {
            setIsRegenerating(false);
        }
    };

    const deleteContent = async (id: number) => {
        try {
            await contentAPI.delete(id);
            toast.success('Content deleted successfully!');
        } catch (error: unknown) {
            const err = error as { response?: { data?: { error?: { message?: string } } } };
            const message = err.response?.data?.error?.message || 'Failed to delete content';
            toast.error(message);
            throw error;
        }
    };

    return {
        isGenerating,
        isRegenerating,
        generateContent,
        createContent,
        approveContent,
        regenerateCaptions,
        regenerateImage,
        deleteContent,
    };
}
