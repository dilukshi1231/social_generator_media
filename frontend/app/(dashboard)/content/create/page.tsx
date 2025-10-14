'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { contentAPI } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Sparkles, ArrowLeft } from 'lucide-react';
import ContentPreview from '@/components/content/content-preview';
import type { Content } from '@/types';

export default function CreateContentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<Content | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!topic.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a topic',
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
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to approve content',
        variant: 'destructive',
      });
    }
  };

  const handleReject = async () => {
    if (!generatedContent) return;

    try {
      await contentAPI.approve(generatedContent.id, { approved: false });
      setGeneratedContent(null);
      toast({
        title: 'Content rejected',
        description: 'Generate new content with a different topic',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to reject content',
        variant: 'destructive',
      });
    }
  };

  const handleRegenerateCaptions = async () => {
    if (!generatedContent) return;

    try {
      const response = await contentAPI.regenerateCaptions(generatedContent.id);
      setGeneratedContent(response.data);
      toast({
        title: 'Captions regenerated',
        description: 'New captions have been generated',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to regenerate captions',
        variant: 'destructive',
      });
    }
  };

  const handleRegenerateImage = async () => {
    if (!generatedContent) return;

    try {
      const response = await contentAPI.regenerateImage(generatedContent.id);
      setGeneratedContent(response.data);
      toast({
        title: 'Image regenerated',
        description: 'A new image has been generated',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to regenerate image',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Content</h1>
          <p className="text-gray-600 mt-1">Generate AI-powered social media content</p>
        </div>
      </div>

      {!generatedContent ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-600" />
              AI Content Generator
            </CardTitle>
            <CardDescription>
              Enter a topic and let AI create platform-specific content for you
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleGenerate}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="topic">Content Topic</Label>
                <Textarea
                  id="topic"
                  placeholder="E.g., 'Tips for healthy eating', 'Latest technology trends', 'Summer fashion ideas'..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  disabled={isGenerating}
                  rows={4}
                  required
                />
                <p className="text-sm text-gray-500">
                  Be specific! The more detailed your topic, the better the AI-generated content.
                </p>
              </div>

              <Button type="submit" disabled={isGenerating} size="lg" className="w-full">
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating Content...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Generate Content
                  </>
                )}
              </Button>
            </CardContent>
          </form>
        </Card>
      ) : (
        <ContentPreview
          content={generatedContent}
          onApprove={handleApprove}
          onReject={handleReject}
          onRegenerateCaptions={handleRegenerateCaptions}
          onRegenerateImage={handleRegenerateImage}
          isLoading={false}
        />
      )}
    </div>
  );
}