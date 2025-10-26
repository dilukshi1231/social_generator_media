'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { contentAPI } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Eye, Trash2, RefreshCw, X, Send, Facebook, Instagram, Linkedin, Twitter, Image as ImageIcon } from 'lucide-react';
import type { Content } from '@/types';
import PublishDialog from '@/components/content/publish-dialog';

const formatStatus = (status: string) => {
  const t = status.replace('_', ' ');
  return t.charAt(0).toUpperCase() + t.slice(1);
};

export default function ContentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [contents, setContents] = useState<Content[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [selectedImage, setSelectedImage] = useState<{ url: string; topic: string; prompt?: string } | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishContent, setPublishContent] = useState<Content | null>(null);

  const fetchContents = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = filter !== 'all' ? { status_filter: filter } : {};
      const response = await contentAPI.list(params);
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

  const platformIcons = (
    content: Content
  ) => {
    const items = [
      { key: 'facebook', icon: Facebook, active: !!content.facebook_caption, color: 'text-blue-600' },
      { key: 'instagram', icon: Instagram, active: !!content.instagram_caption, color: 'text-pink-600' },
      { key: 'linkedin', icon: Linkedin, active: !!content.linkedin_caption, color: 'text-blue-700' },
      { key: 'twitter', icon: Twitter, active: !!content.twitter_caption, color: 'text-slate-900' },
    ];
    return (
      <div className="flex items-center gap-2">
        {items.map(({ key, icon: Icon, active, color }) => (
          <div
            key={key}
            className={`p-1.5 rounded-md ${active ? 'bg-white shadow-sm' : 'opacity-40'}`}
            title={key}
          >
            <Icon className={`h-4 w-4 ${active ? color : 'text-slate-500'}`} />
          </div>
        ))}
      </div>
    );
  };

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
            <Card key={content.id} className="border border-slate-200/60 shadow-sm bg-white hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden group">
              {content.image_url ? (
                <div
                  className="relative w-full aspect-video overflow-hidden bg-slate-100 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImage({ url: content.image_url!, topic: content.topic, prompt: content.image_prompt });
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={content.image_url} alt={content.topic} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute top-3 left-3">
                    <Badge className={`${getStatusColor(content.status)} text-white shadow`}>{formatStatus(content.status)}</Badge>
                  </div>
                </div>
              ) : (
                <div className="w-full aspect-video bg-slate-50 border-b border-slate-100 flex items-center justify-center">
                  <div className="flex items-center gap-2 text-slate-500"><ImageIcon className="h-5 w-5" /> No image</div>
                </div>
              )}
              <CardHeader className="pb-2">
                <CardTitle className="line-clamp-2 text-base group-hover:text-indigo-700 transition-colors">{content.topic}</CardTitle>
                <CardDescription className="flex items-center justify-between">
                  <span>Created <span className="font-medium">{new Date(content.created_at).toLocaleDateString()}</span></span>
                  {platformIcons(content)}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 hover:border-indigo-300 hover:text-indigo-700"
                    onClick={() => router.push(`/dashboard/content/${content.id}`)}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Details
                  </Button>
                  {content.status === 'approved' && (
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => { setPublishContent(content); setPublishOpen(true); }}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Publish
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(content.id)}
                    className="hover:bg-red-50 hover:text-red-600"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
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
      {/* Publish Dialog */}
      {publishContent ? (
        <PublishDialog open={publishOpen} onOpenChange={(o) => setPublishOpen(o)} content={publishContent} />
      ) : null}
    </div>
  );
}