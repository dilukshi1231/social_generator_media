'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FileText,
  Send,
  Link2,
  BarChart3,
  Settings,
  Sparkles,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Content', href: '/dashboard/content', icon: FileText },
  { name: 'Posts', href: '/dashboard/posts', icon: Send },
  { name: 'Social Accounts', href: '/dashboard/social-accounts', icon: Link2 },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white border-r border-gray-200 px-6 pb-4">
          {/* Logo */}
          <div className="flex h-20 shrink-0 items-center gap-3 border-b border-gray-200 transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-indigo-200">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 shadow-lg transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:scale-110 hover:shadow-xl hover:rotate-3">
              <Sparkles className="h-6 w-6 text-white transition-transform duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:rotate-12" />
            </div>
            <div>
              <span className="text-xl font-bold text-gray-900 transition-colors duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:text-indigo-600">
                Social Gen
              </span>
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wider">
                  AI Powered
                </span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="space-y-1">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className={cn(
                            'group flex gap-x-3 rounded-lg p-3 text-sm leading-6 font-semibold transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-x-1',
                            isActive
                              ? 'bg-indigo-600 text-white shadow-md scale-105'
                              : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50 hover:shadow-sm'
                          )}
                        >
                          <item.icon
                            className={cn(
                              'h-5 w-5 shrink-0 transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)]',
                              isActive ? 'text-white scale-110' : 'text-gray-400 group-hover:text-indigo-600 group-hover:scale-110 group-hover:rotate-12'
                            )}
                            aria-hidden="true"
                          />
                          <span className="transition-transform duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)]">{item.name}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>

              {/* Bottom accent */}
              <li className="mt-auto">
                <div className="rounded-lg bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 border border-indigo-200 transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:shadow-md hover:scale-105 hover:from-indigo-100 hover:to-indigo-150 cursor-pointer">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-indigo-600 transition-transform duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:rotate-12" />
                    <span className="text-xs font-semibold text-indigo-900">Pro Tip</span>
                  </div>
                  <p className="text-xs text-indigo-700 leading-relaxed">
                    Generate content for all social platforms with a single click!
                  </p>
                </div>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Mobile sidebar - TODO: Add mobile menu */}
    </>
  );
}