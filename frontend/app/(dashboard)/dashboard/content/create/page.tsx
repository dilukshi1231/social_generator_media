'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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

  useEffect(() => {
    console.log('🚀 CreateContentPage component mounted');
  }, []);

  const handleGenerate = async () => {
    console.log('=== handleGenerate CALLED ===');
    console.log('Topic:', topic);

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
      const webhookUrl = 'http://localhost:5678/webhook-test/viraldata';
      const requestBody = {
        Topic: topic.trim(),
        Intention: "Image generation"
      };

      console.log('[Webhook] Sending request to:', webhookUrl);
      console.log('[Webhook] Request body:', requestBody);

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('[Webhook] Response status:', response.status);
      console.log('[Webhook] Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        throw new Error(`Webhook returned ${response.status}`);
      }

      const data = await response.json();
      console.log('[Webhook] Raw response data:', data);

      // Parse the markdown-wrapped JSON
      let parsedData;
      if (data.text) {
        console.log('[Webhook] Response has .text property, attempting to parse...');
        const jsonMatch = data.text.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch) {
          parsedData = JSON.parse(jsonMatch[1]);
          console.log('[Webhook] Parsed JSON from markdown:', parsedData);
        } else {
          console.error('[Webhook] Could not extract JSON from markdown');
          throw new Error('Invalid response format from webhook');
        }
      } else {
        parsedData = data;
        console.log('[Webhook] Using data directly (no .text wrapper)');
      }

      // Create Content object from webhook response
      const content: Content = {
        id: 0, // Temporary ID since webhook doesn't provide one
        topic: topic.trim(),
        facebook_caption: parsedData.facebook_caption || '',
        instagram_caption: parsedData.instagram_caption || '',
        linkedin_caption: parsedData.linkedin_caption || '',
        twitter_caption: parsedData.x_tweet || '', // Map x_tweet to twitter_caption
        threads_caption: parsedData.threads_caption || '',
        pinterest_caption: parsedData.pinterest_caption || '',
        image_prompt: parsedData.prompt || '',
        image_url: undefined,
        status: 'pending_approval',
        created_at: new Date().toISOString(),
      };

      console.log('[Webhook] Created Content object:', content);

      setGeneratedContent(content);

      toast({
        title: 'Content generated!',
        description: 'Review your AI-generated content below',
      });
    } catch (error: unknown) {
      console.error('[Webhook] Error:', error);

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorName = error instanceof Error ? error.name : '';

      // Check if it's a CORS error
      if (errorMessage.includes('Failed to fetch') || errorName === 'TypeError') {
        console.error('[Webhook] Possible CORS error - check n8n webhook settings');
        toast({
          title: 'Connection failed',
          description: 'Could not connect to content generation service. Check console for details.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Generation failed',
          description: errorMessage || 'Failed to generate content',
          variant: 'destructive',
        });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApprove = async () => {
    if (!generatedContent) return;

    toast({
      title: 'Content approved!',
      description: 'You can now publish this content',
    });

    router.push('/dashboard/content');
  };

  const handleReject = async () => {
    if (!generatedContent) return;

    toast({
      title: 'Content rejected',
      description: 'Generate new content or try a different topic',
    });

    setGeneratedContent(null);
    setTopic('');
  };

  const handleRegenerateCaptions = async () => {
    if (!generatedContent) return;

    // Call webhook again with the same topic
    await handleGenerate();
  };

  const handleRegenerateImage = async () => {
    if (!generatedContent) return;

    // Call webhook again with the same topic
    await handleGenerate();
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
                    Generate Content Yo
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
                  This may take 30-60 seconds. We&apos;re generating:
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