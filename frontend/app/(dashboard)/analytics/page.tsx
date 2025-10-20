'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Users, Heart, MessageSquare, Share2, Eye } from 'lucide-react';

export default function AnalyticsPage() {
  // Placeholder data - integrate with your analytics API
  const metrics = [
    {
      title: 'Total Impressions',
      value: '12,543',
      change: '+12.5%',
      icon: Eye,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Engagement Rate',
      value: '4.2%',
      change: '+2.1%',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Total Likes',
      value: '8,234',
      change: '+18.3%',
      icon: Heart,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      title: 'Comments',
      value: '1,432',
      change: '+7.2%',
      icon: MessageSquare,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Shares',
      value: '567',
      change: '+15.4%',
      icon: Share2,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Followers Growth',
      value: '+234',
      change: '+9.8%',
      icon: Users,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-1">Track your social media performance</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric) => (
          <Card
            key={metric.title}
            className="hover:shadow-xl transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-2 cursor-pointer group"
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 transition-colors duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:text-gray-900">
                {metric.title}
              </CardTitle>
              <div className={`${metric.bgColor} p-2 rounded-full transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-110 group-hover:shadow-md`}>
                <metric.icon className={`h-5 w-5 ${metric.color} transition-transform duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:rotate-12`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-105">{metric.value}</div>
              <p className="text-xs text-green-600 mt-1 transition-colors duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:text-green-700">
                {metric.change} from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Coming Soon Notice */}
      <Card className="hover:shadow-lg transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)]">
        <CardHeader>
          <CardTitle>Detailed Analytics</CardTitle>
          <CardDescription>
            Advanced analytics and insights are coming soon
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <TrendingUp className="h-12 w-12 mx-auto text-gray-400 mb-4 transition-transform duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:scale-110 hover:rotate-12" />
            <p className="text-gray-500">
              Detailed charts, graphs, and performance insights will be available here
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Track engagement, reach, and audience growth across all platforms
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}