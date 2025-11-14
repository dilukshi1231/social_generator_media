"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { contentAPI } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  X,
  Maximize2,
  Send,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  Image as ImageIcon,
  Video,
  Loader2,
  Play,
  ExternalLink,
} from "lucide-react";
import type { Content } from "@/types";
import PublishDialog from "@/components/content/publish-dialog";
import ContentPreview from "@/components/content/content-preview"; // ✅ Import your improved preview

interface Video {
  id: number;
  url: string;
  video_url: string;
  width: number;
  height: number;
  duration: number;
  image: string;
  user: {
    name: string;
    url: string;
  };
}

export default function ContentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [content, setContent] = useState<Content | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const fetchContent = useCallback(
    async (id: string) => {
      try {
        setIsLoading(true);
        const res = await contentAPI.get(parseInt(id, 10));
        setContent(res.data as Content);
      } catch {
        toast({
          title: "Error",
          description: "Failed to load content",
          variant: "destructive",
        });
        router.push("/dashboard/content");
      } finally {
        setIsLoading(false);
      }
    },
    [router, toast]
  );

  // ✅ Fetch videos from backend (Pexels)
  const fetchVideos = useCallback(
    async (prompt: string) => {
      try {
        setIsLoadingVideos(true);
        const token = localStorage.getItem("access_token");

        if (!token) {
          throw new Error("No access token found");
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/v1/content/search-videos`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              prompt: prompt,
              per_page: 5,
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch videos");
        }

        const data = await response.json();

        // ✅ Map the returned data safely
        const formatted =
          data?.videos?.map((v: any) => ({
            id: v.id,
            url: v.url,
            video_url: v.video_files?.[0]?.link || "",
            width: v.width,
            height: v.height,
            duration: v.duration,
            image: v.image,
            user: v.user,
          })) || [];

        console.log("🎥 Videos fetched:", formatted);

        setVideos(formatted);
        if (formatted.length > 0) {
          setSelectedVideo(formatted[0]);
        }
      } catch (error) {
        console.error("Error fetching videos:", error);
        toast({
          title: "Video search failed",
          description: "Could not fetch videos from Pexels",
          variant: "destructive",
        });
      } finally {
        setIsLoadingVideos(false);
      }
    },
    [toast]
  );

  // Fetch content
  useEffect(() => {
    const id = params?.id;
    if (!id) return;
    const idStr = Array.isArray(id) ? id[0] : id;
    fetchContent(idStr);
  }, [params, fetchContent]);

  // Fetch related videos when content is ready
  useEffect(() => {
    if (content?.image_prompt) {
      fetchVideos(content.image_prompt);
    }
  }, [content?.image_prompt, fetchVideos]);

  // 🔄 Loading state
  if (isLoading) {
    return (
      <div className="text-center py-20">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg mb-4 animate-pulse">
          <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-slate-600 font-medium">Loading content...</p>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="text-center py-20">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 mb-6">
          <span className="text-4xl">📄</span>
        </div>
        <p className="text-xl font-semibold text-slate-700 mb-2">Content not found</p>
        <p className="text-slate-500 mb-6">The content you&apos;re looking for doesn&apos;t exist</p>
        <Button onClick={() => router.push("/dashboard/content")}>Back to Library</Button>
      </div>
    );
  }

  // ✅ If you want to use your new preview component
  return (
    <div className="space-y-6">
      <ContentPreview
        content={content}
        videos={videos}
        selectedVideo={selectedVideo}
        onVideoSelect={setSelectedVideo}
        onReject={() => router.push("/dashboard/content")}
        onRegenerateCaptions={() => toast({ title: "Regenerated captions" })}
        onRegenerateImage={() => toast({ title: "Regenerated image" })}
      />
    </div>
  );
}
