'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      const response = await postsAPI.list();
      setPosts(response.data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch posts',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = async (postId: number) => {
    try {
      await postsAPI.retry(postId);
      toast({
        title: 'Post retrying',
        description: 'The post is being retried',
      });
      fetchPosts();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to retry post',
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
          <p className="text-gray-600 mt-1">Track your published and scheduled posts</p>
        </div>
        <Button onClick={fetchPosts} size="lg" variant="outline">
          <RefreshCw className="mr-2 h-5 w-5" />
          Refresh
        </Button>
      </div>

      {/* Posts List */}
      {isLoading ? (
        <div className="text-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
        </div>
      ) : posts.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500">No posts found</p>
            <p className="text-sm text-gray-400 mt-2">Create and approve content to start posting</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <Card key={post.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(post.status)}
                      <CardTitle className="capitalize">{post.platform}</CardTitle>
                      <Badge className={getStatusColor(post.status)}>
                        {post.status}
                      </Badge>
                    </div>
                    <CardDescription className="mt-2 line-clamp-2">
                      {post.caption}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    {post.posted_at ? (
                      <span>Posted {new Date(post.posted_at).toLocaleString()}</span>
                    ) : post.scheduled_for ? (
                      <span>Scheduled for {new Date(post.scheduled_for).toLocaleString()}</span>
                    ) : (
                      <span>Created {new Date(post.created_at).toLocaleString()}</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {post.platform_post_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(post.platform_post_url, '_blank')}
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View Post
                      </Button>
                    )}
                    {post.status === 'failed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRetry(post.id)}
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Retry
                      </Button>
                    )}
                  </div>
                </div>
                {post.error_message && (
                  <div className="mt-3 p-3 bg-red-50 rounded-lg">
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