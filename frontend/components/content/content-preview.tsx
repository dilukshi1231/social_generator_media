'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Check, X, RefreshCw, Facebook, Instagram, Linkedin, Twitter, Image as ImageIcon, Copy, Sparkles, Send, Video, ExternalLink, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import type { Content } from '@/types';
import Image from 'next/image';
import PublishDialog from '@/components/content/publish-dialog';

// X (Twitter) Icon Component
const XIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

interface ContentPreviewProps {
  content: Content;
  onApprove?: () => Promise<boolean | void> | boolean | void;
  onReject: () => void;
  onRegenerateCaptions: () => void;
  onRegenerateImage: () => void;
  isLoading?: boolean;
}

interface VideoResult {
  id: number;
  url: string;
  video_url: string;
  image: string;
  width: number;
  height: number;
  duration: number;
  user: {
    name: string;
    url: string;
  };
}

export default function ContentPreview({
  content,
  onApprove,
  onReject,
  onRegenerateCaptions,
  onRegenerateImage,
  isLoading = false,
}: ContentPreviewProps) {
  const { toast } = useToast();
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [videos, setVideos] = useState<VideoResult[]>([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);

  // Memoized fetchVideos function to prevent infinite loops
  const fetchVideos = useCallback(async (searchQuery: string) => {
    console.log('[fetchVideos] Starting video search for:', searchQuery);
    setIsLoadingVideos(true);
    setVideoError(null);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('access_token');

      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('[fetchVideos] Calling API:', `${API_URL}/api/v1/content/search-videos`);

      const response = await fetch(`${API_URL}/api/v1/content/search-videos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt: searchQuery,
          per_page: 5,
        }),
      });

      console.log('[fetchVideos] Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[fetchVideos] API error:', errorText);
        throw new Error(`Failed to fetch videos: ${response.status}`);
      }

      const data = await response.json();
      console.log('[fetchVideos] Response data:', data);

      if (data.success && data.videos) {
        console.log('[fetchVideos] Videos found:', data.videos.length);
        setVideos(data.videos);
        
        if (data.videos.length === 0) {
          setVideoError('No videos found for this topic. Try a different search term.');
        }
      } else {
        console.error('[fetchVideos] API returned unsuccessful response:', data);
        throw new Error(data.error || 'Failed to fetch videos');
      }
    } catch (error) {
      console.error('[fetchVideos] Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch videos';
      setVideoError(errorMessage);
      toast({
        title: 'Video search failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoadingVideos(false);
    }
  }, [toast]);

  // Fetch videos when content topic is available
  useEffect(() => {
    // Use image_prompt if available (more specific), otherwise use topic
    const searchQuery = content?.image_prompt || content?.topic;
    
    if (searchQuery) {
      console.log('[useEffect] Triggering video search with query:', searchQuery);
      fetchVideos(searchQuery);
    } else {
      console.log('[useEffect] No search query available');
    }
  }, [content?.topic, content?.image_prompt, fetchVideos]);

  const handleApproveAndPublish = async () => {
    if (onApprove) {
      const result = await onApprove();
      if (result === false) {
        return;
      }
    }
    setPublishDialogOpen(true);
  };

  const platforms = [
    {
      name: 'Facebook',
      icon: Facebook,
      caption: content.facebook_caption,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
    {
      name: 'Instagram',
      icon: Instagram,
      caption: content.instagram_caption,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      borderColor: 'border-pink-200',
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      caption: content.linkedin_caption,
      color: 'text-blue-700',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-300',
    },
    {
      name: 'Twitter',
      icon: XIcon,
      caption: content.twitter_caption,
      color: 'text-slate-900',
      bgColor: 'bg-slate-50',
      borderColor: 'border-slate-200',
    },
    {
      name: 'TikTok',
      icon: Twitter,
      caption: content.threads_caption,
      color: 'text-gray-900',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
    },
  ];

  const copyToClipboard = (text: string, platform: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: `${platform} caption copied to clipboard`,
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Success Header */}
      <Card className="border-0 shadow-2xl bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg">
                  <Check className="h-7 w-7 text-white" />
                </div>
                <div>
                  <CardTitle className="text-3xl font-bold bg-gradient-to-r from-green-700 to-emerald-700 bg-clip-text text-transparent">
                    Content Generated Successfully! 🎉
                  </CardTitle>
                  <p className="text-base text-slate-600 mt-1">
                    Your AI-powered content is ready for review
                  </p>
                </div>
              </div>
            </div>
            <Badge
              variant={content.status === 'approved' ? 'default' : 'secondary'}
              className="px-5 py-2.5 text-base font-semibold shadow-md"
            >
              {content.status.replace('_', ' ')}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Image Preview */}
      <Card className="border-0 shadow-2xl bg-white/80">
        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-b-2 border-slate-100">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-3 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl shadow-lg">
              <ImageIcon className="h-6 w-6 text-white" />
            </div>
            <span className="bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent font-bold">
              Generated Image
            </span>
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={onRegenerateImage}
            disabled={isLoading}
            className="hover:bg-white hover:border-indigo-300"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Regenerate
          </Button>
        </CardHeader>
        <CardContent className="p-6">
          {content.image_url ? (
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 shadow-2xl">
              <Image
                src={content.image_url}
                alt="Generated content"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          ) : (
            <div className="w-full aspect-video rounded-2xl bg-gradient-to-br from-slate-100 to-slate-300 flex items-center justify-center">
              <div className="text-center">
                <ImageIcon className="h-12 w-12 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-500 font-medium">No image generated</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Video Suggestions */}
      <Card className="border-0 shadow-2xl bg-white/80">
        <CardHeader className="bg-gradient-to-r from-purple-50 via-pink-50 to-purple-50 border-b-2 border-slate-100">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-3 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl shadow-lg">
              <Video className="h-6 w-6 text-white" />
            </div>
            <span className="bg-gradient-to-r from-purple-700 to-pink-700 bg-clip-text text-transparent font-bold">
              Suggested Videos from Pexels
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {isLoadingVideos ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              <span className="ml-3 text-slate-600">Searching for videos...</span>
            </div>
          ) : videoError ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                <X className="h-8 w-8 text-red-600" />
              </div>
              <p className="text-red-600 font-medium mb-2">Video Search Failed</p>
              <p className="text-sm text-slate-600 mb-4">{videoError}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchVideos(content.image_prompt || content.topic)}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          ) : videos.length === 0 ? (
            <div className="text-center py-12">
              <Video className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 font-medium mb-2">No videos found</p>
              <p className="text-sm text-slate-500">Try a different search term</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {videos.map((video) => (
                <div
                  key={video.id}
                  className="group relative rounded-xl overflow-hidden border-2 border-slate-200 hover:border-purple-300 transition-all hover:shadow-lg"
                >
                  <div className="relative aspect-video bg-slate-100">
                    <Image
                      src={video.image}
                      alt="Video preview"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Video className="h-12 w-12 text-white" />
                    </div>
                  </div>
                  <div className="p-3 bg-white">
                    <p className="text-xs text-slate-600 mb-2">
                      Duration: {Math.floor(video.duration)}s | {video.width}x{video.height}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-500">by {video.user.name}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(video.video_url, '_blank')}
                        className="h-8 px-2"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Captions Preview */}
      <Card className="border-0 shadow-2xl bg-white/80">
        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 border-b-2 border-slate-100">
          <CardTitle className="text-xl font-bold flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
              Platform Captions
            </span>
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={onRegenerateCaptions}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Regenerate All
          </Button>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs defaultValue="facebook" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              {platforms.map((platform) => (
                <TabsTrigger key={platform.name} value={platform.name.toLowerCase()}>
                  <platform.icon className={`h-4 w-4 mr-1.5 ${platform.color}`} />
                  <span className="hidden sm:inline">{platform.name}</span>
                </TabsTrigger>
              ))}
            </TabsList>
            {platforms.map((platform) => (
              <TabsContent key={platform.name} value={platform.name.toLowerCase()} className="space-y-4 mt-6">
                <div className={`p-8 ${platform.bgColor} rounded-2xl border-2 ${platform.borderColor}`}>
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white rounded-xl shadow-md">
                        <platform.icon className={`h-7 w-7 ${platform.color}`} />
                      </div>
                      <span className="font-bold text-xl text-slate-900">{platform.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(platform.caption || '', platform.name)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                  <div className="p-5 bg-white/60 rounded-xl">
                    <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">
                      {platform.caption || 'No caption generated'}
                    </p>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {content.status === 'pending_approval' && (
        <Card className="border-0 shadow-2xl">
          <CardContent className="pt-8 pb-8">
            <div className="flex flex-col sm:flex-row gap-5">
              <Button
                onClick={handleApproveAndPublish}
                size="lg"
                className="flex-1 h-20 text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600"
                disabled={isLoading}
              >
                <Check className="mr-3 h-7 w-7" />
                Approve & Save Content
              </Button>
              <Button
                onClick={onReject}
                size="lg"
                variant="outline"
                className="flex-1 h-20 text-xl font-bold"
                disabled={isLoading}
              >
                <X className="mr-3 h-7 w-7" />
                Reject & Regenerate
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Publish Dialog */}
      <PublishDialog
        open={publishDialogOpen}
        onOpenChange={setPublishDialogOpen}
        content={content}
      />
    </div>
  );
}