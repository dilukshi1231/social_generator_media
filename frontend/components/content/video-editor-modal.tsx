'use client';

import { useState, useEffect } from 'react';
import { X, Scissors, Plus, Trash2, MoveVertical, Download, Loader2, Play, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { videoProcessingService } from '@/lib/video-processing';
import Image from 'next/image';

interface VideoClip {
    id: string;
    videoData: {
        id: number;
        video_url: string;
        image: string;
        width: number;
        height: number;
        duration: number;
        user: {
            name: string;
            url: string;
        };
    };
    startTime: number;
    endTime: number;
    order: number;
}

interface VideoEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    videos: Array<{
        id: number;
        video_url: string;
        image: string;
        width: number;
        height: number;
        duration: number;
        user: {
            name: string;
            url: string;
        };
    }>;
    onSaveMergedVideo?: (videoUrl: string, videoBlob: Blob) => void;
}

export default function VideoEditorModal({ isOpen, onClose, videos, onSaveMergedVideo }: VideoEditorModalProps) {
    const { toast } = useToast();
    const [selectedClips, setSelectedClips] = useState<VideoClip[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingProgress, setProcessingProgress] = useState(0);
    const [processingMessage, setProcessingMessage] = useState('');
    const [isFFmpegLoaded, setIsFFmpegLoaded] = useState(false);
    const [draggedClip, setDraggedClip] = useState<string | null>(null);
    const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);
    const [mergedVideoBlob, setMergedVideoBlob] = useState<Blob | null>(null);
    const [mergedVideoUrl, setMergedVideoUrl] = useState<string | null>(null);
    const [isVideoSaved, setIsVideoSaved] = useState(false);

    // Load FFmpeg on mount
    useEffect(() => {
        const loadFFmpeg = async () => {
            try {
                if (!videoProcessingService.isFFmpegLoaded()) {
                    setProcessingMessage('Loading video editor...');
                    await videoProcessingService.loadFFmpeg((progress: number) => {
                        setProcessingProgress(progress);
                    });
                    setIsFFmpegLoaded(true);
                    setProcessingMessage('');
                } else {
                    setIsFFmpegLoaded(true);
                }
            } catch (error) {
                console.error('Failed to load FFmpeg:', error);
                toast({
                    title: 'Editor initialization failed',
                    description: 'Failed to load video processing engine',
                    variant: 'destructive',
                });
            }
        };
        if (isOpen) {
            loadFFmpeg();
        }
    }, [isOpen, toast]);

    // Reset when modal closes
    useEffect(() => {
        if (!isOpen) {
            setSelectedClips([]);
            // Only revoke URL if video wasn't saved
            if (mergedVideoUrl && !isVideoSaved) {
                URL.revokeObjectURL(mergedVideoUrl);
            }
            setMergedVideoBlob(null);
            setMergedVideoUrl(null);
            setIsVideoSaved(false);
        }
    }, [isOpen, mergedVideoUrl, isVideoSaved]);

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    const addClipToTimeline = (video: VideoEditorModalProps['videos'][0]) => {
        const newClip: VideoClip = {
            id: `${video.id}-${Date.now()}`,
            videoData: video,
            startTime: 0,
            endTime: video.duration,
            order: selectedClips.length,
        };
        setSelectedClips([...selectedClips, newClip]);
        toast({
            title: 'Clip added',
            description: 'Video clip added to timeline',
        });
    };

    const removeClip = (clipId: string) => {
        setSelectedClips(selectedClips.filter(c => c.id !== clipId).map((c, idx) => ({ ...c, order: idx })));
    };

    const updateClipTimes = (clipId: string, startTime: number, endTime: number) => {
        setSelectedClips(prev => prev.map(c =>
            c.id === clipId ? { ...c, startTime, endTime } : c
        ));
    };

    const handleDragStart = (clipId: string) => {
        setDraggedClip(clipId);
    };

    const handleDragOver = (e: React.DragEvent, targetClipId: string) => {
        e.preventDefault();
        if (!draggedClip || draggedClip === targetClipId) return;

        const draggedIndex = selectedClips.findIndex(c => c.id === draggedClip);
        const targetIndex = selectedClips.findIndex(c => c.id === targetClipId);

        if (draggedIndex === -1 || targetIndex === -1) return;

        const newClips = [...selectedClips];
        const [draggedItem] = newClips.splice(draggedIndex, 1);
        newClips.splice(targetIndex, 0, draggedItem);

        setSelectedClips(newClips.map((c, idx) => ({ ...c, order: idx })));
    };

    const handleDragEnd = () => {
        setDraggedClip(null);
    };

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        const ms = Math.floor((time % 1) * 10);
        return `${minutes}:${seconds.toString().padStart(2, '0')}.${ms}`;
    };

    const getTotalDuration = () => {
        return selectedClips.reduce((total, clip) => total + (clip.endTime - clip.startTime), 0);
    };

    const handleExport = async () => {
        if (selectedClips.length === 0) {
            toast({
                title: 'No clips selected',
                description: 'Please add at least one clip to the timeline',
                variant: 'destructive',
            });
            return;
        }

        if (!isFFmpegLoaded) {
            toast({
                title: 'Editor not ready',
                description: 'Please wait for the video editor to load',
                variant: 'destructive',
            });
            return;
        }

        setIsProcessing(true);
        setProcessingProgress(0);
        setProcessingMessage('Initializing...');

        try {
            const videoBlob = await videoProcessingService.trimAndMergeVideos(
                selectedClips,
                (progress: number, message: string) => {
                    setProcessingProgress(progress);
                    setProcessingMessage(message);
                }
            );

            // Clean up previous merged video URL
            if (mergedVideoUrl) {
                URL.revokeObjectURL(mergedVideoUrl);
            }

            // Create object URL for the merged video
            const url = URL.createObjectURL(videoBlob);
            setMergedVideoBlob(videoBlob);
            setMergedVideoUrl(url);

            toast({
                title: 'Video merged successfully!',
                description: 'Your video is ready to preview and download',
            });

            setProcessingMessage('');
        } catch (error) {
            console.error('Export error:', error);
            toast({
                title: 'Export failed',
                description: error instanceof Error ? error.message : 'Failed to export video',
                variant: 'destructive',
            });
            setProcessingMessage('');
        } finally {
            setIsProcessing(false);
            setProcessingProgress(0);
        }
    };

    const handleDownload = () => {
        if (!mergedVideoBlob) return;

        const url = URL.createObjectURL(mergedVideoBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `merged-video-${Date.now()}.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast({
            title: 'Download started',
            description: 'Your merged video is being downloaded',
        });
    };

    const handleRedo = () => {
        if (mergedVideoUrl) {
            URL.revokeObjectURL(mergedVideoUrl);
        }
        setMergedVideoBlob(null);
        setMergedVideoUrl(null);
        toast({
            title: 'Ready to edit',
            description: 'Adjust your clips and merge again',
        });
    };

    const handleSave = () => {
        if (!mergedVideoUrl || !mergedVideoBlob) return;

        // Mark video as saved so URL won't be revoked on modal close
        setIsVideoSaved(true);

        // Pass the merged video to parent component
        onSaveMergedVideo?.(mergedVideoUrl, mergedVideoBlob);

        toast({
            title: 'Video saved!',
            description: 'Your merged video has been saved',
        });

        // Close the modal
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm">
            <div className="h-full flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Video Editor</h2>
                        <p className="text-sm text-white/60">Create your perfect video by combining clips</p>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-white hover:bg-white/10"
                        onClick={onClose}
                    >
                        <X className="h-6 w-6" />
                    </Button>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Left Panel - Video Library */}
                    <div className="w-80 border-r border-white/10 overflow-y-auto bg-black/40">
                        <div className="p-4">
                            <h3 className="text-lg font-semibold text-white mb-4">Available Videos</h3>
                            <div className="space-y-3">
                                {videos.map((video) => (
                                    <Card key={video.id} className="bg-white/5 border-white/10 overflow-hidden">
                                        <div
                                            className="relative aspect-[9/16] w-full cursor-pointer group"
                                            onClick={() => setPreviewVideoUrl(video.video_url)}
                                        >
                                            <Image
                                                src={video.image}
                                                alt="Video thumbnail"
                                                fill
                                                className="object-cover"
                                                unoptimized
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <div className="bg-white/90 rounded-full p-4">
                                                    <Play className="h-8 w-8 text-black fill-black" />
                                                </div>
                                            </div>
                                            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                                {Math.floor(video.duration)}s
                                            </div>
                                        </div>
                                        <div className="p-3">
                                            <p className="text-xs text-white/60 mb-2">{video.user.name}</p>
                                            <Button
                                                onClick={() => addClipToTimeline(video)}
                                                size="sm"
                                                className="w-full bg-purple-600 hover:bg-purple-700"
                                            >
                                                <Plus className="h-4 w-4 mr-2" />
                                                Add to Timeline
                                            </Button>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Main Panel - Timeline */}
                    <div className="flex-1 flex flex-col bg-black/20">
                        {/* Merged Video Display or Instructions */}
                        <div className="p-8 border-b border-white/10">
                            {mergedVideoUrl ? (
                                <div className="space-y-4">
                                    <div className="text-center">
                                        <h3 className="text-xl font-semibold text-white mb-2">Merged Video Ready!</h3>
                                        <p className="text-sm text-white/60">Preview your video and download or redo</p>
                                    </div>
                                    <div className="relative aspect-[9/16] w-full max-w-sm mx-auto">
                                        <video
                                            src={mergedVideoUrl}
                                            controls
                                            className="w-full h-full rounded-lg shadow-2xl"
                                            poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23000' width='100' height='100'/%3E%3C/svg%3E"
                                        />
                                    </div>
                                    <div className="flex gap-3 justify-center">
                                        <Button
                                            onClick={handleSave}
                                            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                                        >
                                            <Check className="h-4 w-4 mr-2" />
                                            Save Merged Video
                                        </Button>
                                        <Button
                                            onClick={handleDownload}
                                            variant="outline"
                                            className="border-purple-300 text-purple-600 hover:bg-purple-50"
                                        >
                                            <Download className="h-4 w-4 mr-2" />
                                            Download
                                        </Button>
                                        <Button
                                            onClick={handleRedo}
                                            variant="outline"
                                            className="border-white/20 text-white hover:bg-white/10"
                                        >
                                            <Scissors className="h-4 w-4 mr-2" />
                                            Redo Edit
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center text-white/80">
                                    <Scissors className="h-12 w-12 mx-auto mb-3 text-purple-400" />
                                    <h3 className="text-xl font-semibold mb-2">Video Timeline Editor</h3>
                                    <p className="text-sm text-white/60">
                                        Add videos from the left panel, trim them to your desired length, and export
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Timeline */}
                        <div className="border-t border-white/10 bg-black/40">
                            <div className="p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="text-lg font-semibold text-white">Timeline</h3>
                                        <p className="text-sm text-white/60">
                                            {selectedClips.length} clips • Total: {formatTime(getTotalDuration())}
                                        </p>
                                    </div>
                                    <Button
                                        onClick={handleExport}
                                        disabled={selectedClips.length === 0 || isProcessing || !isFFmpegLoaded || !!mergedVideoUrl}
                                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                                    >
                                        {isProcessing ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                {processingMessage || `Processing ${processingProgress}%`}
                                            </>
                                        ) : !isFFmpegLoaded ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Loading Editor...
                                            </>
                                        ) : mergedVideoUrl ? (
                                            <>
                                                <Scissors className="h-4 w-4 mr-2" />
                                                Video Merged
                                            </>
                                        ) : (
                                            <>
                                                <Download className="h-4 w-4 mr-2" />
                                                Merge Videos
                                            </>
                                        )}
                                    </Button>
                                </div>

                                {selectedClips.length === 0 ? (
                                    <div className="text-center py-12 border-2 border-dashed border-white/10 rounded-lg">
                                        <Plus className="h-12 w-12 text-white/20 mx-auto mb-2" />
                                        <p className="text-white/40">No clips in timeline</p>
                                        <p className="text-sm text-white/30 mt-1">Add videos from the left panel</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-64 overflow-y-auto">
                                        {selectedClips.sort((a, b) => a.order - b.order).map((clip, index) => (
                                            <div
                                                key={clip.id}
                                                draggable
                                                onDragStart={() => handleDragStart(clip.id)}
                                                onDragOver={(e) => handleDragOver(e, clip.id)}
                                                onDragEnd={handleDragEnd}
                                                className={`
                          relative flex items-center gap-3 p-3 rounded-lg cursor-move
                          transition-all border-2 bg-white/5 border-white/10 hover:bg-white/10
                          ${draggedClip === clip.id ? 'opacity-50' : ''}
                        `}
                                            >
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <MoveVertical className="h-4 w-4 text-white/40" />
                                                    <span className="text-white font-semibold w-6">#{index + 1}</span>
                                                </div>

                                                <div className="relative w-16 h-24 shrink-0 cursor-pointer group"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setPreviewVideoUrl(clip.videoData.video_url);
                                                    }}
                                                >
                                                    <Image
                                                        src={clip.videoData.image}
                                                        alt="Thumbnail"
                                                        fill
                                                        className="object-cover rounded"
                                                        unoptimized
                                                    />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded">
                                                        <Play className="h-6 w-6 text-white fill-white" />
                                                    </div>
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <p className="text-white text-sm font-medium truncate">
                                                        {clip.videoData.user.name}
                                                    </p>
                                                    <p className="text-white/60 text-xs">
                                                        Duration: {formatTime(clip.endTime - clip.startTime)}
                                                    </p>

                                                    <div className="mt-2 space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-white/60 w-12">Start:</span>
                                                            <Slider
                                                                value={[clip.startTime]}
                                                                max={clip.videoData.duration}
                                                                step={0.1}
                                                                onValueChange={([value]) => {
                                                                    if (value < clip.endTime) {
                                                                        updateClipTimes(clip.id, value, clip.endTime);
                                                                    }
                                                                }}
                                                                className="flex-1"
                                                            />
                                                            <span className="text-xs text-white/80 w-16">
                                                                {formatTime(clip.startTime)}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-white/60 w-12">End:</span>
                                                            <Slider
                                                                value={[clip.endTime]}
                                                                max={clip.videoData.duration}
                                                                step={0.1}
                                                                onValueChange={([value]) => {
                                                                    if (value > clip.startTime) {
                                                                        updateClipTimes(clip.id, clip.startTime, value);
                                                                    }
                                                                }}
                                                                className="flex-1"
                                                            />
                                                            <span className="text-xs text-white/80 w-16">
                                                                {formatTime(clip.endTime)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeClip(clip.id);
                                                    }}
                                                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10 shrink-0"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Video Preview Dialog */}
            <Dialog open={!!previewVideoUrl} onOpenChange={() => setPreviewVideoUrl(null)}>
                <DialogContent className="max-w-2xl bg-black border-white/20">
                    <div className="relative aspect-[9/16] w-full max-w-md mx-auto">
                        {previewVideoUrl && (
                            <video
                                key={previewVideoUrl}
                                src={previewVideoUrl}
                                controls
                                autoPlay
                                className="w-full h-full rounded-lg"
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
