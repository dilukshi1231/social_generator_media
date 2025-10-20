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
  const [webhookRaw, setWebhookRaw] = useState<Record<string, unknown> | null>(null);
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
        <Card className="border-0 shadow-2xl bg-gradient-to-br from-white to-slate-50/50 backdrop-blur-sm hover:shadow-3xl transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)]">
          <CardHeader className="pb-6 border-b border-slate-100 bg-gradient-to-r from-indigo-50/50 to-purple-50/50">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="p-3 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl shadow-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              AI Content Generator
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Enter a topic and let AI create stunning, platform-specific content for you ✨
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleGenerate}>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-3">
                <Label htmlFor="topic" className="text-base font-semibold text-slate-700">Content Topic</Label>
                <Textarea
                  id="topic"
                  placeholder="E.g., 'Tips for healthy eating', 'Latest technology trends', 'Summer fashion ideas'..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  disabled={isGenerating}
                  rows={5}
                  required
                  className="resize-none text-base border-2 border-slate-200 focus:border-indigo-500 rounded-xl transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-slate-300"
                />
                <div className="flex items-start gap-2 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                  <Sparkles className="h-4 w-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-indigo-700">
                    <strong>Pro tip:</strong> Be specific! The more detailed your topic, the better the AI-generated content will be.
                  </p>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isGenerating}
                size="lg"
                className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] rounded-xl hover:-translate-y-0.5 group"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                    <span>Generating Magic...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-6 w-6 transition-transform duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:rotate-180" />
                    Generate Content
                  </>
                )}
              </Button>
            </CardContent>
          </form>
          {/* Show webhook phrase/output below generate section */}
          {(isWebhookLoading || webhookPhrase || webhookRaw) && (
            <div className="mx-6 mb-6">
              <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 border-2 border-slate-200 rounded-xl p-5 transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-slate-300 hover:shadow-md">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></div>
                  Webhook Output
                </h3>
                {isWebhookLoading ? (
                  <div className="flex items-center gap-3 mt-2 text-sm text-slate-600">
                    <svg className="h-5 w-5 animate-spin text-indigo-600" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                    <span>Connecting to webhook...</span>
                  </div>
                ) : webhookPhrase ? (
                  <div className="mt-2 p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
                    <p className="text-sm text-slate-800 leading-relaxed">{webhookPhrase}</p>
                  </div>
                ) : webhookRaw ? (
                  <pre className="mt-2 p-4 bg-slate-900 text-green-400 rounded-lg text-xs overflow-auto max-h-48 font-mono shadow-inner">{JSON.stringify(webhookRaw, null, 2)}</pre>
                ) : null}
              </div>
            </div>
          )}
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