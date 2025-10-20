"use client";

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { contentAPI } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X, Maximize2 } from 'lucide-react';
import type { Content } from '@/types';

export default function ContentDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const [content, setContent] = useState<Content | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);

    const fetchContent = useCallback(async (id: string) => {
        try {
            setIsLoading(true);

            const res = await contentAPI.get(parseInt(id, 10));
            setContent(res.data as Content);
        } catch {
            toast({ title: 'Error', description: 'Failed to load content', variant: 'destructive' });
            router.push('/dashboard/content');
        } finally {
            setIsLoading(false);
        }
    }, [router, toast]);

    useEffect(() => {
        const id = params?.id;
        if (!id) return;
        const idStr = Array.isArray(id) ? id[0] : id;
        fetchContent(idStr);
    }, [params, fetchContent]);

    if (isLoading) {
        return (
            <div className="text-center py-20">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg mb-4 animate-pulse">
                    <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
                </div>
                <p className="text-slate-600 font-medium">Loading content...</p>
            </div>
        );
    }

    if (!content) {
        return (
            <div className="text-center py-20">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 mb-6">
                    <span className="text-4xl">📄</span>
                </div>
                <p className="text-xl font-semibold text-slate-700 mb-2">Content not found</p>
                <p className="text-slate-500 mb-6">The content you&apos;re looking for doesn&apos;t exist</p>
                <Button onClick={() => router.push('/dashboard/content')}>Back to Library</Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{content.topic}</h1>
                    <p className="text-gray-600 mt-1">Created on {new Date(content.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => router.push('/dashboard/content')}
                        className="hover:bg-gray-50 hover:border-gray-300 hover:shadow-md transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-0.5"
                    >
                        Back to Library
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Image Card */}
                {content.image_url && (
                    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-2">
                        <CardHeader>
                            <CardTitle>Generated Image</CardTitle>
                            <CardDescription>Click to view full size</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div
                                className="relative w-full aspect-video rounded-lg overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 shadow-md group cursor-pointer"
                                onClick={() => setIsImageModalOpen(true)}
                            >
                                <img
                                    src={content.image_url}
                                    alt={content.topic}
                                    className="w-full h-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] flex items-center justify-center">
                                    <div className="bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)]">
                                        <Maximize2 className="h-6 w-6 text-slate-700" />
                                    </div>
                                </div>
                            </div>
                            {content.image_prompt && (
                                <div className="mt-4 p-3 bg-indigo-50 rounded-lg border border-indigo-100 hover:bg-indigo-100 hover:border-indigo-200 transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)]">
                                    <p className="text-xs font-semibold text-indigo-900 mb-1">Image Prompt</p>
                                    <p className="text-sm text-indigo-700">{content.image_prompt}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Content Details Card */}
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-2">
                    <CardHeader>
                        <CardTitle>Content Details</CardTitle>
                        <CardDescription>Status: <span className="font-semibold capitalize">{content.status.replace('_', ' ')}</span></CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 hover:bg-blue-100 hover:border-blue-200 hover:shadow-md transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-0.5 cursor-pointer">
                            <p className="text-xs font-semibold text-blue-900 mb-2">Facebook</p>
                            <p className="text-sm text-blue-700">{content.facebook_caption}</p>
                        </div>
                        <div className="p-4 bg-pink-50 rounded-lg border border-pink-100 hover:bg-pink-100 hover:border-pink-200 hover:shadow-md transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-0.5 cursor-pointer">
                            <p className="text-xs font-semibold text-pink-900 mb-2">Instagram</p>
                            <p className="text-sm text-pink-700">{content.instagram_caption}</p>
                        </div>
                        <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100 hover:bg-indigo-100 hover:border-indigo-200 hover:shadow-md transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-0.5 cursor-pointer">
                            <p className="text-xs font-semibold text-indigo-900 mb-2">LinkedIn</p>
                            <p className="text-sm text-indigo-700">{content.linkedin_caption}</p>
                        </div>
                        <div className="p-4 bg-sky-50 rounded-lg border border-sky-100 hover:bg-sky-100 hover:border-sky-200 hover:shadow-md transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-0.5 cursor-pointer">
                            <p className="text-xs font-semibold text-sky-900 mb-2">Twitter</p>
                            <p className="text-sm text-sky-700">{content.twitter_caption}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Full Screen Image Modal */}
            <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
                <DialogContent className="max-w-7xl w-[95vw] h-[95vh] p-0 bg-black/95 border-0 overflow-hidden">
                    <div className="relative w-full h-full flex items-center justify-center p-6">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-4 right-4 z-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-full w-10 h-10 transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:scale-110 hover:rotate-90"
                            onClick={() => setIsImageModalOpen(false)}
                        >
                            <X className="h-5 w-5" />
                        </Button>
                        <img
                            src={content.image_url}
                            alt={content.topic}
                            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in fade-in zoom-in-95 duration-500"
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
