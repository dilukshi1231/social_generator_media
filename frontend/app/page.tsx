'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Zap, Target, TrendingUp, ArrowRight, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('access_token');
    if (token) {
      router.push('/dashboard');
    }
  }, [router]);

  const features = [
    {
      icon: Sparkles,
      title: 'AI Content Generation',
      description: 'Generate platform-specific captions and images with advanced AI',
    },
    {
      icon: Zap,
      title: 'Multi-Platform Publishing',
      description: 'Post to Facebook, Instagram, LinkedIn, Twitter, and more simultaneously',
    },
    {
      icon: Target,
      title: 'Smart Scheduling',
      description: 'Schedule posts and let AI handle the rest automatically',
    },
    {
      icon: TrendingUp,
      title: 'Analytics & Insights',
      description: 'Track performance and optimize your content strategy',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-indigo-600" />
              <span className="text-xl font-bold text-gray-900">Social Auto</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost">Log in</Button>
              </Link>
              <Link href="/register">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium mb-8">
            <Sparkles className="h-4 w-4" />
            AI-Powered Social Media Automation
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Create & Publish Content
            <br />
            <span className="text-indigo-600">10x Faster</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Generate AI-powered social media content and publish across multiple platforms in minutes, not hours.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="text-lg px-8">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Watch Demo
              </Button>
            </Link>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            No credit card required • 14-day free trial
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-20">
          {features.map((feature, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="bg-indigo-50 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Three simple steps to automate your social media
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-indigo-600">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Enter Your Topic</h3>
              <p className="text-gray-600">
                Simply describe what you want to post about, and our AI will do the rest
              </p>
            </div>

            <div className="text-center">
              <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-indigo-600">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Review & Approve</h3>
              <p className="text-gray-600">
                AI generates platform-specific content and images. Review and approve before publishing
              </p>
            </div>

            <div className="text-center">
              <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-indigo-600">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Publish Everywhere</h3>
              <p className="text-gray-600">
                Post to all your social accounts with one click or schedule for later
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Save 10+ Hours Per Week
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Stop wasting time creating content for each platform individually. Our AI does it all for you.
              </p>
              <ul className="space-y-4">
                {[
                  'Generate content for 6+ platforms in seconds',
                  'AI-powered captions optimized for each platform',
                  'Automatic image generation',
                  'Schedule and forget with smart automation',
                  'Track performance with built-in analytics',
                ].map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-4">Supported Platforms</h3>
              <div className="grid grid-cols-2 gap-4">
                {['Facebook', 'Instagram', 'LinkedIn', 'Twitter/X', 'Threads', 'TikTok'].map((platform) => (
                  <div key={platform} className="bg-white/20 backdrop-blur-sm rounded-lg p-4 text-center">
                    <p className="font-semibold">{platform}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-indigo-600 py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Transform Your Social Media?
          </h2>
          <p className="text-xl text-indigo-100 mb-8">
            Join thousands of businesses automating their social media with AI
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary" className="text-lg px-8">
              Start Your Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-indigo-400" />
              <span className="text-white font-bold">Social Auto</span>
            </div>
            <p className="text-sm">
              © 2025 Social Media Automation. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}