'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { postsAPI } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import {
    RefreshCw,
    ExternalLink,
    AlertCircle,
    CheckCircle,
    Clock,
    Trash2,
    Search,
    Filter,
    Facebook,
    Instagram,
    Linkedin,
    Twitter,
    Share2,
    Calendar,
    TrendingUp,
    XCircle
} from 'lucide-react';
import type { Post, PlatformType } from '@/types';

export default function PostsPage() {
    const { toast } = useToast();
    const [posts, setPosts] = useState<Post[]>([]);
    const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [platformFilter, setPlatformFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [deletingPost, setDeletingPost] = useState<number | null>(null);

    const fetchPosts = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await postsAPI.list();
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
    }, [toast]);

    useEffect(() => {
        fetchPosts();
        // Set up polling for active posts
        const interval = setInterval(() => {
            fetchPosts();
        }, 10000); // Poll every 10 seconds

        return () => clearInterval(interval);
    }, [fetchPosts]);

    // Filter posts based on status, platform, and search
    useEffect(() => {
        let filtered = posts;

        // Filter by status
        if (statusFilter !== 'all') {
            filtered = filtered.filter(post => post.status === statusFilter);
        }

        // Filter by platform
        if (platformFilter !== 'all') {
            filtered = filtered.filter(post => post.platform === platformFilter);
        }

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(post =>
                post.caption.toLowerCase().includes(query) ||
                post.platform.toLowerCase().includes(query)
            );
        }

        setFilteredPosts(filtered);
    }, [posts, statusFilter, platformFilter, searchQuery]);

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

    const handleDelete = async (postId: number) => {
        if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
            return;
        }

        try {
            setDeletingPost(postId);
            await postsAPI.delete(postId);
            toast({
                title: 'Post deleted',
                description: 'The post has been removed successfully',
            });
            setPosts(posts.filter(p => p.id !== postId));
        } catch (error) {
            const errorMessage = error instanceof Error && 'response' in error
                ? (error as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Failed to delete post'
                : 'Failed to delete post';
            toast({
                title: 'Delete failed',
                description: errorMessage,
                variant: 'destructive',
            });
        } finally {
            setDeletingPost(null);
        }
    };

    const getPlatformIcon = (platform: PlatformType) => {
        const icons = {
            facebook: Facebook,
            instagram: Instagram,
            linkedin: Linkedin,
            twitter: Twitter,
            tiktok: Share2,
        };
        return icons[platform] || Share2;
    };

    const getPlatformColor = (platform: PlatformType) => {
        const colors = {
            facebook: 'text-blue-600 bg-blue-50 border-blue-200',
            instagram: 'text-pink-600 bg-pink-50 border-pink-200',
            linkedin: 'text-blue-700 bg-blue-50 border-blue-300',
            twitter: 'text-black bg-gray-50 border-gray-200',
            tiktok: 'text-gray-900 bg-gray-50 border-gray-300',
        };
        return colors[platform] || 'text-gray-600 bg-gray-50 border-gray-200';
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'published':
                return <CheckCircle className="h-5 w-5 text-green-600" />;
            case 'failed':
                return <XCircle className="h-5 w-5 text-red-600" />;
            case 'posting':
                return <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />;
            case 'scheduled':
                return <Clock className="h-5 w-5 text-yellow-600" />;
            default:
                return <Clock className="h-5 w-5 text-gray-600" />;
        }
    };

    const getStatusColor = (status: string) => {
        const colors = {
            scheduled: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            posting: 'bg-blue-100 text-blue-800 border-blue-200',
            published: 'bg-green-100 text-green-800 border-green-200',
            failed: 'bg-red-100 text-red-800 border-red-200',
        };
        return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    const stats = {
        total: posts.length,
        published: posts.filter(p => p.status === 'published').length,
        scheduled: posts.filter(p => p.status === 'scheduled').length,
        failed: posts.filter(p => p.status === 'failed').length,
        posting: posts.filter(p => p.status === 'posting').length,
    };

    const platformStats = {
        facebook: posts.filter(p => p.platform === 'facebook').length,
        instagram: posts.filter(p => p.platform === 'instagram').length,
        linkedin: posts.filter(p => p.platform === 'linkedin').length,
        twitter: posts.filter(p => p.platform === 'twitter').length,
        tiktok: posts.filter(p => p.platform === 'tiktok').length,
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-indigo-900 to-purple-900 bg-clip-text text-transparent">
                        Published Posts
                    </h1>
                    <p className="text-slate-600 mt-2 text-lg">
                        Track, manage, and analyze your social media posts
                    </p>
                </div>
                <Button
                    onClick={fetchPosts}
                    size="lg"
                    variant="outline"
                    className="shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 group border-2"
                >
                    <RefreshCw className="mr-2 h-5 w-5 transition-transform duration-300 group-hover:rotate-180" />
                    Refresh
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
                <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-slate-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            Total Posts
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-slate-900">{stats.total}</div>
                        <p className="text-xs text-slate-500 mt-1">All time</p>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold text-green-700 flex items-center gap-2">
                            <CheckCircle className="h-4 w-4" />
                            Published
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-green-700">{stats.published}</div>
                        <p className="text-xs text-green-600 mt-1">Successfully posted</p>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-yellow-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold text-yellow-700 flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Scheduled
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-yellow-700">{stats.scheduled}</div>
                        <p className="text-xs text-yellow-600 mt-1">Waiting to post</p>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold text-blue-700 flex items-center gap-2">
                            <RefreshCw className="h-4 w-4" />
                            Posting
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-blue-700">{stats.posting}</div>
                        <p className="text-xs text-blue-600 mt-1">In progress</p>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-red-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold text-red-700 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            Failed
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-red-700">{stats.failed}</div>
                        <p className="text-xs text-red-600 mt-1">Need attention</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters and Search */}
            <Card className="border-0 shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Filters & Search
                    </CardTitle>
                    <CardDescription>Filter posts by status, platform, or search by caption</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search posts..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 border-2 focus:border-indigo-500 transition-colors"
                            />
                        </div>

                        {/* Status Filter */}
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="border-2 focus:border-indigo-500">
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="published">Published</SelectItem>
                                <SelectItem value="scheduled">Scheduled</SelectItem>
                                <SelectItem value="posting">Posting</SelectItem>
                                <SelectItem value="failed">Failed</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Platform Filter */}
                        <Select value={platformFilter} onValueChange={setPlatformFilter}>
                            <SelectTrigger className="border-2 focus:border-indigo-500">
                                <SelectValue placeholder="Filter by platform" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Platforms</SelectItem>
                                <SelectItem value="facebook">Facebook ({platformStats.facebook})</SelectItem>
                                <SelectItem value="instagram">Instagram ({platformStats.instagram})</SelectItem>
                                <SelectItem value="linkedin">LinkedIn ({platformStats.linkedin})</SelectItem>
                                <SelectItem value="twitter">Twitter ({platformStats.twitter})</SelectItem>
                                <SelectItem value="tiktok">TikTok ({platformStats.tiktok})</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Active Filters Display */}
                    {(statusFilter !== 'all' || platformFilter !== 'all' || searchQuery.trim()) && (
                        <div className="mt-4 flex flex-wrap gap-2">
                            <span className="text-sm text-slate-600">Active filters:</span>
                            {statusFilter !== 'all' && (
                                <Badge variant="secondary" className="cursor-pointer" onClick={() => setStatusFilter('all')}>
                                    Status: {statusFilter} ×
                                </Badge>
                            )}
                            {platformFilter !== 'all' && (
                                <Badge variant="secondary" className="cursor-pointer" onClick={() => setPlatformFilter('all')}>
                                    Platform: {platformFilter} ×
                                </Badge>
                            )}
                            {searchQuery.trim() && (
                                <Badge variant="secondary" className="cursor-pointer" onClick={() => setSearchQuery('')}>
                                    Search: &quot;{searchQuery}&quot; ×
                                </Badge>
                            )}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setStatusFilter('all');
                                    setPlatformFilter('all');
                                    setSearchQuery('');
                                }}
                                className="h-6 text-xs"
                            >
                                Clear all
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Posts List */}
            {isLoading ? (
                <div className="text-center py-12">
                    <RefreshCw className="h-12 w-12 animate-spin mx-auto text-indigo-600" />
                    <p className="mt-4 text-slate-600">Loading posts...</p>
                </div>
            ) : filteredPosts.length === 0 ? (
                <Card className="border-0 shadow-lg">
                    <CardContent className="text-center py-16">
                        <div className="p-4 bg-slate-100 rounded-full w-fit mx-auto mb-4">
                            <Share2 className="h-12 w-12 text-slate-400" />
                        </div>
                        <p className="text-slate-900 text-xl font-semibold">No posts found</p>
                        <p className="text-sm text-slate-600 mt-2">
                            {posts.length === 0
                                ? 'Create and approve content to start posting'
                                : 'Try adjusting your filters or search query'}
                        </p>
                        {(statusFilter !== 'all' || platformFilter !== 'all' || searchQuery.trim()) && (
                            <Button
                                variant="outline"
                                className="mt-4"
                                onClick={() => {
                                    setStatusFilter('all');
                                    setPlatformFilter('all');
                                    setSearchQuery('');
                                }}
                            >
                                Clear Filters
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    <div className="text-sm text-slate-600 mb-2">
                        Showing {filteredPosts.length} of {posts.length} posts
                    </div>
                    {filteredPosts.map((post) => {
                        const PlatformIcon = getPlatformIcon(post.platform);

                        return (
                            <Card key={post.id} className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group overflow-hidden">
                                <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-3 rounded-xl border-2 ${getPlatformColor(post.platform)} transition-transform duration-300 group-hover:scale-110`}>
                                                <PlatformIcon className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <CardTitle className="capitalize text-lg">{post.platform}</CardTitle>
                                                    <Badge className={`border ${getStatusColor(post.status)} font-medium`}>
                                                        <span className="flex items-center gap-1">
                                                            {getStatusIcon(post.status)}
                                                            {post.status}
                                                        </span>
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                                    <Calendar className="h-4 w-4" />
                                                    {post.posted_at ? (
                                                        <span>Posted {new Date(post.posted_at).toLocaleString()}</span>
                                                    ) : post.scheduled_for ? (
                                                        <span>Scheduled for {new Date(post.scheduled_for).toLocaleString()}</span>
                                                    ) : (
                                                        <span>Created {new Date(post.created_at).toLocaleString()}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {/* Caption Preview */}
                                    <div className="mb-4 p-4 bg-slate-50 rounded-lg border-2 border-slate-100">
                                        <p className="text-sm text-slate-700 line-clamp-3 leading-relaxed">
                                            {post.caption}
                                        </p>
                                    </div>

                                    {/* Platform Post ID */}
                                    {post.platform_post_id && (
                                        <div className="mb-4 text-xs text-slate-500 font-mono bg-slate-100 px-3 py-2 rounded">
                                            Post ID: {post.platform_post_id}
                                        </div>
                                    )}

                                    {/* Error Message */}
                                    {post.error_message && (
                                        <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                                            <div className="flex items-start gap-2">
                                                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="text-sm font-semibold text-red-900">Error:</p>
                                                    <p className="text-sm text-red-800 mt-1">{post.error_message}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex gap-2 flex-wrap">
                                        {post.platform_post_url && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => window.open(post.platform_post_url, '_blank')}
                                                className="shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 group/button border-2"
                                            >
                                                <ExternalLink className="mr-2 h-4 w-4 transition-transform duration-300 group-hover/button:scale-110" />
                                                View on {post.platform}
                                            </Button>
                                        )}
                                        {post.status === 'failed' && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleRetry(post.id)}
                                                className="shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 group/button border-2 border-blue-200 hover:bg-blue-50"
                                            >
                                                <RefreshCw className="mr-2 h-4 w-4 transition-transform duration-300 group-hover/button:rotate-180" />
                                                Retry Post
                                            </Button>
                                        )}
                                        {post.status !== 'published' && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDelete(post.id)}
                                                disabled={deletingPost === post.id}
                                                className="shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 group/button border-2 border-red-200 hover:bg-red-50 text-red-600 hover:text-red-700"
                                            >
                                                {deletingPost === post.id ? (
                                                    <>
                                                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                                        Deleting...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Trash2 className="mr-2 h-4 w-4 transition-transform duration-300 group-hover/button:scale-110" />
                                                        Delete
                                                    </>
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}