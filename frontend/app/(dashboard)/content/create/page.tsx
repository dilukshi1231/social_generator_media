'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
// Input intentionally removed (not used in this page)
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
  const [webhookPhrase, setWebhookPhrase] = useState<string | null>(null);
  const [webhookRaw, setWebhookRaw] = useState<unknown | null>(null);
  const [isWebhookLoading, setIsWebhookLoading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

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
    // Send topic to external webhook (n8n) for image-generation prompt/phrase
    setIsWebhookLoading(true);
    setWebhookPhrase(null);
    setWebhookRaw(null);
    try {
      const webhookRes = await fetch('http://localhost:5678/webhook-test/viraldata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Topic: topic.trim(), Intention: 'Image generation' }),
      });

      if (!webhookRes.ok) {
        throw new Error(`Webhook returned HTTP ${webhookRes.status}`);
      }

      const webhookData = await webhookRes.json();
      const text = webhookData?.text || '';
      const match = text.match(/```json\n([\s\S]*?)\n```/);
      if (match) {
        try {
          const parsed = JSON.parse(match[1]);
          setWebhookRaw(parsed);
          setWebhookPhrase(parsed.phrase || null);
        } catch {
          setWebhookRaw(webhookData);
          setWebhookPhrase(null);
          toast({ title: 'Webhook parse failed', description: 'Received webhook response but failed to parse embedded JSON', variant: 'destructive' });
        }
      } else {
        setWebhookRaw(webhookData);
        setWebhookPhrase(null);
      }
    } catch (err: unknown) {
      const e = err as Error;
      toast({ title: 'Webhook Error', description: e.message || 'Failed to contact webhook', variant: 'destructive' });
    } finally {
      setIsWebhookLoading(false);
    }
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
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      toast({
        title: 'Generation failed',
        description: err.response?.data?.detail || 'Failed to generate content',
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
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      toast({
        title: 'Error',
        description: err.response?.data?.detail || 'Failed to approve content',
        variant: 'destructive',
      });
    }
  };

  const handleReject = async () => {
    if (!generatedContent) return;

    try {
      await contentAPI.approve(generatedContent.id, { approved: false });
      toast({
        title: 'Content rejected',
        description: 'Generating new content...',
      });

      // Clear current content and regenerate
      setGeneratedContent(null);
      setIsGenerating(true);

      try {
        const response = await contentAPI.generate({
          topic: topic.trim(),
          auto_approve: false,
        });

        setGeneratedContent(response.data);
        toast({
          title: 'New content generated!',
          description: 'Review your new AI-generated content below',
        });
      } catch (error: unknown) {
        const err = error as { response?: { data?: { detail?: string } } };
        toast({
          title: 'Generation failed',
          description: err.response?.data?.detail || 'Failed to generate content',
          variant: 'destructive',
        });
      } finally {
        setIsGenerating(false);
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      toast({
        title: 'Error',
        description: err.response?.data?.detail || 'Failed to reject content',
        variant: 'destructive',
      });
    }
  };

  const handleRegenerateCaptions = async () => {
    if (!generatedContent) return;

    setIsRegenerating(true);
    try {
      const response = await contentAPI.regenerateCaptions(generatedContent.id);
      setGeneratedContent(response.data);
      toast({
        title: 'Captions regenerated',
        description: 'New captions have been generated',
      });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      toast({
        title: 'Error',
        description: err.response?.data?.detail || 'Failed to regenerate captions',
        variant: 'destructive',
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleRegenerateImage = async () => {
    if (!generatedContent) return;

    setIsRegenerating(true);
    try {
      const response = await contentAPI.regenerateImage(generatedContent.id);
      setGeneratedContent(response.data);
      toast({
        title: 'Image regenerated',
        description: 'A new image has been generated',
      });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      toast({
        title: 'Error',
        description: err.response?.data?.detail || 'Failed to regenerate image',
        variant: 'destructive',
      });
    } finally {
      setIsRegenerating(false);
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
          {/* Show webhook phrase/output below generate section */}
          <div className="mt-4">
            <div className="bg-white border rounded-md p-4">
              <h3 className="text-sm font-medium text-gray-700">Webhook Output</h3>
              {isWebhookLoading ? (
                <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                  Sending topic to webhook...
                </div>
              ) : webhookPhrase ? (
                <div className="mt-2 text-sm text-gray-800">{webhookPhrase}</div>
              ) : webhookRaw ? (
                <pre className="mt-2 text-xs text-gray-700 overflow-auto max-h-40">{JSON.stringify(webhookRaw as unknown, null, 2)}</pre>
              ) : (
                <div className="mt-2 text-sm text-gray-500">No webhook output yet</div>
              )}
            </div>
          </div>
        </Card>
      ) : (
        <ContentPreview
          content={generatedContent}
          onApprove={handleApprove}
          onReject={handleReject}
          onRegenerateCaptions={handleRegenerateCaptions}
          onRegenerateImage={handleRegenerateImage}
          isLoading={isRegenerating || isGenerating}
        />
      )}
    </div>
  );
}