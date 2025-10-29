'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { socialAccountsAPI, postsAPI } from '@/lib/api';
import { Loader2, Facebook, Instagram, Linkedin, Twitter, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { Content, SocialAccount } from '@/types';
import { useRouter } from 'next/navigation';

// X (Twitter) Icon Component
const XIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

interface PublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: Content;
}

export default function PublishDialog({
  open,
  onOpenChange,
  content,
}: PublishDialogProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [connectedAccounts, setConnectedAccounts] = useState<SocialAccount[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [fetchingAccounts, setFetchingAccounts] = useState(false);

  const fetchConnectedAccounts = useCallback(async () => {
    setFetchingAccounts(true);
    try {
      const response = await socialAccountsAPI.list({ active_only: true });
      const accounts = response.data.filter((acc: SocialAccount) => acc.is_connected);
      setConnectedAccounts(accounts);

      // Auto-select all connected platforms
      setSelectedPlatforms(accounts.map((acc: SocialAccount) => acc.platform));
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to fetch connected accounts',
        variant: 'destructive',
      });
    } finally {
      setFetchingAccounts(false);
    }
  }, [toast]);

  useEffect(() => {
    if (open) {
      fetchConnectedAccounts();
    }
  }, [open, fetchConnectedAccounts]);



  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, React.ElementType> = {
      facebook: Facebook,
      instagram: Instagram,
      linkedin: Linkedin,
      twitter: XIcon,
    };
    return icons[platform] || Twitter;
  };

  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      facebook: 'text-blue-600',
      instagram: 'text-pink-600',
      linkedin: 'text-blue-700',
      twitter: 'text-black',
    };
    return colors[platform] || 'text-gray-600';
  };

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const handlePublish = async () => {
    if (selectedPlatforms.length === 0) {
      toast({
        title: 'No platforms selected',
        description: 'Please select at least one platform to publish to',
        variant: 'destructive',
      });
      return;
    }

    let scheduledFor: string | undefined;
    if (isScheduled) {
      if (!scheduledDate || !scheduledTime) {
        toast({
          title: 'Invalid schedule',
          description: 'Please provide both date and time for scheduling',
          variant: 'destructive',
        });
        return;
      }
      scheduledFor = `${scheduledDate}T${scheduledTime}:00`;

      // Validate future date
      const scheduledDateTime = new Date(scheduledFor);
      if (scheduledDateTime <= new Date()) {
        toast({
          title: 'Invalid schedule',
          description: 'Scheduled time must be in the future',
          variant: 'destructive',
        });
        return;
      }
    }

    setIsLoading(true);

    try {
      await postsAPI.create({
        content_id: content.id,
        platforms: selectedPlatforms,
        scheduled_for: scheduledFor,
      });

      toast({
        title: isScheduled ? 'Post scheduled!' : 'Publishing...',
        description: isScheduled
          ? `Your post has been scheduled for ${new Date(scheduledFor!).toLocaleString()}`
          : 'Your post is being published to selected platforms',
      });

      onOpenChange(false);

      // Redirect to content list after decision
      setTimeout(() => {
        router.push('/content');
      }, 800);
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Failed to publish content';
      toast({
        title: 'Publishing failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Publish Content</DialogTitle>
          <DialogDescription>
            Select platforms and schedule your post
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Connected Accounts Info */}
          {fetchingAccounts ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            </div>
          ) : connectedAccounts.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No social accounts connected</p>
              <Button
                onClick={() => {
                  onOpenChange(false);
                  router.push('/social-accounts');
                }}
              >
                Connect Accounts
              </Button>
            </div>
          ) : (
            <>
              {/* Platform Selection */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Select Platforms</Label>
                <div className="grid grid-cols-2 gap-3">
                  {connectedAccounts.map((account) => {
                    const Icon = getPlatformIcon(account.platform);
                    const isSelected = selectedPlatforms.includes(account.platform);

                    return (
                      <button
                        key={account.id}
                        type="button"
                        onClick={() => togglePlatform(account.platform)}
                        className={`flex items-center gap-3 p-4 border rounded-lg transition-all ${isSelected
                          ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200'
                          : 'border-gray-200 hover:border-gray-300'
                          }`}
                      >
                        <div className={`flex-shrink-0 ${isSelected ? 'opacity-100' : 'opacity-50'}`}>
                          <Icon className={`h-6 w-6 ${getPlatformColor(account.platform)}`} />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-medium capitalize text-sm">{account.platform}</p>
                          <p className="text-xs text-gray-500">{account.display_name || account.username}</p>
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="h-5 w-5 text-indigo-600" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Scheduling Options */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="schedule"
                    checked={isScheduled}
                    onCheckedChange={(checked) => setIsScheduled(checked as boolean)}
                  />
                  <Label htmlFor="schedule" className="text-base font-semibold cursor-pointer">
                    Schedule for later
                  </Label>
                </div>

                {isScheduled && (
                  <div className="grid grid-cols-2 gap-4 pl-6">
                    <div className="space-y-2">
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="time">Time</Label>
                      <Input
                        id="time"
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Content Preview Summary */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <p className="text-sm font-medium text-gray-700">Publishing:</p>
                <p className="text-sm text-gray-600 line-clamp-2">{content.topic}</p>
                {content.image_url && (
                  <p className="text-xs text-gray-500">📷 With image</p>
                )}
              </div>

              {/* Instagram Warning */}
              {selectedPlatforms.includes('instagram') && (
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <div className="flex gap-2">
                    <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-blue-900">Instagram Publishing Note</p>
                      <p className="text-xs text-blue-700">
                        Instagram requires a publicly accessible image URL. Make sure your image is hosted and accessible from the internet.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    onOpenChange(false);
                    // User decided not to post now; redirect to content list
                    router.push('/content');
                  }}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Skip posting
                </Button>
                <Button
                  onClick={handlePublish}
                  disabled={isLoading || selectedPlatforms.length === 0}
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Publishing...
                    </>
                  ) : isScheduled ? (
                    'Schedule Post'
                  ) : (
                    'Publish Now'
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}