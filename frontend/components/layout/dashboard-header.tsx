'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuthStore } from '@/lib/store';
import { LogOut, Settings } from 'lucide-react';
import type { User as UserType } from '@/types';

interface DashboardHeaderProps {
  user: UserType;
}

export default function DashboardHeader({ user }: DashboardHeaderProps) {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const getInitials = (name?: string) => {
    if (!name) return user.username.substring(0, 2).toUpperCase();
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)]">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-x-4">
          <div>
            <h1 className="text-lg font-semibold text-gray-900 transition-colors duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)]">
              Welcome back, <span className="text-indigo-600 hover:text-indigo-700 transition-colors duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)]">
                {user.full_name || user.username}
              </span>!
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">Let&apos;s create amazing content today</p>
          </div>
        </div>

        <div className="flex items-center gap-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:ring-2 hover:ring-indigo-100 transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:scale-110">
                <Avatar className="h-10 w-10 ring-2 ring-white transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)]">
                  <AvatarFallback className="bg-gradient-to-br from-indigo-600 to-indigo-700 text-white font-semibold text-sm">
                    {getInitials(user.full_name)}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white animate-pulse"></span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-72" align="end" sideOffset={8}>
              <DropdownMenuLabel className="font-normal">
                <div className="flex items-center gap-3 p-2">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-gradient-to-br from-indigo-600 to-indigo-700 text-white font-semibold">
                      {getInitials(user.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-semibold text-gray-900 leading-none">{user.full_name || user.username}</p>
                    <p className="text-xs text-gray-500 leading-none">{user.email}</p>
                    <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20 w-fit mt-1">
                      ● Active
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="p-2">
                <div className="rounded-lg bg-gradient-to-br from-indigo-50 to-indigo-100 p-3 mb-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-indigo-900">Pro Plan</span>
                    <span className="text-xs text-indigo-700">Unlimited</span>
                  </div>
                  <div className="w-full bg-indigo-200 rounded-full h-1.5">
                    <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: '75%' }}></div>
                  </div>
                  <p className="text-[10px] text-indigo-700 mt-1">75% of monthly credits used</p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/dashboard/settings')} className="cursor-pointer mx-2 rounded-md hover:bg-gray-50 transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] group">
                <Settings className="mr-2 h-4 w-4 text-gray-500 transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:rotate-90 group-hover:text-indigo-600" />
                <span className="text-sm">Account Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600 mx-2 rounded-md hover:bg-red-50 transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] group">
                <LogOut className="mr-2 h-4 w-4 transition-transform duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:-translate-x-1" />
                <span className="text-sm">Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}