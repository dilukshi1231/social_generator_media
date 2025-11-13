'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { socialAccountsAPI, oauthAPI } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { Facebook, Instagram, Linkedin, Twitter, CheckCircle, AlertCircle, Trash2, RefreshCw } from 'lucide-react';
import type { SocialAccount, PlatformType } from '@/types';
import TokenConnectDialog from '@/components/social-accounts/token-connect-dialog';

// X (Twitter) Icon Component
const XIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

// TikTok Icon Component
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
);

interface Platform {
  name: string;
  value: string;
}

export default function SocialAccountsPage() {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [availablePlatforms, setAvailablePlatforms] = useState<Platform[]>([]);
  const [verifyingAccounts, setVerifyingAccounts] = useState<Set<number>>(new Set());
  const [tokenDialogOpen, setTokenDialogOpen] = useState(false);
  const [tokenDialogPlatform, setTokenDialogPlatform] = useState<'facebook' | 'instagram'>('facebook');

  useEffect(() => {
    fetchAccounts();
    fetchPlatforms();
    // On callback, show toast and refresh
    try {
      const url = new URL(window.location.href);
      const connected = url.searchParams.get('connected');
      const status = url.searchParams.get('status');
      const errorDetail = url.searchParams.get('error_detail');

      if (connected && status) {
        if (status === 'success') {
          toast({
            title: 'Account connected',
            description: `Successfully connected ${connected.charAt(0).toUpperCase() + connected.slice(1)}`
          });
          fetchAccounts();
        } else {
          const errorMsg = errorDetail
            ? `Failed to connect ${connected}: ${errorDetail.replace(/_/g, ' ')}`
            : `Failed to connect ${connected}`;
          toast({
            title: 'Connection failed',
            description: errorMsg,
            variant: 'destructive'
          });
        }
        // Clean params
        url.searchParams.delete('connected');
        url.searchParams.delete('status');
        url.searchParams.delete('error_detail');
        window.history.replaceState({}, '', url.toString());
      }
    } catch (error) {
      console.error('Error handling OAuth callback:', error);
    }
  }, [toast]);

  const fetchAccounts = async () => {
    try {
      const response = await socialAccountsAPI.list();
      setAccounts(response.data);
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
    }
  };

  const fetchPlatforms = async () => {
    try {
      const response = await socialAccountsAPI.getAvailablePlatforms();
      setAvailablePlatforms(response.data.platforms);
    } catch (error) {
      console.error('Failed to fetch platforms:', error);
    }
  };

  const handleDisconnect = async (accountId: number) => {
    if (!confirm('Are you sure you want to disconnect this account?')) {
      return;
    }

    try {
      await socialAccountsAPI.disconnect(accountId);
      setAccounts(accounts.filter((a) => a.id !== accountId));
      toast({
        title: 'Account disconnected',
        description: 'The social media account has been disconnected',
      });
    } catch (error) {
      const errorMessage = error instanceof Error && 'response' in error
        ? (error as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Failed to disconnect account'
        : 'Failed to disconnect account';
      toast({
        title: 'Disconnect failed',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleVerify = async (accountId: number) => {
    setVerifyingAccounts((prev) => new Set(prev).add(accountId));

    try {
      const response = await socialAccountsAPI.verify(accountId);
      const result = response.data;

      if (result.valid) {
        toast({
          title: 'Connection verified ✓',
          description: result.message || 'Your account connection is active and working',
        });

        // Update account status if needed
        setAccounts((prev) =>
          prev.map((acc) =>
            acc.id === accountId ? { ...acc, is_active: true } : acc
          )
        );
      } else {
        toast({
          title: 'Connection invalid',
          description: result.message || 'Please reconnect your account',
          variant: 'destructive',
        });

        // Mark account as inactive
        setAccounts((prev) =>
          prev.map((acc) =>
            acc.id === accountId ? { ...acc, is_active: false } : acc
          )
        );
      }
    } catch (error) {
      const errorMessage = error instanceof Error && 'response' in error
        ? (error as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Failed to verify connection'
        : 'Failed to verify connection';
      toast({
        title: 'Verification failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setVerifyingAccounts((prev) => {
        const next = new Set(prev);
        next.delete(accountId);
        return next;
      });
    }
  };

  const getPlatformIcon = (platform: PlatformType) => {
    const icons = {
      facebook: Facebook,
      instagram: Instagram,
      linkedin: Linkedin,
      twitter: XIcon,
      tiktok: TikTokIcon,
    };
    return icons[platform] || Twitter;
  };

  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      facebook: 'text-blue-600 bg-blue-50',
      instagram: 'text-pink-600 bg-pink-50',
      linkedin: 'text-blue-700 bg-blue-50',
      twitter: 'text-black bg-gray-50',
      tiktok: 'text-black bg-gray-50',
    };
    return colors[platform] || 'text-gray-600 bg-gray-50';
  };

  const isConnected = (platform: string) => {
    return accounts.some((a) => a.platform === platform && a.is_connected);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Social Accounts</h1>
          <p className="text-gray-900 mt-1">
            Connect and manage your social media accounts
          </p>
        </div>
      </div>

      {/* Info Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Connect your social media accounts to start publishing content. You&apos;ll need to authorize each platform separately.
        </AlertDescription>
      </Alert>

      {/* Available Platforms */}
      <Card>
        <CardHeader>
          <CardTitle>Available Platforms</CardTitle>
          <CardDescription>
            Connect your accounts to start publishing across multiple platforms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {availablePlatforms.map((platform) => {
              const Icon = getPlatformIcon(platform.value as PlatformType);
              const connected = isConnected(platform.value);

              return (
                <Card
                  key={platform.value}
                  className={`relative ${connected ? 'border-green-500 bg-green-50' : ''}`}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-lg ${getPlatformColor(platform.value)}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      {connected ? (
                        <Badge className="bg-green-500">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Connected
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Not Connected</Badge>
                      )}
                    </div>
                    <h3 className="font-semibold text-lg">{platform.name}</h3>
                    <Button
                      variant={connected ? 'outline' : 'default'}
                      className="w-full mt-4"
                      onClick={async () => {
                        if (connected) return;

                        // Use token dialog for Facebook and Instagram
                        if (platform.value === 'facebook' || platform.value === 'instagram') {
                          setTokenDialogPlatform(platform.value);
                          setTokenDialogOpen(true);
                          return;
                        }

                        // Use OAuth for other platforms
                        try {
                          const { authorize_url } = await oauthAPI.getAuthorizeUrl(platform.value);
                          window.location.href = authorize_url;
                        } catch (error: unknown) {
                          const errorMsg = (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || `OAuth not configured for ${platform.name}. Please check backend configuration.`;
                          toast({
                            title: `${platform.name} connection failed`,
                            description: errorMsg,
                            variant: 'destructive'
                          });
                          console.error(`${platform.name} OAuth error:`, error);
                        }
                      }}
                      disabled={connected}
                    >
                      {connected ? 'Connected' : (platform.value === 'twitter' ? 'Connect with X' : `Connect with ${platform.name}`)}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Connected Accounts */}
      {accounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Connected Accounts</CardTitle>
            <CardDescription>
              Manage your connected social media accounts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {accounts.map((account) => {
                const Icon = getPlatformIcon(account.platform);
                return (
                  <div
                    key={account.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-lg ${getPlatformColor(account.platform)}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="font-semibold capitalize">
                          {account.platform}
                        </h4>
                        <p className="text-sm text-gray-900">
                          {account.display_name || account.username || 'No username'}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-gray-700">
                            Connected {new Date(account.connected_at).toLocaleDateString()}
                          </p>
                          {account.last_posted_at && (
                            <>
                              <span className="text-xs text-gray-400">•</span>
                              <p className="text-xs text-gray-700">
                                Last posted {new Date(account.last_posted_at).toLocaleDateString()}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={account.is_active ? 'default' : 'secondary'}>
                        {account.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleVerify(account.id)}
                        disabled={verifyingAccounts.has(account.id)}
                      >
                        {verifyingAccounts.has(account.id) ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Test
                          </>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDisconnect(account.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Token Connection Dialog */}
      <TokenConnectDialog
        open={tokenDialogOpen}
        onOpenChange={setTokenDialogOpen}
        platform={tokenDialogPlatform}
        onSuccess={() => {
          fetchAccounts();
        }}
      />
    </div>
  );
}