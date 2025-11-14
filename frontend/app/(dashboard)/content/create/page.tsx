"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { contentAPI } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Sparkles, ArrowLeft } from "lucide-react";
import ContentPreview from "@/components/content/content-preview";
import CaptionCustomizer, { CaptionSettings, defaultCaptionSettings } from "@/components/content/caption-customizer";
import type { Content } from "@/types";

type WebhookResponse = {
  image_generation_prompt?: string;
  image_caption?: string;
  social_media_captions?: Record<string, string>;
  [key: string]: unknown;
};

export default function ContentCreatePage() {
  const router = useRouter();
  const { toast } = useToast();

  const [topic, setTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<Content | null>(null);
  const [isWebhookLoading, setIsWebhookLoading] = useState(false);
  const [webhookRaw, setWebhookRaw] = useState<Record<string, unknown> | null>(null);
  const [captionSettings, setCaptionSettings] = useState<CaptionSettings>(defaultCaptionSettings);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!topic.trim()) {
      toast({ title: "Error", description: "Please enter a topic", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    setIsWebhookLoading(true);
    setWebhookRaw(null);

    try {
      const webhookUrl = "http://localhost:5678/webhook-test/viraldata";
      const webhookRes = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim() }),
      });

      if (!webhookRes.ok) {
        const errorText = await webhookRes.text();
        throw new Error(`Webhook returned HTTP ${webhookRes.status}: ${errorText}`);
      }

      const webhookData = (await webhookRes.json()) as WebhookResponse;
      setWebhookRaw(webhookData as Record<string, unknown>);
      setIsWebhookLoading(false);

      const imagePrompt = (webhookData.image_generation_prompt ?? "") as string;
      const imageCaption = (webhookData.image_caption ?? "") as string;
      const captions = (webhookData.social_media_captions ?? {}) as Record<string, string>;

      const facebookCaption = captions.facebook ?? "";
      const instagramCaption = captions.instagram ?? "";
      const linkedinCaption = captions.linkedin ?? "";
      const twitterCaption = captions.twitter ?? "";
      const threadsCaption = captions.threads ?? "";

      let imageUrl = "";
      if (imagePrompt) {
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
          const proxyUrl = `${apiUrl}/api/v1/content/generate-image-proxy`;
          const token = localStorage.getItem("access_token");
          if (!token) throw new Error("Authentication required");

          const imgResponse = await fetch(proxyUrl, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: imagePrompt }),
          });

          if (imgResponse.ok) {
            const imgData = await imgResponse.json();
            imageUrl = `${apiUrl}${imgData.image_url}`;

            if (imageCaption && captionSettings.enabled) {
              try {
                await contentAPI.embedCaption({
                  image_url: imgData.image_url,
                  caption: imageCaption,
                  position: captionSettings.position,
                  font_size: captionSettings.fontSize,
                  text_color: captionSettings.textColor,
                  text_opacity: captionSettings.textOpacity,
                  bg_color: captionSettings.bgColor,
                  bg_opacity: captionSettings.bgOpacity,
                  padding: captionSettings.padding,
                  max_width_ratio: captionSettings.maxWidthRatio,
                  font_family: captionSettings.fontFamily,
                });
              } catch (embedErr) {
                console.error("Failed to embed caption:", embedErr);
              }
            }
          } else {
            console.error("Failed to generate image:", await imgResponse.text());
          }
        } catch (imgErr) {
          console.error("Image generation error:", imgErr);
        }
      }

      const response = await contentAPI.create({
        topic: topic.trim(),
        image_prompt: imagePrompt,
        image_caption: imageCaption,
        image_url: imageUrl,
        facebook_caption: facebookCaption,
        instagram_caption: instagramCaption,
        linkedin_caption: linkedinCaption,
        pinterest_caption: "",
        twitter_caption: twitterCaption,
        threads_caption: threadsCaption,
        auto_approve: false,
      });

      setGeneratedContent(response.data);
      toast({ title: "Content generated!", description: "Review your AI-generated content below" });
    } catch (err: unknown) {
      console.error("Generate error:", err);
      const message = err instanceof Error ? err.message : String(err);
      if (err instanceof TypeError && message.includes("Failed to fetch")) {
        toast({ title: "Connection Failed", description: "Cannot connect to n8n webhook. Make sure n8n is running on http://localhost:5678", variant: "destructive" });
      } else {
        toast({ title: "Generation failed", description: message || "Failed to generate content", variant: "destructive" });
      }
    } finally {
      setIsGenerating(false);
      setIsWebhookLoading(false);
    }
  };

  return (
    <div className="space-y-6">
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
            <CardDescription className="text-base mt-2">Enter a topic and let AI create stunning, platform-specific content for you ✨</CardDescription>
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
                  className="resize-none text-base border-2 border-slate-200 focus:border-indigo-500 rounded-xl"
                />
                <div className="flex items-start gap-2 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                  <Sparkles className="h-4 w-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-indigo-700"><strong>Pro tip:</strong> Be specific! The more detailed your topic, the better the AI-generated content will be.</p>
                </div>
              </div>

              <CaptionCustomizer settings={captionSettings} onChange={setCaptionSettings} previewCaption="Unleashing emotions, one dance at a time. ✨" />

              <Button type="submit" disabled={isGenerating} size="lg" className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-indigo-600 to-purple-600">
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-6 w-6" />
                    Generate Content
                  </>
                )}
              </Button>

              {isWebhookLoading && (
                <div className="text-sm text-slate-600">Connecting to webhook...</div>
              )}

              {webhookRaw && (
                <pre className="mt-2 p-4 bg-slate-900 text-green-400 rounded-lg text-xs overflow-auto max-h-48 font-mono">{JSON.stringify(webhookRaw, null, 2)}</pre>
              )}
            </CardContent>
          </form>
        </Card>
      ) : (
        <ContentPreview
          content={generatedContent}
          onApprove={() => console.log('approved')}
          onReject={() => setGeneratedContent(null)}
          onRegenerateCaptions={() => console.log('regenerate captions')}
          onRegenerateImage={() => console.log('regenerate image')}
          isLoading={false}
        />
      )}
    </div>
  );
}
