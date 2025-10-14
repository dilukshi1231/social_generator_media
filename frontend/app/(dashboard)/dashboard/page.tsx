'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { contentAPI, socialAccountsAPI, postsAPI } from '@/lib/api';
import { FileText, Send, Link2, TrendingUp, Plus, Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalContent: 0,
    pendingContent: 0,
    totalPosts: 0,
    connectedAccounts: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [contentRes, postsRes, accountsRes] = await Promise.all([
          contentAPI.list({ limit: 100 }),
          postsAPI.list({ limit: 100 }),
          socialAccountsAPI.list(),
        ]);

        const contents = contentRes.data;
        const pendingContent = contents.filter((c: any) => c.status === 'pending_approval').length;

        setStats({
          totalContent: contents.length,
          pendingContent,
          totalPosts: postsRes.data.length,
          connectedAccounts: accountsRes.data.length,
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statsCards = [
    {
      title: 'Total Content',
      value: stats.totalContent,
      description: `${stats.pendingContent} pending approval`,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Published Posts',
      value: stats.totalPosts,
      description: 'Across all platforms',
      icon: Send,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Connected Accounts',
      value: stats.connectedAccounts,
      description: 'Social media platforms',
      icon: Link2,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Engagement Rate',
      value: '4.2%',
      description: 'Average across platforms',
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Manage your social media content in one place
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/content/create')} size="lg">
          <Plus className="mr-2 h-5 w-5" />
          Create Content
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading
          ? Array(4)
              .fill(0)
              .map((_, i) => (
                <Card key={i}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-10 rounded-full" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-16 mb-2" />
                    <Skeleton className="h-4 w-32" />
                  </CardContent>
                </Card>
              ))
          : statsCards.map((stat) => (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </CardTitle>
                  <div className={`${stat.bgColor} p-2 rounded-full`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stat.value}</div>
                  <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                </CardContent>
              </Card>
            ))}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/dashboard/content/create')}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="bg-indigo-50 p-3 rounded-lg">
                <Sparkles className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <CardTitle>Generate Content</CardTitle>
                <CardDescription>Create AI-powered content</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/dashboard/content')}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 p-3 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle>View Content</CardTitle>
                <CardDescription>Manage your content library</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/dashboard/social-accounts')}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="bg-purple-50 p-3 rounded-lg">
                <Link2 className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <CardTitle>Connect Accounts</CardTitle>
                <CardDescription>Link social media platforms</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Recent Activity Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest content and posts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>No recent activity yet</p>
            <p className="text-sm mt-1">Start by creating your first content!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}