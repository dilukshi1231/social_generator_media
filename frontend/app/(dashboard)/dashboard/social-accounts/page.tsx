'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { socialAccountsAPI, oauthAPI } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { Facebook, Instagram, Linkedin, Twitter, Plus, CheckCircle, AlertCircle, Trash2, RefreshCw } from 'lucide-react';
import type { SocialAccount, PlatformType } from '@/types';
import ConnectAccountDialog from '@/components/social-accounts/connect-account-dialog';

interface Platform {
  name: string;
  value: string;
}

export default function SocialAccountsPage() {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [availablePlatforms, setAvailablePlatforms] = useState<Platform[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string | undefined>(undefined);
  const [verifyingAccounts, setVerifyingAccounts] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchAccounts();
    fetchPlatforms();
    // On callback, show toast and refresh
    try {
      const url = new URL(window.location.href);
      const connected = url.searchParams.get('connected');
      const status = url.searchParams.get('status');
      if (connected && status) {
        if (status === 'success') {
          toast({ title: 'Account connected', description: `Successfully connected ${connected}` });
          fetchAccounts();
        } else {
          toast({ title: 'Connection failed', description: `Failed to connect ${connected}`, variant: 'destructive' });
        }
        // Clean params
        url.searchParams.delete('connected');
        url.searchParams.delete('status');
        window.history.replaceState({}, '', url.toString());
      }
    } catch { }
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
      twitter: Twitter,
      tiktok: Twitter, // Using Twitter icon as placeholder
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
        <Button onClick={() => {
          setSelectedPlatform(undefined);
          setIsDialogOpen(true);
        }} size="lg">
          <Plus className="mr-2 h-5 w-5" />
          Connect Account
        </Button>
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
                        // Use OAuth for LinkedIn, Instagram, and Facebook
                        if (platform.value === 'linkedin' || platform.value === 'instagram' || platform.value === 'facebook') {
                          try {
                            const { authorize_url } = await oauthAPI.getAuthorizeUrl(platform.value);
                            window.location.href = authorize_url;
                          } catch (error: unknown) {
                            const errorMsg = (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || `OAuth not configured for ${platform.name}. Please check backend configuration.`;
                            toast({
                              title: `${platform.name} connect failed`,
                              description: errorMsg,
                              variant: 'destructive'
                            });
                            console.error(`${platform.name} OAuth error:`, error);
                          }
                        } else {
                          setSelectedPlatform(platform.value);
                          setIsDialogOpen(true);
                        }
                      }}
                      disabled={connected}
                    >
                      {connected ? 'Connected' : (platform.value === 'linkedin' || platform.value === 'instagram' || platform.value === 'facebook' ? `Connect with ${platform.name}` : 'Connect')}
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

      {/* Connect Account Dialog */}
      <ConnectAccountDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={fetchAccounts}
        selectedPlatform={selectedPlatform}
      />
    </div>
  );
}