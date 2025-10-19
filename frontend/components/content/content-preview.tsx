'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Check, X, RefreshCw, Facebook, Instagram, Linkedin, Twitter, Image as ImageIcon, Send, Clock } from 'lucide-react';
import type { Content } from '@/types';
import Image from 'next/image';
import PublishDialog from '@/components/content/publish-dialog';

interface ContentPreviewProps {
  content: Content;
  onApprove: () => void;
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
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);

  const platforms = [
    {
      name: 'Facebook',
      icon: Facebook,
      caption: content.facebook_caption,
      color: 'text-blue-600',
    },
    {
      name: 'Instagram',
      icon: Instagram,
      caption: content.instagram_caption,
      color: 'text-pink-600',
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      caption: content.linkedin_caption,
      color: 'text-blue-700',
    },
    {
      name: 'Twitter',
      icon: Twitter,
      caption: content.twitter_caption,
      color: 'text-black',
    },
    {
      name: 'Threads',
      icon: Twitter,
      caption: content.threads_caption,
      color: 'text-gray-900',
    },
  ];

  const handleApproveAndPublish = async () => {
    await onApprove();
    setPublishDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Generated Content</CardTitle>
              <p className="text-sm text-gray-600 mt-1">Topic: {content.topic}</p>
            </div>
            <Badge variant={content.status === 'approved' ? 'default' : 'secondary'}>
              {content.status}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Image Preview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Generated Image
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={onRegenerateImage}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Regenerate Image
          </Button>
        </CardHeader>
        <CardContent>
          {content.image_url ? (
            <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-100">
              <Image
                src={content.image_url}
                alt="Generated content"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          ) : (
            <div className="w-full aspect-video rounded-lg bg-gray-100 flex items-center justify-center">
              <p className="text-gray-500">No image generated</p>
            </div>
          )}
          {content.image_prompt && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs font-medium text-gray-700">Image Prompt:</p>
              <p className="text-sm text-gray-600 mt-1">{content.image_prompt}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Captions Preview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Platform Captions</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={onRegenerateCaptions}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Regenerate Captions
          </Button>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="facebook" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              {platforms.map((platform) => (
                <TabsTrigger key={platform.name} value={platform.name.toLowerCase()}>
                  <platform.icon className={`h-4 w-4 mr-1 ${platform.color}`} />
                  {platform.name}
                </TabsTrigger>
              ))}
            </TabsList>
            {platforms.map((platform) => (
              <TabsContent
                key={platform.name}
                value={platform.name.toLowerCase()}
                className="space-y-4"
              >
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <platform.icon className={`h-5 w-5 ${platform.color}`} />
                    <span className="font-medium">{platform.name}</span>
                  </div>
                  <p className="text-gray-800 whitespace-pre-wrap">
                    {platform.caption || 'No caption generated'}
                  </p>
                  <div className="mt-3 text-xs text-gray-500">
                    {platform.caption?.length || 0} characters
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {content.status === 'pending_approval' && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <Button
                onClick={handleApproveAndPublish}
                size="lg"
                className="flex-1 bg-green-600 hover:bg-green-700"
                disabled={isLoading}
              >
                <Check className="mr-2 h-5 w-5" />
                Approve & Publish
              </Button>
              <Button
                onClick={onReject}
                size="lg"
                variant="outline"
                className="flex-1 border-red-600 text-red-600 hover:bg-red-50"
                disabled={isLoading}
              >
                <X className="mr-2 h-5 w-5" />
                Reject & Regenerate
              </Button>
            </div>
            <p className="text-sm text-gray-500 text-center mt-4">
              Approve to proceed with publishing, or reject to generate new content
            </p>
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