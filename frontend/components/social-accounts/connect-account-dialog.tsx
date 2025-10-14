'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { socialAccountsAPI } from '@/lib/api';
import { Loader2 } from 'lucide-react';

interface ConnectAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function ConnectAccountDialog({
  open,
  onOpenChange,
  onSuccess,
}: ConnectAccountDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    platform: '',
    username: '',
    accessToken: '',
    displayName: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await socialAccountsAPI.connect({
        platform: formData.platform,
        username: formData.username,
        access_token: formData.accessToken,
        display_name: formData.displayName,
        platform_data: {},
      });

      toast({
        title: 'Account connected!',
        description: `Your ${formData.platform} account has been connected successfully`,
      });

      onSuccess();
      onOpenChange(false);
      setFormData({
        platform: '',
        username: '',
        accessToken: '',
        displayName: '',
      });
    } catch (error: any) {
      toast({
        title: 'Connection failed',
        description: error.response?.data?.detail || 'Failed to connect account',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Connect Social Account</DialogTitle>
          <DialogDescription>
            Enter your account credentials to connect a social media platform.
            For production, this would use OAuth 2.0 authentication.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="platform">Platform</Label>
            <Select
              value={formData.platform}
              onValueChange={(value) => setFormData({ ...formData, platform: value })}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
                <SelectItem value="twitter">Twitter/X</SelectItem>
                <SelectItem value="tiktok">TikTok</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="your_username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name (Optional)</Label>
            <Input
              id="displayName"
              type="text"
              placeholder="Your Name"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="accessToken">Access Token</Label>
            <Input
              id="accessToken"
              type="text"
              placeholder="your_access_token_here"
              value={formData.accessToken}
              onChange={(e) => setFormData({ ...formData, accessToken: e.target.value })}
              disabled={isLoading}
              required
            />
            <p className="text-xs text-gray-500">
              For testing purposes. In production, this would be obtained via OAuth.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                'Connect Account'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}