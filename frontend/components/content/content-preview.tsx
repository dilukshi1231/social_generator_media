'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Check, X, RefreshCw, Facebook, Instagram, Linkedin, Twitter, Image as ImageIcon, Copy, Sparkles, Send, Clock } from 'lucide-react';
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
  // Return boolean to indicate success; supports async handlers
  onApprove?: () => Promise<boolean | void> | boolean | void;
  onReject: () => void;
  onRegenerateCaptions: () => void;
  onRegenerateImage: () => void;
  isLoading?: boolean;
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

  const handleApproveAndPublish = async () => {
    if (onApprove) {
      const result = await onApprove();
      if (result === false) {
        return; // Abort opening dialog on failure
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

      {/* Image Preview */}
      <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm overflow-hidden hover:shadow-3xl transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-1 group">
        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-b-2 border-slate-100">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-3 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl shadow-lg transition-transform duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-110 group-hover:rotate-3">
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
            className="hover:bg-white hover:border-indigo-300 rounded-lg shadow-sm hover:shadow-md transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-0.5 group/btn border-2"
          >
            <RefreshCw className={`h-4 w-4 mr-2 transition-transform duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] ${isLoading ? 'animate-spin' : 'group-hover/btn:rotate-180'}`} />
            Regenerate
          </Button>
        </CardHeader>
        <CardContent className="p-6">
          {content.image_url ? (
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 shadow-2xl ring-4 ring-indigo-100 hover:ring-indigo-200 transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] cursor-pointer group/image">
              <Image
                src={content.image_url}
                alt="Generated content"
                fill
                className="object-cover transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover/image:scale-105"
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover/image:opacity-100 transition-opacity duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)]" />
            </div>
          ) : (
            <div className="w-full aspect-video rounded-2xl bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300 flex items-center justify-center border-2 border-dashed border-slate-300">
              <div className="text-center">
                <ImageIcon className="h-12 w-12 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-500 font-medium">No image generated</p>
              </div>
            </div>
          )}
          {content.image_prompt && (
            <div className="mt-6 p-5 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-xl border-2 border-indigo-100 shadow-sm hover:shadow-md transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)]">
              <p className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5" />
                Image Prompt:
              </p>
              <p className="text-sm text-slate-700 leading-relaxed">{content.image_prompt}</p>
            </div>
          )}
        </CardContent>
      </Card>

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