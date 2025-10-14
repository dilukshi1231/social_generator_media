'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { contentAPI } from '@/lib/api';
import { Loader2, Sparkles, ArrowLeft } from 'lucide-react';
import ContentPreview from '@/components/content/content-preview';
import type { Content } from '@/types';

export default function CreateContentPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<Content | null>(null);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast({
        title: 'Topic required',
        description: 'Please enter a topic for content generation',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);

    try {
      const response = await contentAPI.generate({
        topic: topic.trim(),
        auto_approve: false,
      });

      setGeneratedContent(response.data);

      toast({
        title: 'Content generated!',
        description: 'Review your AI-generated content below',
      });
    } catch (error: any) {
      toast({
        title: 'Generation failed',
        description: error.response?.data?.detail || 'Failed to generate content',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApprove = async () => {
    if (!generatedContent) return;

    try {
      await contentAPI.approve(generatedContent.id, { approved: true });

      toast({
        title: 'Content approved!',
        description: 'You can now publish this content',
      });

      router.push('/dashboard/content');
    } catch (error: any) {
      toast({
        title: 'Approval failed',
        description: error.response?.data?.detail || 'Failed to approve content',
        variant: 'destructive',
      });
    }
  };

  const handleReject = async () => {
    if (!generatedContent) return;

    try {
      await contentAPI.approve(generatedContent.id, {
        approved: false,
        feedback: 'User rejected',
      });

      toast({
        title: 'Content rejected',
        description: 'Generate new content or try a different topic',
      });

      setGeneratedContent(null);
      setTopic('');
    } catch (error: any) {
      toast({
        title: 'Rejection failed',
        description: error.response?.data?.detail || 'Failed to reject content',
        variant: 'destructive',
      });
    }
  };

  const handleRegenerateCaptions = async () => {
    if (!generatedContent) return;

    setIsGenerating(true);
    try {
      const response = await contentAPI.regenerateCaptions(generatedContent.id);
      setGeneratedContent(response.data);

      toast({
        title: 'Captions regenerated!',
        description: 'Review the new captions below',
      });
    } catch (error: any) {
      toast({
        title: 'Regeneration failed',
        description: error.response?.data?.detail || 'Failed to regenerate captions',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerateImage = async () => {
    if (!generatedContent) return;

    setIsGenerating(true);
    try {
      const response = await contentAPI.regenerateImage(generatedContent.id);
      setGeneratedContent(response.data);

      toast({
        title: 'Image regenerated!',
        description: 'Review the new image below',
      });
    } catch (error: any) {
      toast({
        title: 'Regeneration failed',
        description: error.response?.data?.detail || 'Failed to regenerate image',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Content</h1>
          <p className="text-gray-600 mt-1">
            Generate AI-powered content for your social media
          </p>
        </div>
      </div>

      {/* Content Generation Form */}
      {!generatedContent && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-600" />
              AI Content Generator
            </CardTitle>
            <CardDescription>
              Enter a topic and let AI create platform-specific content and images
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="topic">Content Topic</Label>
              <Textarea
                id="topic"
                placeholder="Example: 10 tips for remote work productivity, Benefits of meditation, New product launch..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                rows={4}
                disabled={isGenerating}
                className="resize-none"
              />
              <p className="text-sm text-gray-500">
                Be specific for better results. The AI will generate captions for all platforms.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !topic.trim()}
                size="lg"
                className="flex-1"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating... (30-60s)
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Generate Content
                  </>
                )}
              </Button>
            </div>

            {isGenerating && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <p className="text-sm text-indigo-900 font-medium">
                  AI is working its magic... ✨
                </p>
                <p className="text-sm text-indigo-700 mt-1">
                  This may take 30-60 seconds. We're generating:
                </p>
                <ul className="text-sm text-indigo-700 mt-2 space-y-1 list-disc list-inside">
                  <li>Platform-specific captions (Facebook, Instagram, LinkedIn, Twitter, Threads)</li>
                  <li>Optimized image prompt</li>
                  <li>AI-generated image</li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Content Preview */}
      {generatedContent && (
        <ContentPreview
          content={generatedContent}
          onApprove={handleApprove}
          onReject={handleReject}
          onRegenerateCaptions={handleRegenerateCaptions}
          onRegenerateImage={handleRegenerateImage}
          isLoading={isGenerating}
        />
      )}
    </div>
  );
}