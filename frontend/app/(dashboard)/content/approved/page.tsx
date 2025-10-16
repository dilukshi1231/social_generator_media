'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { contentAPI } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import type { Content } from '@/types';

export default function ApprovedContentPage() {
    const { toast } = useToast();
    const [items, setItems] = useState<Content[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const res = await contentAPI.list({ skip: 0, limit: 100, status_filter: 'approved' });
                setItems(res.data || []);
            } catch (err: unknown) {
                const e = err as { response?: { data?: { detail?: string } } };
                toast({ title: 'Error', description: e.response?.data?.detail || 'Failed to fetch approved content', variant: 'destructive' });
            } finally {
                setLoading(false);
            }
        })();
    }, [toast]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Approved Content</h1>
                <Link href="/dashboard/content/create">
                    <Button>Create New</Button>
                </Link>
            </div>

            {loading ? (
                <div>Loading...</div>
            ) : items.length === 0 ? (
                <Card>
                    <CardContent>
                        <p>No approved content found.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {items.map((c) => (
                        <Card key={c.id}>
                            <CardHeader>
                                <CardTitle>{c.topic}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {c.image_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={c.image_url} alt={c.topic} className="w-full h-40 object-cover rounded" />
                                ) : (
                                    <div className="w-full h-40 bg-gray-100 rounded flex items-center justify-center">No image</div>
                                )}

                                <div className="mt-3 text-sm text-gray-700">
                                    <p className="font-medium">Facebook</p>
                                    <p className="truncate">{c.facebook_caption || '—'}</p>
                                </div>

                                <div className="mt-3 flex gap-2">
                                    <Link href={`/dashboard/content/${c.id}`}>
                                        <Button size="sm">View</Button>
                                    </Link>
                                    <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(c.facebook_caption || '')}>Copy FB Caption</Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
