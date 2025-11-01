'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Check, X, RefreshCw, Facebook, Instagram, Linkedin, Twitter, Image as ImageIcon, Copy, Sparkles, Send, Clock, Video, ExternalLink } from 'lucide-react';
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

// Pexels Video Interface
interface PexelsVideo {
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

interface ContentPreviewProps {
  content: Content;
  onApprove?: () => Promise<boolean | void> | boolean | void;
  onReject: () => void;
  onRegenerateCaptions: () => void;
  onRegenerateImage: () => void;
  isLoading?: boolean;
  videos?: PexelsVideo[];
  selectedVideo?: PexelsVideo | null;
  onVideoSelect?: (video: PexelsVideo) => void;
}

export default function ContentPreview({
  content,
  onApprove,
  onReject,
  onRegenerateCaptions,
  onRegenerateImage,
  isLoading = false,
  videos = [],
  selectedVideo = null,
  onVideoSelect,
}: ContentPreviewProps) {
  const { toast } = useToast();
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);

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
      {/* Success Header with Celebration */}
      <Card className="border-0 shadow-2xl bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 backdrop-blur-sm hover:shadow-3xl transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-1 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-green-400/10 to-emerald-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <CardHeader className="relative">
          <div className="flex items-center justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg animate-bounce">
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
              <div className="flex items-center gap-2 p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200 shadow-sm">
                <Sparkles className="h-5 w-5 text-indigo-600 flex-shrink-0" />
                <p className="text-base text-slate-700">
                  <span className="font-bold text-slate-900">Topic:</span> {content.topic}
                </p>
              </div>
            </div>
            <Badge
              variant={content.status === 'approved' ? 'default' : 'secondary'}
              className={`px-5 py-2.5 text-base font-semibold shadow-md transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:scale-105 ${content.status === 'approved'
                ? 'bg-gradient-to-r from-green-600 to-emerald-600'
                : 'bg-gradient-to-r from-amber-500 to-orange-500'
                }`}
            >
              {content.status.replace('_', ' ')}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      

      {/* Related Videos Section - NEW */}
      {videos && videos.length > 0 && (
        
        <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm overflow-hidden hover:shadow-3xl transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-1 group">
          <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-purple-50 via-pink-50 to-red-50 border-b-2 border-slate-100">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-3 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl shadow-lg transition-transform duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-110 group-hover:rotate-3">
                <Video className="h-6 w-6 text-white" />
              </div>
              <span className="bg-gradient-to-r from-purple-700 to-pink-700 bg-clip-text text-transparent font-bold">
                Related Videos from Pexels
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {/* Main Video Player */}
            {selectedVideo && (
              <div className="mb-6">
                <div className="relative rounded-xl overflow-hidden shadow-2xl bg-black">
                  <video
                    key={selectedVideo.id}
                    controls
                    className="w-full max-h-[500px]"
                    poster={selectedVideo.image}
                    autoPlay
                  >
                    <source src={selectedVideo.video_url} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>

                {/* Video Attribution */}
                <div className="mt-4 flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100">
                  <div className="text-sm text-gray-700">
                    Video by{' '}
                    <a
                      href={selectedVideo.user.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:text-purple-700 font-semibold hover:underline transition-colors inline-flex items-center gap-1"
                    >
                      {selectedVideo.user.name}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    {' '}on{' '}
                    <a
                      href="https://www.pexels.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:text-purple-700 font-semibold hover:underline transition-colors inline-flex items-center gap-1"
                    >
                      Pexels
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <div className="text-sm text-gray-500 flex items-center gap-2">
                    <Video className="h-4 w-4" />
                    {selectedVideo.duration}s
                  </div>
                </div>
              </div>
            )}

            {/* Video Thumbnails Grid */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-600" />
                Select a video ({videos.length} available):
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {videos.map((video) => (
                  <div
                    key={video.id}
                    onClick={() => onVideoSelect?.(video)}
                    className={`cursor-pointer rounded-lg overflow-hidden border-3 transition-all hover:scale-105 ${
                      selectedVideo?.id === video.id
                        ? 'border-purple-500 ring-2 ring-purple-300 shadow-lg'
                        : 'border-gray-200 hover:border-purple-300 hover:shadow-md'
                    }`}
                  >
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={video.image}
                        alt="Video thumbnail"
                        className="w-full h-24 object-cover"
                      />
                      {/* Play Icon Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center opacity-90 hover:opacity-100 transition-opacity">
                          <svg className="w-5 h-5 text-purple-600 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                          </svg>
                        </div>
                      </div>
                      {/* Duration Badge */}
                      <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded-md font-semibold">
                        {video.duration}s
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Video Info Card */}
            <div className="mt-6 p-5 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border-2 border-purple-100">
              <div className="flex items-start gap-3">
                <Video className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-purple-900 mb-1">
                    About These Videos
                  </p>
                  <p className="text-sm text-purple-700">
                    These videos are sourced from Pexels and match your content theme. 
                    Videos are stored locally and not saved to the database. Click any thumbnail to preview.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Captions Preview */}
      <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm hover:shadow-3xl transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-1 group">
        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 border-b-2 border-slate-100">
          <CardTitle className="text-xl font-bold flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg transition-transform duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-110 group-hover:rotate-3">
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
            className="hover:bg-white hover:border-indigo-300 rounded-lg shadow-sm hover:shadow-md transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-0.5 group/btn border-2"
          >
            <RefreshCw className={`h-4 w-4 mr-2 transition-transform duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] ${isLoading ? 'animate-spin' : 'group-hover/btn:rotate-180'}`} />
            Regenerate All
          </Button>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs defaultValue="facebook" className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 p-1.5 rounded-xl shadow-inner border border-slate-200">
              {platforms.map((platform) => (
                <TabsTrigger
                  key={platform.name}
                  value={platform.name.toLowerCase()}
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-lg transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-white/50 data-[state=active]:scale-105"
                >
                  <platform.icon className={`h-4 w-4 mr-1.5 ${platform.color}`} />
                  <span className="hidden sm:inline font-semibold">{platform.name}</span>
                </TabsTrigger>
              ))}
            </TabsList>
            {platforms.map((platform) => (
              <TabsContent
                key={platform.name}
                value={platform.name.toLowerCase()}
                className="space-y-4 mt-6 animate-in fade-in slide-in-from-bottom-2 duration-500"
              >
                <div className={`p-8 ${platform.bgColor} rounded-2xl border-2 ${platform.borderColor} relative shadow-lg hover:shadow-xl transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-1 group/caption`}>
                  <div className="absolute top-0 right-0 w-40 h-40 bg-white/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                  <div className="flex items-center justify-between mb-5 relative">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 bg-white rounded-xl shadow-md transition-transform duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover/caption:scale-110 group-hover/caption:rotate-3`}>
                        <platform.icon className={`h-7 w-7 ${platform.color}`} />
                      </div>
                      <span className="font-bold text-xl text-slate-900">{platform.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(platform.caption || '', platform.name)}
                      className="hover:bg-white/70 rounded-lg shadow-sm hover:shadow-md transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-0.5 group/copy"
                    >
                      <Copy className="h-4 w-4 mr-2 transition-transform duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover/copy:scale-110" />
                      <span className="font-medium">Copy</span>
                    </Button>
                  </div>
                  <div className="relative p-5 bg-white/60 backdrop-blur-sm rounded-xl border border-white/40 shadow-inner">
                    <p className="text-slate-800 whitespace-pre-wrap leading-relaxed text-base">
                      {platform.caption || 'No caption generated'}
                    </p>
                  </div>
                  <div className="mt-5 pt-4 border-t-2 border-white/40 flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      {platform.caption?.length || 0} characters
                    </span>
                    <span className="text-xs text-slate-600 bg-white/60 px-3 py-1.5 rounded-full font-medium shadow-sm">
                      Optimized for {platform.name}
                    </span>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {content.status === 'pending_approval' && (
        <Card className="border-0 shadow-2xl bg-gradient-to-br from-white via-slate-50 to-white hover:shadow-3xl transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-1 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-400/5 via-transparent to-red-400/5"></div>
          <CardContent className="pt-8 pb-8 relative">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Ready to Proceed?</h3>
              <p className="text-slate-600">Choose an action to continue with your content</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-5">
              <Button
                onClick={handleApproveAndPublish}
                size="lg"
                className="flex-1 h-20 text-xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-green-600 hover:from-green-700 hover:via-emerald-700 hover:to-green-700 shadow-xl hover:shadow-2xl transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] rounded-2xl hover:-translate-y-1 group relative overflow-hidden"
                disabled={isLoading}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                <Check className="mr-3 h-7 w-7 transition-transform duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-110 group-hover:rotate-12" />
                <span>Approve & Save Content</span>
              </Button>
              <Button
                onClick={onReject}
                size="lg"
                variant="outline"
                className="flex-1 h-20 text-xl font-bold border-3 border-red-600 text-red-600 hover:bg-red-50 hover:border-red-700 shadow-lg hover:shadow-xl transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] rounded-2xl hover:-translate-y-1 group"
                disabled={isLoading}
              >
                <X className="mr-3 h-7 w-7 transition-transform duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-110 group-hover:rotate-90" />
                <span>Reject & Regenerate</span>
              </Button>
            </div>
            <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-100">
              <p className="text-sm text-slate-700 text-center flex items-center justify-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-600" />
                <span><strong>Tip:</strong> Approve to save this content to your library, or reject to generate a fresh version</span>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Approved Content Actions */}
      {content.status === 'approved' && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <Button
                onClick={() => setPublishDialogOpen(true)}
                size="lg"
                className="flex-1"
                disabled={isLoading}
              >
                <Send className="mr-2 h-5 w-5" />
                Publish Now
              </Button>
              <Button
                onClick={() => setPublishDialogOpen(true)}
                size="lg"
                variant="outline"
                className="flex-1"
                disabled={isLoading}
              >
                <Clock className="mr-2 h-5 w-5" />
                Schedule Post
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