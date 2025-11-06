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

  const generateImage = async (prompt: string, caption?: string): Promise<string> => {
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

      // Embed caption if provided
      if (caption) {
        try {
          console.log('[Caption] Embedding caption on image...');
          const { contentAPI } = await import('@/lib/api');
          await contentAPI.embedCaption({
            image_url: data.image_url,
            caption: caption,
            position: 'bottom',
            font_size: 40,
          });
          console.log('[Caption] Caption embedded successfully');
        } catch (embedError) {
          console.error('[Caption] Failed to embed caption:', embedError);
          // Continue without caption embed - not critical
        }
      }

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

      // Extract data from the new nested structure
      const imagePrompt = data.image_generation_prompt || '';
      const imageCaption = data.image_caption || '';
      const captions = data.social_media_captions || {};

      // Map captions to our expected format
      const facebookCaption = captions.facebook || '';
      const instagramCaption = captions.instagram || '';
      const linkedinCaption = captions.linkedin || '';
      const twitterCaption = captions.twitter || '';
      const tiktokCaption = captions.tiktok || '';

      console.log('[Webhook] Extracted data:', {
        image_prompt: imagePrompt?.substring(0, 50) + '...',
        has_facebook: !!facebookCaption,
        has_instagram: !!instagramCaption,
        has_linkedin: !!linkedinCaption,
      });

      // Step 2: Generate image using the prompt from webhook
      let imageUrl: string | undefined;
      if (imagePrompt) {
        console.log('[Image] Starting image generation...');
        try {
          imageUrl = await generateImage(imagePrompt, imageCaption);
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
        facebook_caption: facebookCaption,
        instagram_caption: instagramCaption,
        linkedin_caption: linkedinCaption,
        twitter_caption: twitterCaption,
        threads_caption: tiktokCaption,
        pinterest_caption: '', // Not in new format
        image_prompt: imagePrompt,
        image_caption: imageCaption,
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

  const handleApprove = async (): Promise<boolean> => {
    if (!generatedContent) return false;

    try {
      console.log('[Approve] Saving content to database...', generatedContent);

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
        image_caption: generatedContent.image_caption,
        image_url: generatedContent.image_url,
        auto_approve: true,
      });

      console.log('[Approve] Content saved successfully:', response.data);

      // Update local state with saved/approved content so the dialog has accurate data
      setGeneratedContent(response.data as Content);

      toast({
        title: 'Content approved!',
        description: 'Select platforms to publish your content',
      });

      // Do not navigate; allow ContentPreview to open the publish dialog
      return true;
    } catch (error) {
      console.error('[Approve] Error saving content:', error);
      toast({
        title: 'Failed to save content',
        description: 'Please try again',
        variant: 'destructive',
      });
      return false;
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
    if (!generatedContent || !topic) return;

    setIsGenerating(true);

    try {
      console.log('[Regenerate All] Calling n8n webhook to regenerate everything...');

      // Step 1: Call n8n webhook to regenerate image and captions
      const webhookUrl = 'http://localhost:5678/webhook-test/generate-social-posts';
      console.log('[Regenerate All] Webhook URL:', webhookUrl);

      const webhookResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim() }),
      });

      if (!webhookResponse.ok) {
        throw new Error(`Webhook failed with status ${webhookResponse.status}`);
      }

      const parsedData = await webhookResponse.json();
      console.log('[Regenerate All] Webhook response:', parsedData);

      // Extract data from the new nested structure
      const imagePrompt = parsedData.image_generation_prompt || '';
      const captions = parsedData.social_media_captions || {};

      // Map captions to our expected format
      const facebookCaption = captions.facebook || '';
      const instagramCaption = captions.instagram || '';
      const linkedinCaption = captions.linkedin || '';
      const twitterCaption = captions.twitter || '';
      const tiktokCaption = captions.tiktok || '';

      console.log('[Regenerate All] Extracted data:', {
        image_prompt: imagePrompt?.substring(0, 50) + '...',
        has_facebook: !!facebookCaption,
        has_instagram: !!instagramCaption,
      });

      // Step 2: Generate image from prompt using backend proxy
      let imageUrl = '';
      if (imagePrompt) {
        try {
          imageUrl = await generateImage(imagePrompt);
          console.log('[Regenerate All] Image generated successfully:', imageUrl);
        } catch (imgError) {
          console.error('[Regenerate All] Image generation failed:', imgError);
        }
      }

      // Step 3: Update Content object with new data
      const updatedContent: Content = {
        ...generatedContent,
        facebook_caption: facebookCaption,
        instagram_caption: instagramCaption,
        linkedin_caption: linkedinCaption,
        twitter_caption: twitterCaption,
        threads_caption: tiktokCaption,
        pinterest_caption: '',
        image_prompt: imagePrompt || generatedContent.image_prompt || '',
        image_url: imageUrl || generatedContent.image_url || '',
      };

      console.log('[Regenerate All] Updated Content:', updatedContent);

      setGeneratedContent(updatedContent);

      toast({
        title: 'Content regenerated!',
        description: 'New image and all captions have been generated',
      });
    } catch (error: unknown) {
      console.error('[Regenerate All] Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      toast({
        title: 'Regeneration failed',
        description: errorMessage || 'Failed to regenerate content',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerateImage = async () => {
    if (!generatedContent || !generatedContent.image_prompt) return;

    setIsGenerating(true);

    try {
      console.log('[Regenerate Image] Regenerating image with same prompt:', generatedContent.image_prompt);

      // Generate new image using the existing prompt
      const imageUrl = await generateImage(generatedContent.image_prompt);
      console.log('[Regenerate Image] New image generated:', imageUrl);

      // Update only the image_url, keep everything else the same
      const updatedContent: Content = {
        ...generatedContent,
        image_url: imageUrl,
      };

      setGeneratedContent(updatedContent);

      toast({
        title: 'Image regenerated!',
        description: 'A new image has been generated using the same prompt',
      });
    } catch (error: unknown) {
      console.error('[Regenerate Image] Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      toast({
        title: 'Image regeneration failed',
        description: errorMessage || 'Failed to regenerate image',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="hover:bg-slate-100 rounded-xl"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-indigo-900 to-purple-900 bg-clip-text text-transparent">
            Create Content
          </h1>
          <p className="text-slate-600 mt-2 text-lg">
            Generate AI-powered content for all your social media platforms
          </p>
        </div>
      </div>

      {/* Content Generation Form */}
      {!generatedContent && (
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm card-hover">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              AI Content Generator
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Enter a topic and let AI create platform-specific content and stunning images
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="topic" className="text-base font-semibold text-slate-700">Content Topic</Label>
              <Textarea
                id="topic"
                placeholder="Example: 10 tips for remote work productivity, Benefits of meditation, New product launch..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                rows={5}
                disabled={isGenerating}
                className="resize-none text-base border-2 focus:border-indigo-500 rounded-xl transition-all"
              />
              <p className="text-sm text-slate-500 flex items-start gap-2">
                <span className="text-indigo-600 mt-0.5">💡</span>
                <span>Be specific for better results. The AI will generate optimized captions for all platforms.</span>
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !topic.trim()}
                size="lg"
                className="flex-1 h-14 text-base font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all rounded-xl btn-shine"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating Magic... (30-60s)
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
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-6 animate-fade-in">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-indigo-600 rounded-lg">
                    <Sparkles className="h-5 w-5 text-white animate-pulse" />
                  </div>
                  <p className="text-base text-indigo-900 font-semibold">
                    AI is working its magic... ✨
                  </p>
                </div>
                <p className="text-sm text-indigo-700 mb-3">
                  This may take 30-60 seconds. We&apos;re generating:
                </p>
                <ul className="text-sm text-indigo-700 space-y-2">
                  {[
                    'Platform-specific captions (Facebook, Instagram, LinkedIn, Twitter, TikTok)',
                    'Optimized image prompt for maximum engagement',
                    'AI-generated professional image'
                  ].map((item, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <span className="flex-shrink-0 w-1.5 h-1.5 bg-indigo-600 rounded-full"></span>
                      <span>{item}</span>
                    </li>
                  ))}
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