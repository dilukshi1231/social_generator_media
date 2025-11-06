/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the component tree
 */

'use client';

import React, { Component, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex items-center justify-center min-h-screen p-4">
                    <Card className="w-full max-w-lg">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <AlertCircle className="h-5 w-5 text-red-600" />
                                <CardTitle>Something went wrong</CardTitle>
                            </div>
                            <CardDescription>
                                An unexpected error occurred. Please try again.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {this.state.error && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <p className="text-sm text-red-800 font-mono">
                                        {this.state.error.message}
                                    </p>
                                </div>
                            )}
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => this.setState({ hasError: false, error: null })}
                                    variant="default"
                                >
                                    Try Again
                                </Button>
                                <Button
                                    onClick={() => window.location.href = '/'}
                                    variant="outline"
                                >
                                    Go Home
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            );
        }

        return this.props.children;
    }
}
