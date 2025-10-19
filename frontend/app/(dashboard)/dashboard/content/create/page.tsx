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

  const generateImage = async (prompt: string): Promise<string> => {
    console.log('[Image] Generating image with prompt:', prompt);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const proxyUrl = `${apiUrl}/api/v1/content/generate-image-proxy`;

    try {
      // Get auth token from localStorage - correct key is 'access_token'
      const token = localStorage.getItem('access_token');

      if (!token) {
        console.error('[Image] No access token found in localStorage');
        throw new Error('Authentication required. Please log in again.');
      }

      console.log('[Image] Calling backend proxy:', proxyUrl);
      console.log('[Image] Token found:', token ? 'Yes' : 'No');

      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      console.log('[Image] Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Image generation failed: ${errorText}`);
      }

      // Parse JSON response with image_url and file_path
      const data = await response.json();
      console.log('[Image] Response data:', data);

      // Construct full URL for the saved image
      const imageUrl = `${apiUrl}${data.image_url}`;

      console.log('[Image] Image saved to:', data.file_path);
      console.log('[Image] Image URL:', imageUrl);

      return imageUrl;
    } catch (error) {
      console.error('[Image] Error generating image:', error);
      throw error;
    }
  };

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
      // Step 1: Get content from n8n webhook
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

      // Step 2: Generate image using the prompt from webhook
      let imageUrl: string | undefined;
      if (parsedData.prompt) {
        console.log('[Image] Starting image generation...');
        try {
          imageUrl = await generateImage(parsedData.prompt);
          console.log('[Image] Image URL created:', imageUrl);
        } catch (imageError) {
          console.error('[Image] Image generation failed, continuing without image:', imageError);
          // Continue without image - don't fail the whole process
        }
      }

      // Step 3: Create Content object from webhook response
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
        image_url: imageUrl,
        status: 'pending_approval',
        created_at: new Date().toISOString(),
      };

      console.log('[Webhook] Created Content object:', content);

      setGeneratedContent(content);

      toast({
        title: 'Content generated!',
        description: imageUrl
          ? 'Review your AI-generated content and image below'
          : 'Review your AI-generated content below (image generation failed)',
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

    try {
      console.log('[Approve] Saving content to database...', generatedContent);

      // Import the contentAPI
      const { contentAPI } = await import('@/lib/api');

      // Save content to database with auto_approve=true
      const response = await contentAPI.create({
        topic: generatedContent.topic,
        facebook_caption: generatedContent.facebook_caption,
        instagram_caption: generatedContent.instagram_caption,
        linkedin_caption: generatedContent.linkedin_caption,
        pinterest_caption: generatedContent.pinterest_caption,
        twitter_caption: generatedContent.twitter_caption,
        threads_caption: generatedContent.threads_caption,
        image_prompt: generatedContent.image_prompt,
        image_url: generatedContent.image_url,
        auto_approve: true,
      });

      console.log('[Approve] Content saved successfully:', response.data);

      toast({
        title: 'Content approved and saved!',
        description: 'Your content has been saved to the database',
      });

      router.push('/dashboard/content');
    } catch (error) {
      console.error('[Approve] Error saving content:', error);
      toast({
        title: 'Failed to save content',
        description: 'Please try again',
        variant: 'destructive',
      });
    }
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