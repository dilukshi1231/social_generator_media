"use client";

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { contentAPI } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { X, Maximize2, Send, Facebook, Instagram, Linkedin, Twitter, Image as ImageIcon } from 'lucide-react';
import PublishDialog from '@/components/content/publish-dialog';
import type { Content } from '@/types';

export default function DashboardContentDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const [content, setContent] = useState<Content | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [publishOpen, setPublishOpen] = useState(false);

    const fetchContent = useCallback(async (id: string) => {
        try {
            setIsLoading(true);
            const res = await contentAPI.get(parseInt(id, 10));
            setContent(res.data);
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

    if (isLoading) return <div className="text-center py-16">Loading...</div>;
    if (!content) return <div className="text-center py-16">Not found</div>;

    const platformIcons = () => (
        <div className="flex items-center gap-2">
            {[{ icon: Facebook, active: !!content.facebook_caption, color: 'text-blue-600' },
            { icon: Instagram, active: !!content.instagram_caption, color: 'text-pink-600' },
            { icon: Linkedin, active: !!content.linkedin_caption, color: 'text-blue-700' },
            { icon: Twitter, active: !!content.twitter_caption, color: 'text-slate-900' }].map((p, idx) => (
                <div key={idx} className={`p-1.5 rounded-md ${p.active ? 'bg-white shadow-sm' : 'opacity-40'}`}>
                    <p.icon className={`h-4 w-4 ${p.active ? p.color : 'text-slate-500'}`} />
                </div>
            ))}
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                        {content.topic}
                        <Badge className="capitalize">{content.status.replace('_', ' ')}</Badge>
                    </h1>
                    <p className="text-gray-600 mt-1 flex items-center gap-3">
                        <span>Created {new Date(content.created_at).toLocaleDateString()}</span>
                        {platformIcons()}
                    </p>
                </div>
                <div className="flex gap-2">
                    {content.status === 'approved' && (
                        <Button onClick={() => setPublishOpen(true)}>
                            <Send className="h-4 w-4 mr-2" /> Publish
                        </Button>
                    )}
                    <Button variant="outline" onClick={() => router.push('/dashboard/content')}>Back to Library</Button>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Image Card */}
                <Card className="border border-slate-200/60 shadow-sm bg-white overflow-hidden">
                    <CardHeader className="pb-2">
                        <CardTitle>Generated Image</CardTitle>
                        <CardDescription>
                            {content.image_url ? 'Click to view full size' : 'No image available'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {content.image_url ? (
                            <div
                                className="relative w-full aspect-video rounded-lg overflow-hidden bg-slate-100 group cursor-pointer"
                                onClick={() => setIsImageModalOpen(true)}
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={content.image_url}
                                    alt={content.topic}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="absolute top-3 left-3">
                                    <Badge className="capitalize">{content.status.replace('_', ' ')}</Badge>
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="bg-white/90 backdrop-blur-sm p-3 rounded-full shadow">
                                        <Maximize2 className="h-6 w-6 text-slate-700" />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="w-full aspect-video bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center">
                                <div className="flex items-center gap-2 text-slate-500"><ImageIcon className="h-5 w-5" /> No image</div>
                            </div>
                        )}
                        {content.image_prompt && (
                            <div className="mt-4 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                                <p className="text-xs font-semibold text-indigo-900 mb-1">Image Prompt</p>
                                <p className="text-sm text-indigo-700">{content.image_prompt}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Captions Card */}
                <Card className="border border-slate-200/60 shadow-sm bg-white">
                    <CardHeader>
                        <CardTitle>Platform Captions</CardTitle>
                        <CardDescription>Copy-ready captions for each platform</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                            <p className="text-xs font-semibold text-blue-900 mb-2 flex items-center gap-2"><Facebook className="h-4 w-4" /> Facebook</p>
                            <p className="text-sm text-blue-700 whitespace-pre-wrap">{content.facebook_caption || 'No caption'}</p>
                        </div>
                        <div className="p-4 bg-pink-50 rounded-lg border border-pink-100">
                            <p className="text-xs font-semibold text-pink-900 mb-2 flex items-center gap-2"><Instagram className="h-4 w-4" /> Instagram</p>
                            <p className="text-sm text-pink-700 whitespace-pre-wrap">{content.instagram_caption || 'No caption'}</p>
                        </div>
                        <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                            <p className="text-xs font-semibold text-indigo-900 mb-2 flex items-center gap-2"><Linkedin className="h-4 w-4" /> LinkedIn</p>
                            <p className="text-sm text-indigo-700 whitespace-pre-wrap">{content.linkedin_caption || 'No caption'}</p>
                        </div>
                        <div className="p-4 bg-sky-50 rounded-lg border border-sky-100">
                            <p className="text-xs font-semibold text-sky-900 mb-2 flex items-center gap-2"><Twitter className="h-4 w-4" /> Twitter</p>
                            <p className="text-sm text-sky-700 whitespace-pre-wrap">{content.twitter_caption || 'No caption'}</p>
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
                            className="absolute top-4 right-4 z-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-full w-10 h-10"
                            onClick={() => setIsImageModalOpen(false)}
                        >
                            <X className="h-5 w-5" />
                        </Button>
                        {content.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={content.image_url}
                                alt={content.topic}
                                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                            />
                        ) : (
                            <div className="text-white/80">No image available</div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Publish Dialog */}
            {content.status === 'approved' && (
                <PublishDialog open={publishOpen} onOpenChange={setPublishOpen} content={content} />
            )}
        </div>
    );
}
