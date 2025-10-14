'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { contentAPI } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Eye, Trash2, RefreshCw } from 'lucide-react';
import type { Content } from '@/types';

export default function ContentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [contents, setContents] = useState<Content[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchContents();
  }, [filter]);

  const fetchContents = async () => {
    try {
      setIsLoading(true);
      const params = filter !== 'all' ? { status_filter: filter } : {};
      const response = await contentAPI.list(params);
      setContents(response.data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch content',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this content?')) return;

    try {
      await contentAPI.delete(id);
      setContents(contents.filter((c) => c.id !== id));
      toast({
        title: 'Content deleted',
        description: 'The content has been deleted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete content',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'bg-gray-500',
      pending_approval: 'bg-yellow-500',
      approved: 'bg-green-500',
      rejected: 'bg-red-500',
      published: 'bg-blue-500',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500';
  };

  const filteredContents = contents;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Content Library</h1>
          <p className="text-gray-600 mt-1">Manage your AI-generated content</p>
        </div>
        <Button onClick={() => router.push('/dashboard/content/create')} size="lg">
          <Plus className="mr-2 h-5 w-5" />
          Create Content
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['all', 'draft', 'pending_approval', 'approved', 'published'].map((status) => (
          <Button
            key={status}
            variant={filter === status ? 'default' : 'outline'}
            onClick={() => setFilter(status)}
            size="sm"
          >
            {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
          </Button>
        ))}
      </div>

      {/* Content List */}
      {isLoading ? (
        <div className="text-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
        </div>
      ) : filteredContents.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500">No content found</p>
            <Button onClick={() => router.push('/dashboard/content/create')} className="mt-4">
              Create your first content
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredContents.map((content) => (
            <Card key={content.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="line-clamp-2">{content.topic}</CardTitle>
                  <Badge className={getStatusColor(content.status)}>
                    {content.status.replace('_', ' ')}
                  </Badge>
                </div>
                <CardDescription>
                  Created {new Date(content.created_at).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {content.image_url && (
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden mb-4 bg-gray-100">
                    <img
                      src={content.image_url}
                      alt={content.topic}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => router.push(`/dashboard/content/${content.id}`)}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(content.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}