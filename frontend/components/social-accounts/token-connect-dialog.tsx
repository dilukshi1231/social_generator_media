'use client';

import { useState, useEffect } from 'react';
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
import { useToast } from '@/components/ui/use-toast';
import { socialAccountsAPI } from '@/lib/api';
import { Loader2, CheckCircle, Info, ExternalLink, Facebook, Instagram } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';

interface TokenConnectDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    platform: 'facebook' | 'instagram';
}

interface FacebookPage {
    page_id: string;
    page_name: string;
    category: string;
    page_access_token: string;
    has_instagram: boolean;
    instagram_account_id?: string;
    instagram_username?: string;
    instagram_name?: string;
}

export default function TokenConnectDialog({
    open,
    onOpenChange,
    onSuccess,
    platform,
}: TokenConnectDialogProps) {
    const { toast } = useToast();
    const [step, setStep] = useState<'token' | 'select'>('token');
    const [isLoadingPages, setIsLoadingPages] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);

    const [userAccessToken, setUserAccessToken] = useState('');
    const [pages, setPages] = useState<FacebookPage[]>([]);
    const [selectedPageId, setSelectedPageId] = useState<string>('');

    // Reset when dialog opens/closes
    useEffect(() => {
        if (!open) {
            setStep('token');
            setUserAccessToken('');
            setPages([]);
            setSelectedPageId('');
        }
    }, [open]);

    const handleFetchPages = async () => {
        if (!userAccessToken.trim()) {
            toast({
                title: 'Access Token Required',
                description: 'Please enter your Facebook access token',
                variant: 'destructive',
            });
            return;
        }

        setIsLoadingPages(true);

        try {
            const response = await socialAccountsAPI.getFacebookPages({
                access_token: userAccessToken,
            });

            const data = response.data;

            if (!data.success || !data.pages || data.pages.length === 0) {
                toast({
                    title: 'No Pages Found',
                    description: data.message || 'Make sure you have admin access to at least one Facebook Page',
                    variant: 'destructive',
                });
                return;
            }

            // Filter pages based on platform
            let filteredPages = data.pages;
            if (platform === 'instagram') {
                filteredPages = data.pages.filter((p: FacebookPage) => p.has_instagram);

                if (filteredPages.length === 0) {
                    toast({
                        title: 'No Instagram Accounts Found',
                        description: 'None of your Facebook Pages have an Instagram Business Account connected',
                        variant: 'destructive',
                    });
                    return;
                }
            }

            setPages(filteredPages);
            setStep('select');

            toast({
                title: 'Pages Loaded! 🎉',
                description: `Found ${filteredPages.length} ${platform === 'facebook' ? 'page(s)' : 'page(s) with Instagram'}`,
            });
        } catch (error) {
            const errorMessage = error instanceof Error && 'response' in error
                ? (error as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Failed to fetch pages'
                : 'Failed to fetch pages';

            toast({
                title: 'Failed to Load Pages',
                description: errorMessage,
                variant: 'destructive',
            });
        } finally {
            setIsLoadingPages(false);
        }
    };

    const handleConnect = async () => {
        if (!selectedPageId) {
            toast({
                title: 'Please Select a Page',
                description: 'Choose which page you want to connect',
                variant: 'destructive',
            });
            return;
        }

        const selectedPage = pages.find(p => p.page_id === selectedPageId);
        if (!selectedPage) return;

        setIsConnecting(true);

        try {
            const response = await socialAccountsAPI.connectWithToken({
                platform,
                access_token: selectedPage.page_access_token,
                page_id: platform === 'facebook' ? selectedPage.page_id : undefined,
                instagram_business_account_id: platform === 'instagram' ? selectedPage.instagram_account_id : undefined,
            });

            const data = response.data;

            toast({
                title: 'Connected Successfully! 🎉',
                description: data.message,
            });

            onSuccess();
            onOpenChange(false);
        } catch (error) {
            const errorMessage = error instanceof Error && 'response' in error
                ? (error as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Failed to connect'
                : 'Failed to connect';

            toast({
                title: 'Connection Failed',
                description: errorMessage,
                variant: 'destructive',
            });
        } finally {
            setIsConnecting(false);
        }
    };

    const selectedPage = pages.find(p => p.page_id === selectedPageId);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {platform === 'facebook' ? <Facebook className="h-5 w-5 text-blue-600" /> : <Instagram className="h-5 w-5 text-pink-600" />}
                        Connect {platform === 'facebook' ? 'Facebook Page' : 'Instagram Business Account'}
                    </DialogTitle>
                    <DialogDescription>
                        {step === 'token' && 'Enter your Facebook access token to get started'}
                        {step === 'select' && `Select which ${platform === 'facebook' ? 'page' : 'Instagram account'} you want to connect`}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Step 1: Enter Access Token */}
                    {step === 'token' && (
                        <>
                            <Alert>
                                <Info className="h-4 w-4" />
                                <AlertDescription className="text-sm">
                                    <strong>Quick Setup:</strong> Just paste your Facebook access token below. We&apos;ll automatically fetch your pages and handle the rest!
                                </AlertDescription>
                            </Alert>

                            <div className="space-y-2">
                                <Label htmlFor="accessToken">
                                    Facebook Access Token <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="accessToken"
                                    type="text"
                                    placeholder="Paste your access token here..."
                                    value={userAccessToken}
                                    onChange={(e) => setUserAccessToken(e.target.value)}
                                    disabled={isLoadingPages}
                                    className="font-mono text-sm"
                                />
                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                    Get your token from{' '}
                                    <a
                                        href="https://developers.facebook.com/tools/explorer"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline inline-flex items-center gap-1"
                                    >
                                        Graph API Explorer
                                        <ExternalLink className="h-3 w-3" />
                                    </a>
                                </p>
                            </div>

                            <Alert className="bg-blue-50 border-blue-200">
                                <Info className="h-4 w-4 text-blue-600" />
                                <AlertDescription className="text-sm text-blue-900">
                                    <strong>Required Permissions:</strong>
                                    <ul className="list-disc list-inside mt-1 space-y-0.5">
                                        <li><code>pages_show_list</code> - To list your pages</li>
                                        <li><code>pages_manage_posts</code> - To publish posts</li>
                                        {platform === 'instagram' && <li><code>instagram_basic</code> - For Instagram</li>}
                                        {platform === 'instagram' && <li><code>instagram_content_publish</code> - To publish to Instagram</li>}
                                    </ul>
                                </AlertDescription>
                            </Alert>

                            <div className="flex gap-3 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                    disabled={isLoadingPages}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleFetchPages}
                                    disabled={isLoadingPages || !userAccessToken.trim()}
                                    className="flex-1"
                                >
                                    {isLoadingPages ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Loading Pages...
                                        </>
                                    ) : (
                                        'Continue'
                                    )}
                                </Button>
                            </div>
                        </>
                    )}

                    {/* Step 2: Select Page */}
                    {step === 'select' && (
                        <>
                            <div className="space-y-3">
                                <Label>
                                    Select {platform === 'facebook' ? 'Facebook Page' : 'Instagram Account'} to Connect
                                </Label>

                                <RadioGroup value={selectedPageId} onValueChange={setSelectedPageId}>
                                    {pages.map((page) => (
                                        <Card
                                            key={page.page_id}
                                            className={`cursor-pointer transition-all ${selectedPageId === page.page_id
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'hover:border-gray-400'
                                                }`}
                                            onClick={() => setSelectedPageId(page.page_id)}
                                        >
                                            <CardContent className="p-4">
                                                <div className="flex items-start gap-3">
                                                    <RadioGroupItem value={page.page_id} id={page.page_id} />
                                                    <div className="flex-1">
                                                        <label
                                                            htmlFor={page.page_id}
                                                            className="font-medium cursor-pointer flex items-center gap-2"
                                                        >
                                                            {platform === 'facebook' ? (
                                                                <Facebook className="h-4 w-4 text-blue-600" />
                                                            ) : (
                                                                <Instagram className="h-4 w-4 text-pink-600" />
                                                            )}
                                                            {platform === 'facebook' ? page.page_name : `@${page.instagram_username}`}
                                                        </label>
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            {platform === 'facebook' ? (
                                                                <>
                                                                    <span className="text-gray-500">Category:</span> {page.category}
                                                                    {page.has_instagram && (
                                                                        <span className="ml-2 text-pink-600">• Instagram Connected</span>
                                                                    )}
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <span className="text-gray-500">Page:</span> {page.page_name}
                                                                </>
                                                            )}
                                                        </p>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            ID: {platform === 'facebook' ? page.page_id : page.instagram_account_id}
                                                        </p>
                                                    </div>
                                                    {selectedPageId === page.page_id && (
                                                        <CheckCircle className="h-5 w-5 text-blue-600" />
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </RadioGroup>
                            </div>

                            {selectedPage && (
                                <Alert className="border-green-200 bg-green-50">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    <AlertDescription className="text-sm text-green-900">
                                        <strong>Ready to connect:</strong> {platform === 'facebook' ? selectedPage.page_name : `@${selectedPage.instagram_username}`}
                                    </AlertDescription>
                                </Alert>
                            )}

                            <div className="flex gap-3 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setStep('token')}
                                    disabled={isConnecting}
                                    className="flex-1"
                                >
                                    Back
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleConnect}
                                    disabled={isConnecting || !selectedPageId}
                                    className="flex-1"
                                >
                                    {isConnecting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Connecting...
                                        </>
                                    ) : (
                                        'Connect'
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
