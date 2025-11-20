"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { contentAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import type { Content } from "@/types";
import ContentPreview from "@/components/content/content-preview";

export default function ContentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [content, setContent] = useState<Content | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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

  // Fetch content
  useEffect(() => {
    const id = params?.id;
    if (!id) return;
    const idStr = Array.isArray(id) ? id[0] : id;
    fetchContent(idStr);
  }, [params, fetchContent]);

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

  return (
    <div className="space-y-6">
      <ContentPreview
        content={content}
        onReject={() => router.push("/dashboard/content")}
        onRegenerateCaptions={() => toast({ title: "Regenerated captions" })}
        onRegenerateImage={() => toast({ title: "Regenerated image" })}
      />
    </div>
  );
}
