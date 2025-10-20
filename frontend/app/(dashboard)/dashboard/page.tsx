'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { contentAPI, socialAccountsAPI, postsAPI } from '@/lib/api';
import {
  FileText,
  Send,
  Link2,
  TrendingUp,
  Plus,
  Sparkles,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Clock,
  BarChart3
} from 'lucide-react';
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
        const pendingContent = contents.filter((c: { status: string }) => c.status === 'pending_approval').length;

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
      change: '+12%',
      changeType: 'increase',
      description: `${stats.pendingContent} pending approval`,
      icon: FileText,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-100',
    },
    {
      title: 'Published Posts',
      value: stats.totalPosts,
      change: '+8%',
      changeType: 'increase',
      description: 'Across all platforms',
      icon: Send,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-100',
    },
    {
      title: 'Connected Accounts',
      value: stats.connectedAccounts,
      change: stats.connectedAccounts > 0 ? 'Active' : 'Connect now',
      changeType: stats.connectedAccounts > 0 ? 'neutral' : 'neutral',
      description: 'Social media platforms',
      icon: Link2,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-100',
    },
    {
      title: 'Engagement Rate',
      value: '4.2%',
      change: '+2.1%',
      changeType: 'increase',
      description: 'Average across platforms',
      icon: TrendingUp,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-100',
    },
  ];

  const quickActions = [
    {
      title: 'Generate Content',
      description: 'Create AI-powered content for all platforms',
      icon: Sparkles,
      color: 'text-indigo-600',
      bgColor: 'bg-gradient-to-br from-indigo-50 to-indigo-100',
      borderColor: 'border-indigo-200',
      href: '/dashboard/content/create',
      badge: 'Popular',
      badgeColor: 'bg-indigo-600',
    },
    {
      title: 'Content Library',
      description: 'View and manage your content',
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-gradient-to-br from-blue-50 to-blue-100',
      borderColor: 'border-blue-200',
      href: '/dashboard/content',
      badge: null,
      badgeColor: '',
    },
    {
      title: 'Schedule Posts',
      description: 'Plan your content calendar',
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-gradient-to-br from-purple-50 to-purple-100',
      borderColor: 'border-purple-200',
      href: '/dashboard/posts',
      badge: null,
      badgeColor: '',
    },
    {
      title: 'Analytics',
      description: 'Track performance metrics',
      icon: BarChart3,
      color: 'text-emerald-600',
      bgColor: 'bg-gradient-to-br from-emerald-50 to-emerald-100',
      borderColor: 'border-emerald-200',
      href: '/dashboard/analytics',
      badge: null,
      badgeColor: '',
    },
    {
      title: 'Social Accounts',
      description: 'Connect and manage platforms',
      icon: Link2,
      color: 'text-pink-600',
      bgColor: 'bg-gradient-to-br from-pink-50 to-pink-100',
      borderColor: 'border-pink-200',
      href: '/dashboard/social-accounts',
      badge: null,
      badgeColor: '',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-gray-600 mt-2 text-base">
            Welcome back! Here&apos;s what&apos;s happening with your content today.
          </p>
        </div>
        <Button
          onClick={() => router.push('/dashboard/content/create')}
          size="lg"
          className="bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-0.5 group"
        >
          <Plus className="mr-2 h-5 w-5 transition-transform duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:rotate-90" />
          Create Content
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading
          ? Array(4)
            .fill(0)
            .map((_, i) => (
              <Card key={i} className="border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-10 rounded-lg" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </CardContent>
              </Card>
            ))
          : statsCards.map((stat) => (
            <Card
              key={stat.title}
              className={`border-2 ${stat.borderColor} hover:shadow-2xl transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-2 cursor-pointer group will-change-transform`}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0">
                <CardTitle className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)]">
                  {stat.title}
                </CardTitle>
                <div className={`${stat.bgColor} p-2.5 rounded-lg transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-110 group-hover:shadow-lg will-change-transform`}>
                  <stat.icon className={`h-5 w-5 ${stat.color} transition-transform duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:rotate-12 will-change-transform`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900 mb-2 transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-105 will-change-transform">{stat.value}</div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-105 will-change-transform ${stat.changeType === 'increase'
                    ? 'bg-emerald-100 text-emerald-700 group-hover:bg-emerald-200'
                    : 'bg-gray-100 text-gray-700 group-hover:bg-gray-200'
                    }`}>
                    {stat.change}
                  </span>
                  <p className="text-xs text-gray-500 transition-colors duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:text-gray-700">{stat.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>

      {/* Quick Actions Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {quickActions.map((action) => (
            <Card
              key={action.title}
              className={`border-2 ${action.borderColor} hover:shadow-xl transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-2 cursor-pointer group relative overflow-hidden`}
              onClick={() => router.push(action.href)}
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-white/50 to-transparent rounded-bl-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)]"></div>
              <CardHeader className="pb-3">
                {action.badge && (
                  <span className={`absolute top-3 right-3 text-[10px] font-bold text-white ${action.badgeColor} px-2 py-0.5 rounded-full uppercase tracking-wider transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-110`}>
                    {action.badge}
                  </span>
                )}
                <div className={`${action.bgColor} w-12 h-12 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 group-hover:rotate-3 transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:shadow-md`}>
                  <action.icon className={`h-6 w-6 ${action.color} transition-transform duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-110`} />
                </div>
                <CardTitle className="text-base font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)]">
                  {action.title}
                </CardTitle>
                <CardDescription className="text-xs text-gray-600 mt-1 transition-colors duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:text-gray-700">
                  {action.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>

      {/* Content Overview Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card className="border-2 border-gray-200 hover:shadow-lg transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)]">
          <CardHeader className="border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-gray-900">Recent Activity</CardTitle>
                <CardDescription className="mt-1">Your latest content updates</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard/content')}
                className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] group"
              >
                View all
                <ArrowUpRight className="ml-1 h-4 w-4 transition-transform duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {stats.totalContent === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-900 font-medium mb-1">No content yet</p>
                <p className="text-sm text-gray-500 mb-4">Start by creating your first content!</p>
                <Button
                  onClick={() => router.push('/dashboard/content/create')}
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-0.5 hover:shadow-md group"
                >
                  <Plus className="mr-2 h-4 w-4 transition-transform duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:rotate-90" />
                  Create Content
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] cursor-pointer group hover:shadow-sm hover:-translate-y-0.5">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0 transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-110 group-hover:shadow-md">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 transition-transform duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:rotate-12" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">Content approved</p>
                    <p className="text-xs text-gray-500 mt-0.5">Social media post created successfully</p>
                    <span className="text-xs text-gray-400 mt-1 inline-block">2 hours ago</span>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] cursor-pointer group hover:shadow-sm hover:-translate-y-0.5">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center shrink-0 transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-110 group-hover:shadow-md">
                    <Clock className="h-5 w-5 text-amber-600 transition-transform duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:rotate-12" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">Pending approval</p>
                    <p className="text-xs text-gray-500 mt-0.5">{stats.pendingContent} items waiting for review</p>
                    <span className="text-xs text-gray-400 mt-1 inline-block">5 hours ago</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Getting Started */}
        <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-white hover:shadow-lg transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-1">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-indigo-600 transition-transform duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:rotate-12" />
              <CardTitle className="text-lg font-bold text-gray-900">Getting Started</CardTitle>
            </div>
            <CardDescription>Complete these steps to get the most out of Social Gen AI</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-indigo-100 hover:border-indigo-200 hover:shadow-sm transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-0.5 cursor-pointer group">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-110 ${stats.connectedAccounts > 0 ? 'bg-emerald-500' : 'bg-gray-300'
                  }`}>
                  {stats.connectedAccounts > 0 ? (
                    <CheckCircle2 className="h-4 w-4 text-white transition-transform duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:rotate-12" />
                  ) : (
                    <span className="text-xs font-bold text-white">1</span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Connect social accounts</p>
                  <p className="text-xs text-gray-500">Link your platforms</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-indigo-100 hover:border-indigo-200 hover:shadow-sm transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-0.5 cursor-pointer group">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-110 ${stats.totalContent > 0 ? 'bg-emerald-500' : 'bg-gray-300'
                  }`}>
                  {stats.totalContent > 0 ? (
                    <CheckCircle2 className="h-4 w-4 text-white transition-transform duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:rotate-12" />
                  ) : (
                    <span className="text-xs font-bold text-white">2</span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Create your first content</p>
                  <p className="text-xs text-gray-500">Use AI to generate posts</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-indigo-100 hover:border-indigo-200 hover:shadow-sm transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-0.5 cursor-pointer group">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-110 ${stats.totalPosts > 0 ? 'bg-emerald-500' : 'bg-gray-300'
                  }`}>
                  {stats.totalPosts > 0 ? (
                    <CheckCircle2 className="h-4 w-4 text-white transition-transform duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:rotate-12" />
                  ) : (
                    <span className="text-xs font-bold text-white">3</span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Publish content</p>
                  <p className="text-xs text-gray-500">Share across platforms</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}