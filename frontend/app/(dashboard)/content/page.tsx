'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { contentAPI } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Eye, Trash2, RefreshCw, X, Maximize2, Send } from 'lucide-react';
import type { Content } from '@/types';

export default function ContentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [contents, setContents] = useState<Content[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [selectedImage, setSelectedImage] = useState<{ url: string; topic: string; prompt?: string } | null>(null);

  const fetchContents = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = filter !== 'all' ? { status_filter: filter } : {};
      const response = await contentAPI.list(params);
      console.log('Fetched contents:', response.data);
      response.data.forEach((content: Content, index: number) => {
        console.log(`Content ${index + 1}:`, {
          id: content.id,
          topic: content.topic,
          image_url: content.image_url,
          has_image: !!content.image_url
        });
      });
      setContents(response.data);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to fetch content',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [filter, toast]);

  useEffect(() => {
    fetchContents();
  }, [fetchContents]);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this content?')) return;

    try {
      await contentAPI.delete(id);
      setContents(contents.filter((c) => c.id !== id));
      toast({
        title: 'Content deleted',
        description: 'The content has been deleted successfully',
      });
    } catch {
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-indigo-900 to-purple-900 bg-clip-text text-transparent">
            Content Library
          </h1>
          <p className="text-slate-600 mt-2 text-lg">Manage your AI-generated content</p>
        </div>
        <Button
          onClick={() => router.push('/dashboard/content/create')}
          size="lg"
          className="h-12 px-6 text-base font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] rounded-xl hover:-translate-y-0.5 group"
        >
          <Plus className="mr-2 h-5 w-5 transition-transform duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:rotate-90" />
          Create Content
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'draft', 'pending_approval', 'approved', 'published'].map((status) => (
          <Button
            key={status}
            variant={filter === status ? 'default' : 'outline'}
            onClick={() => setFilter(status)}
            size="sm"
            className={`rounded-lg transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-0.5 hover:shadow-md ${filter === status
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 shadow-md scale-105'
              : 'hover:bg-slate-100 hover:border-slate-300'
              }`}
          >
            {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
          </Button>
        ))}
      </div>

      {/* Content List */}
      {isLoading ? (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg mb-4">
            <RefreshCw className="h-8 w-8 animate-spin text-white" />
          </div>
          <p className="text-slate-600 font-medium">Loading your content...</p>
        </div>
      ) : filteredContents.length === 0 ? (
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardContent className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 mb-6">
              <Plus className="h-10 w-10 text-slate-400" />
            </div>
            <p className="text-xl font-semibold text-slate-700 mb-2">No content found</p>
            <p className="text-slate-500 mb-6">Start creating amazing content with AI</p>
            <Button
              onClick={() => router.push('/dashboard/content/create')}
              size="lg"
              className="h-12 px-8 text-base font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] rounded-xl hover:-translate-y-0.5 group"
            >
              <Plus className="mr-2 h-5 w-5 transition-transform duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:rotate-90" />
              Create your first content
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredContents.map((content) => (
            <Card key={content.id} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-2 overflow-hidden group cursor-pointer will-change-transform">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="line-clamp-2 text-lg group-hover:text-indigo-600 transition-colors duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)]">
                    {content.topic}
                  </CardTitle>
                  <Badge className={`${getStatusColor(content.status)} text-white shrink-0 shadow-sm transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:shadow-md group-hover:scale-105 will-change-transform`}>
                    {content.status.replace('_', ' ')}
                  </Badge>
                </div>
                <CardDescription className="flex items-center gap-1 text-sm transition-colors duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:text-slate-700">
                  <span>Created</span>
                  <span className="font-medium">{new Date(content.created_at).toLocaleDateString()}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {content.image_url && (
                  <div
                    className="relative w-full aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 shadow-md group-hover:shadow-xl transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] cursor-pointer will-change-transform"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (content.image_url) {
                        setSelectedImage({
                          url: content.image_url,
                          topic: content.topic,
                          prompt: content.image_prompt
                        });
                      }
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={content.image_url}
                      alt={content.topic}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] will-change-transform"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] flex items-center justify-center">
                      <div className="bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)]">
                        <Maximize2 className="h-5 w-5 text-slate-700" />
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] rounded-lg hover:shadow-md hover:-translate-y-0.5 group/btn will-change-transform"
                    onClick={() => router.push(`/dashboard/content/${content.id}`)}
                  >
                    <Eye className="mr-2 h-4 w-4 transition-transform duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover/btn:scale-110 will-change-transform" />
                    View Details
                  </Button>
                  {content.status === 'approved' && (
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => router.push('/dashboard/posts')}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      View Posts
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(content.id)}
                    className="hover:bg-red-50 hover:text-red-600 transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] rounded-lg hover:shadow-md hover:-translate-y-0.5 group/btn will-change-transform"
                  >
                    <Trash2 className="h-4 w-4 transition-transform duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover/btn:scale-110 group-hover/btn:rotate-12 will-change-transform" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Full Screen Image Modal */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-7xl w-[95vw] h-[95vh] p-0 bg-black/95 border-0 overflow-hidden">
          <div className="relative w-full h-full flex items-center justify-center p-6">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-full w-10 h-10 transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:scale-110 hover:rotate-90"
              onClick={() => setSelectedImage(null)}
            >
              <X className="h-5 w-5" />
            </Button>
            {selectedImage && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={selectedImage.url}
                alt={selectedImage.topic}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in fade-in zoom-in-95 duration-500"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}