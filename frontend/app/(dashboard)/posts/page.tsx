'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { postsAPI } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { RefreshCw, ExternalLink, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import type { Post } from '@/types';

export default function PostsPage() {
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  const fetchPosts = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = filter !== 'all' ? { status_filter: filter } : {};
      const response = await postsAPI.list(params);
      setPosts(response.data);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to fetch posts',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [filter, toast]);

  useEffect(() => {
    fetchPosts();
    // Set up polling for active posts
    const interval = setInterval(() => {
      fetchPosts();
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(interval);
  }, [fetchPosts]);

  const handleRetry = async (postId: number) => {
    try {
      await postsAPI.retry(postId);
      toast({
        title: 'Post retrying',
        description: 'The post is being retried',
      });
      fetchPosts();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to retry post',
        variant: 'destructive',
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'posting':
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'scheduled':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      scheduled: 'bg-yellow-500',
      posting: 'bg-blue-500',
      published: 'bg-green-500',
      failed: 'bg-red-500',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Posts</h1>
          <p className="text-gray-900 mt-1">Track your published and scheduled posts</p>
        </div>
        <Button onClick={fetchPosts} size="lg" variant="outline" className="transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-0.5 hover:shadow-md group">
          <RefreshCw className="mr-2 h-5 w-5 transition-transform duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:rotate-180" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['all', 'scheduled', 'posting', 'published', 'failed'].map((status) => (
          <Button
            key={status}
            variant={filter === status ? 'default' : 'outline'}
            onClick={() => setFilter(status)}
            size="sm"
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Button>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-900">Total Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{posts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-900">Published</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {posts.filter(p => p.status === 'published').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-900">Scheduled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {posts.filter(p => p.status === 'scheduled').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-900">Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {posts.filter(p => p.status === 'failed').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Posts List */}
      {isLoading ? (
        <div className="text-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
        </div>
      ) : posts.length === 0 ? (
        <Card className="hover:shadow-lg transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)]">
          <CardContent className="text-center py-12">
            <p className="text-gray-900 text-lg font-medium">No posts found</p>
            <p className="text-sm text-gray-700 mt-2">Create and approve content to start posting</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <Card key={post.id} className="hover:shadow-xl transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-1 group">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(post.status)}
                      <CardTitle className="capitalize transition-colors duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:text-indigo-600">{post.platform}</CardTitle>
                      <Badge className={`${getStatusColor(post.status)} transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-105`}>
                        {post.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-gray-900">
                    {post.posted_at ? (
                      <span>Posted {new Date(post.posted_at).toLocaleString()}</span>
                    ) : post.scheduled_for ? (
                      <span>Scheduled for {new Date(post.scheduled_for).toLocaleString()}</span>
                    ) : (
                      <span>Created {new Date(post.created_at).toLocaleString()}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {post.platform_post_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(post.platform_post_url, '_blank')}
                      className="transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-0.5 hover:shadow-md group/button"
                    >
                      <ExternalLink className="mr-2 h-4 w-4 transition-transform duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover/button:scale-110" />
                      View Post
                    </Button>
                  )}
                  {post.status === 'failed' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRetry(post.id)}
                      className="transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-0.5 hover:shadow-md group/button"
                    >
                      <RefreshCw className="mr-2 h-4 w-4 transition-transform duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover/button:rotate-180" />
                      Retry
                    </Button>
                  )}
                </div>
                {post.error_message && (
                  <div className="mt-3 p-3 bg-red-50 rounded-lg transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-red-100">
                    <p className="text-sm text-red-800">{post.error_message}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}