"use client";

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { contentAPI } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import type { Content } from '@/types';

export default function ContentDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const [content, setContent] = useState<Content | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchContent = useCallback(async (id: string) => {
        try {
            setIsLoading(true);

            const res = await contentAPI.get(parseInt(id, 10));
            setContent(res.data as Content);
        } catch {
            toast({ title: 'Error', description: 'Failed to load content', variant: 'destructive' });
            router.push('/dashboard/content');
        } finally {
            setIsLoading(false);
        }
    }, [router, toast]);

    useEffect(() => {
        const id = params?.id;
        if (!id) return;
        const idStr = Array.isArray(id) ? id[0] : id;
        fetchContent(idStr);
    }, [params, fetchContent]);

    if (isLoading) return <div>Loading...</div>;
    if (!content) return <div>Not found</div>;

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">{content.topic}</h1>
                <div>
                    <Button variant="ghost" onClick={() => router.push('/dashboard/content')}>Back</Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Content Details</CardTitle>
                    <CardDescription>Status: {content.status}</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="mb-4"><strong>Facebook:</strong> {content.facebook_caption}</p>
                    <p className="mb-4"><strong>Instagram:</strong> {content.instagram_caption}</p>
                    <p className="mb-4"><strong>LinkedIn:</strong> {content.linkedin_caption}</p>
                    <p className="mb-4"><strong>Twitter:</strong> {content.twitter_caption}</p>
                    {content.image_prompt && (
                        <div className="mt-4">
                            <p className="text-sm font-medium">Image prompt</p>
                            <p className="text-sm text-gray-600">{content.image_prompt}</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
