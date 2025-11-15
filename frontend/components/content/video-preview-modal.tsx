'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Play, Pause, Volume2, VolumeX, Maximize2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VideoPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    video: {
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
    } | null;
}

export default function VideoPreviewModal({ isOpen, onClose, video }: VideoPreviewModalProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Reset state when modal opens/closes
    useEffect(() => {
        if (isOpen && videoRef.current) {
            setIsPlaying(false);
            setCurrentTime(0);
            videoRef.current.currentTime = 0;
        }
    }, [isOpen, video]);

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

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const togglePlayPause = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
        }
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration);
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = parseFloat(e.target.value);
        if (videoRef.current) {
            videoRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };

    const toggleFullscreen = () => {
        if (videoRef.current) {
            if (!isFullscreen) {
                if (videoRef.current.requestFullscreen) {
                    videoRef.current.requestFullscreen();
                }
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                }
            }
            setIsFullscreen(!isFullscreen);
        }
    };

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const handleDownload = () => {
        if (video) {
            window.open(video.video_url, '_blank');
        }
    };

    if (!isOpen || !video) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-4xl mx-4 animate-in zoom-in-95 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close button */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute -top-12 right-0 text-white hover:bg-white/20 z-10"
                    onClick={onClose}
                >
                    <X className="h-6 w-6" />
                </Button>

                {/* Video container */}
                <div className="relative bg-black rounded-lg overflow-hidden shadow-2xl">
                    {/* Video element with portrait aspect ratio preservation */}
                    <div className="relative flex items-center justify-center bg-black" style={{ minHeight: '60vh', maxHeight: '80vh' }}>
                        <video
                            ref={videoRef}
                            src={video.video_url}
                            poster={video.image}
                            className="max-h-[80vh] w-auto max-w-full object-contain"
                            onTimeUpdate={handleTimeUpdate}
                            onLoadedMetadata={handleLoadedMetadata}
                            onEnded={() => setIsPlaying(false)}
                            onClick={togglePlayPause}
                        />

                        {/* Play overlay when paused */}
                        {!isPlaying && (
                            <div
                                className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black/30 hover:bg-black/40 transition-colors"
                                onClick={togglePlayPause}
                            >
                                <div className="bg-white/90 rounded-full p-6 shadow-2xl hover:scale-110 transition-transform">
                                    <Play className="h-12 w-12 text-purple-600 fill-purple-600" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Video controls */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-4">
                        {/* Progress bar */}
                        <input
                            type="range"
                            min="0"
                            max={duration || 0}
                            value={currentTime}
                            onChange={handleSeek}
                            className="w-full h-1 mb-3 bg-white/30 rounded-lg appearance-none cursor-pointer slider"
                            style={{
                                background: `linear-gradient(to right, #a855f7 0%, #a855f7 ${(currentTime / duration) * 100}%, rgba(255,255,255,0.3) ${(currentTime / duration) * 100}%, rgba(255,255,255,0.3) 100%)`
                            }}
                        />

                        {/* Control buttons */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {/* Play/Pause */}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-white hover:bg-white/20"
                                    onClick={togglePlayPause}
                                >
                                    {isPlaying ? (
                                        <Pause className="h-5 w-5" />
                                    ) : (
                                        <Play className="h-5 w-5" />
                                    )}
                                </Button>

                                {/* Mute/Unmute */}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-white hover:bg-white/20"
                                    onClick={toggleMute}
                                >
                                    {isMuted ? (
                                        <VolumeX className="h-5 w-5" />
                                    ) : (
                                        <Volume2 className="h-5 w-5" />
                                    )}
                                </Button>

                                {/* Time display */}
                                <span className="text-white text-sm ml-2">
                                    {formatTime(currentTime)} / {formatTime(duration)}
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                {/* Download */}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-white hover:bg-white/20"
                                    onClick={handleDownload}
                                    title="Open video in new tab"
                                >
                                    <Download className="h-5 w-5" />
                                </Button>

                                {/* Fullscreen */}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-white hover:bg-white/20"
                                    onClick={toggleFullscreen}
                                >
                                    <Maximize2 className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Video info */}
                <div className="mt-4 bg-white/10 backdrop-blur-md rounded-lg p-4 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-white/70">Video by</p>
                            <a
                                href={video.user.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-lg font-semibold hover:text-purple-400 transition-colors"
                            >
                                {video.user.name}
                            </a>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-white/70">Resolution</p>
                            <p className="text-lg font-semibold">
                                {video.width} × {video.height}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-white/70">Duration</p>
                            <p className="text-lg font-semibold">{Math.floor(video.duration)}s</p>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #a855f7;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .slider::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #a855f7;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .slider::-webkit-slider-thumb:hover {
          background: #9333ea;
          transform: scale(1.1);
        }

        .slider::-moz-range-thumb:hover {
          background: #9333ea;
          transform: scale(1.1);
        }
      `}</style>
        </div>
    );
}
