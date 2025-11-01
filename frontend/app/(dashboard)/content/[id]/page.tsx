"use client";

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { contentAPI } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { X, Maximize2, Send, Facebook, Instagram, Linkedin, Twitter, Image as ImageIcon, Video, Loader2, Play, ExternalLink } from 'lucide-react';
import type { Content } from '@/types';
import PublishDialog from '@/components/content/publish-dialog';

interface Video {
    id: number;
    url: string;
    video_url: string;
    width: number;
    height: number;
    duration: number;
    image: string;
    user: {
        name: string;
        url: string;
    };
}

interface VideoSearchResponse {
    success: boolean;
    query: string;
    total_results: number;
    videos: Video[];
}

export default function ContentDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const [content, setContent] = useState<Content | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [publishOpen, setPublishOpen] = useState(false);
    const [videos, setVideos] = useState<Video[]>([]);
    const [isLoadingVideos, setIsLoadingVideos] = useState(false);
    const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

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

    const fetchVideos = useCallback(async (prompt: string) => {
        try {
            setIsLoadingVideos(true);
            const token = localStorage.getItem('access_token');
            
            if (!token) {
                throw new Error('No access token found');
            }

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/content/search-videos`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        prompt: prompt,
                        per_page: 5
                    })
                }
            );

            if (!response.ok) {
                throw new Error('Failed to fetch videos');
            }

            const data: VideoSearchResponse = await response.json();
            
            if (data.success && data.videos.length > 0) {
                setVideos(data.videos);
            }
        } catch (error) {
            console.error('Error fetching videos:', error);
            toast({
                title: 'Video search failed',
                description: 'Could not fetch videos from Pexels',
                variant: 'destructive'
            });
        } finally {
            setIsLoadingVideos(false);
        }
    }, [toast]);

    useEffect(() => {
        const id = params?.id;
        if (!id) return;
        const idStr = Array.isArray(id) ? id[0] : id;
        fetchContent(idStr);
    }, [params, fetchContent]);

    useEffect(() => {
        if (content?.image_prompt) {
            fetchVideos(content.image_prompt);
        }
    }, [content?.image_prompt, fetchVideos]);

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
                    <Button
                        variant="outline"
                        onClick={() => router.push('/dashboard/content')}
                        className="hover:bg-gray-50 hover:border-gray-300"
                    >
                        Back to Library
                    </Button>
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

            {/* Videos Section */}
            <Card className="border border-slate-200/60 shadow-sm bg-white overflow-hidden">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Video className="h-5 w-5 text-purple-600" />
                                Suggested Videos from Pexels
                            </CardTitle>
                            <CardDescription>High-quality stock videos related to your content</CardDescription>
                        </div>
                        {isLoadingVideos && (
                            <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoadingVideos ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-center">
                                <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-3" />
                                <p className="text-sm text-slate-600">Searching for videos...</p>
                            </div>
                        </div>
                    ) : videos.length === 0 ? (
                        <div className="text-center py-12">
                            <Video className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-600">No videos found for this content</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {videos.map((video) => (
                                <div
                                    key={video.id}
                                    className="group relative rounded-lg overflow-hidden border border-slate-200 hover:border-purple-300 hover:shadow-lg transition-all duration-300 cursor-pointer"
                                    onClick={() => setSelectedVideo(video)}
                                >
                                    {/* Video Thumbnail */}
                                    <div className="relative aspect-video bg-slate-100">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={video.image}
                                            alt={`Video ${video.id}`}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                            <div className="bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg group-hover:scale-110 transition-transform">
                                                <Play className="h-6 w-6 text-purple-600" />
                                            </div>
                                        </div>
                                        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                            {Math.floor(video.duration)}s
                                        </div>
                                    </div>
                                    
                                    {/* Video Info */}
                                    <div className="p-3 bg-white">
                                        <p className="text-xs text-slate-600 flex items-center gap-1">
                                            <span>By {video.user.name}</span>
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {video.width} × {video.height}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

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

            {/* Video Player Modal */}
            <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
                <DialogContent className="max-w-7xl w-[95vw] h-[95vh] p-0 bg-black/95 border-0 overflow-hidden">
                    <div className="relative w-full h-full flex flex-col items-center justify-center p-6">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-4 right-4 z-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-full w-10 h-10"
                            onClick={() => setSelectedVideo(null)}
                        >
                            <X className="h-5 w-5" />
                        </Button>
                        
                        {selectedVideo && (
                            <>
                                <video
                                    src={selectedVideo.video_url}
                                    controls
                                    autoPlay
                                    className="max-w-full max-h-[80vh] rounded-lg shadow-2xl"
                                />
                                <div className="mt-4 flex items-center gap-4">
                                    <a
                                        href={selectedVideo.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-white/80 hover:text-white transition-colors text-sm"
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                        View on Pexels
                                    </a>
                                    <span className="text-white/60 text-sm">
                                        Video by {selectedVideo.user.name}
                                    </span>
                                </div>
                            </>
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