'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface WebhookResponse {
    text?: string;
}

export default function WebhookPhrase({ url = 'http://localhost:5678/webhook-test/viraldata' }: { url?: string }) {
    const [phrase, setPhrase] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        const fetchPhrase = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(url, { cache: 'no-store' });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data: WebhookResponse = await res.json();
                // data.text contains a markdown fenced block with JSON inside
                const text = data.text || '';
                // Extract JSON inside ```json ... ```
                const match = text.match(/```json\n([\s\S]*?)\n```/);
                if (match) {
                    try {
                        const json = JSON.parse(match[1]);
                        if (json.phrase) {
                            if (mounted) setPhrase(String(json.phrase));
                        } else {
                            if (mounted) setError('Phrase not found in webhook response');
                        }
                    } catch {
                        if (mounted) setError('Failed to parse webhook JSON');
                    }
                } else {
                    if (mounted) setError('Webhook response did not contain embedded JSON');
                }
            } catch (err: unknown) {
                const e = err as Error;
                if (mounted) setError(e.message || 'Failed to fetch webhook');
            } finally {
                if (mounted) setLoading(false);
            }
        };

        fetchPhrase();

        return () => {
            mounted = false;
        };
    }, [url]);

    return (
        <Card className="mt-4">
            <CardContent>
                <h3 className="text-sm font-medium text-gray-700">Webhook Phrase</h3>
                {loading ? (
                    <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                        <Loader2 className="h-4 w-4 animate-spin" /> Loading phrase...
                    </div>
                ) : error ? (
                    <div className="mt-2 text-sm text-red-600">{error}</div>
                ) : phrase ? (
                    <div className="mt-2 text-sm text-gray-800">{phrase}</div>
                ) : (
                    <div className="mt-2 text-sm text-gray-500">No phrase available</div>
                )}
            </CardContent>
        </Card>
    );
}
