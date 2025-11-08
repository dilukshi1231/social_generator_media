// frontend/components/content/video-player-with-audio.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Loader2, 
  Download,
  Sparkles,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface VideoPlayerProps {
  video: {
    id: number;
    url: string;
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
}

export default function VideoPlayerWithAudio({ video }: VideoPlayerProps) {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  // Audio generation states
  const [videoDescription, setVideoDescription] = useState<string>('');
  const [audioData, setAudioData] = useState<string | null>(null);
  const [isAnalyzingVideo, setIsAnalyzingVideo] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('21m00Tcm4TlvDq8ikWAM');
  const [syncAudioWithVideo, setSyncAudioWithVideo] = useState(true);

  // Available voices
  const voices = [
    { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel - Natural, Clear' },
    { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi - Strong, Confident' },
    { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella - Soft, Warm' },
    { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni - Well-rounded' },
    { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli - Emotional' },
    { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh - Deep, Authoritative' },
  ];

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (videoRef.current) {
        videoRef.current.pause();
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  // Video time update
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, []);

  // Analyze video and generate description using AI
  const analyzeAndDescribeVideo = async () => {
    setIsAnalyzingVideo(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('access_token');

      if (!token) {
        throw new Error('No authentication token found');
      }

      toast({
        title: 'Analyzing video...',
        description: 'AI is watching and understanding the video content',
      });

      const response = await fetch(`${API_URL}/api/v1/content/analyze-video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          video_url: video.video_url,
          video_id: video.id,
          duration: video.duration,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to analyze video');
      }

      const data = await response.json();
      
      if (data.success) {
        setVideoDescription(data.description);
        toast({
          title: 'Video analyzed successfully!',
          description: 'AI has generated a description of the video',
        });
        
        // Automatically generate audio after analysis
        await generateAudioFromDescription(data.description);
      } else {
        throw new Error(data.error || 'Failed to analyze video');
      }
    } catch (error) {
      console.error('[analyzeVideo] Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to analyze video';
      toast({
        title: 'Video analysis failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzingVideo(false);
    }
  };

  // Generate audio from video description
  const generateAudioFromDescription = async (description: string) => {
    setIsGeneratingAudio(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('access_token');

      if (!token) {
        throw new Error('No authentication token found');
      }

      toast({
        title: 'Generating voiceover...',
        description: 'Creating narration from video description',
      });

      const response = await fetch(`${API_URL}/api/v1/content/generate-audio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          text: description,
          voice_id: selectedVoice,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to generate audio');
      }

      const data = await response.json();
      
      if (data.success) {
        setAudioData(data.audio_data_url);
        toast({
          title: 'Voiceover ready!',
          description: `Audio generated successfully (${(data.size_bytes / 1024).toFixed(1)} KB)`,
        });
      } else {
        throw new Error(data.error || 'Failed to generate audio');
      }
    } catch (error) {
      console.error('[generateAudio] Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate audio';
      toast({
        title: 'Audio generation failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  // Play/Pause video
  const toggleVideo = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
      if (syncAudioWithVideo && audioRef.current && isAudioPlaying) {
        audioRef.current.pause();
      }
    } else {
      videoRef.current.play();
      if (syncAudioWithVideo && audioData && audioRef.current) {
        audioRef.current.play();
      }
    }
    setIsPlaying(!isPlaying);
  };

  // Toggle mute
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    const container = videoRef.current?.parentElement;
    if (!container) return;

    if (!isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  // Seek video
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
    if (syncAudioWithVideo && audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  // Format time
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Download audio
  const downloadAudio = () => {
    if (!audioData) return;

    const link = document.createElement('a');
    link.href = audioData;
    link.download = `video_description_${video.id}_${Date.now()}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: 'Download started',
      description: 'Audio narration is being downloaded',
    });
  };

  // Handle video ended
  useEffect(() => {
    const video = videoRef.current;
    const audio = audioRef.current;

    if (!video) return;

    const handleVideoEnded = () => {
      setIsPlaying(false);
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
        setIsAudioPlaying(false);
      }
    };

    video.addEventListener('ended', handleVideoEnded);
    return () => video.removeEventListener('ended', handleVideoEnded);
  }, []);

  return (
    <Card className="overflow-hidden border-2 border-slate-200 hover:border-purple-300 transition-all hover:shadow-xl">
      {/* Video Player */}
      <div className="relative aspect-video bg-black group">
        <video
          ref={videoRef}
          src={video.video_url}
          className="w-full h-full object-contain"
          poster={video.image}
          onPlay={() => {
            setIsPlaying(true);
            if (syncAudioWithVideo && audioData && audioRef.current) {
              audioRef.current.play();
              setIsAudioPlaying(true);
            }
          }}
          onPause={() => {
            setIsPlaying(false);
            if (syncAudioWithVideo && audioRef.current) {
              audioRef.current.pause();
              setIsAudioPlaying(false);
            }
          }}
        />

        {/* Play button overlay (when paused) */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <Button
              onClick={toggleVideo}
              size="lg"
              className="bg-white/90 hover:bg-white text-purple-600 rounded-full w-20 h-20 shadow-2xl"
            >
              <Play className="h-10 w-10 ml-1" />
            </Button>
          </div>
        )}

        {/* Video controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Progress bar */}
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full mb-3 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-purple-600"
          />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                onClick={toggleVideo}
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/20"
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </Button>
              <Button
                onClick={toggleMute}
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/20"
              >
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </Button>
              <span className="text-sm text-white font-medium">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {isAudioPlaying && (
                <span className="text-xs text-purple-300 font-medium flex items-center gap-1">
                  <Volume2 className="h-3 w-3 animate-pulse" />
                  AI Narration
                </span>
              )}
              <Button
                onClick={toggleFullscreen}
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/20"
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <CardContent className="p-4 space-y-4">
        {/* Video info */}
        <div className="flex items-center justify-between text-sm">
          <div className="text-slate-600">
            by <span className="font-medium">{video.user.name}</span>
          </div>
          <div className="text-xs text-slate-500">
            {video.width}x{video.height} • {Math.floor(video.duration)}s
          </div>
        </div>

        {/* AI Description & Audio section */}
        <div className="space-y-3 pt-3 border-t-2 border-slate-200">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <Sparkles className="h-5 w-5 text-purple-600" />
            AI Video Description & Narration
          </div>

          {/* Description display */}
          {videoDescription && (
            <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border-2 border-purple-200">
              <p className="text-xs font-medium text-purple-700 mb-1">AI Description:</p>
              <p className="text-sm text-slate-700 leading-relaxed">{videoDescription}</p>
            </div>
          )}

          {/* Voice selection */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">
              Select Narrator Voice
            </label>
            <select
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              className="w-full p-2.5 border-2 border-slate-200 rounded-lg text-sm focus:border-purple-400 focus:outline-none bg-white"
              disabled={isAnalyzingVideo || isGeneratingAudio}
            >
              {voices.map((voice) => (
                <option key={voice.id} value={voice.id}>
                  {voice.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sync option */}
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={syncAudioWithVideo}
              onChange={(e) => setSyncAudioWithVideo(e.target.checked)}
              className="w-4 h-4 text-purple-600 border-slate-300 rounded focus:ring-purple-500"
            />
            <span>Sync narration with video playback</span>
          </label>

          {/* Analyze & Generate button */}
          {!videoDescription && (
            <Button
              onClick={analyzeAndDescribeVideo}
              disabled={isAnalyzingVideo || isGeneratingAudio}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 h-11"
            >
              {isAnalyzingVideo ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing Video...
                </>
              ) : isGeneratingAudio ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating Narration...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Analyze & Generate Narration
                </>
              )}
            </Button>
          )}

          {/* Regenerate button */}
          {videoDescription && (
            <div className="flex gap-2">
              <Button
                onClick={analyzeAndDescribeVideo}
                disabled={isAnalyzingVideo || isGeneratingAudio}
                variant="outline"
                className="flex-1 border-purple-300 hover:bg-purple-50"
              >
                {isAnalyzingVideo || isGeneratingAudio ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                Regenerate
              </Button>
              {audioData && (
                <Button
                  onClick={downloadAudio}
                  variant="outline"
                  className="border-purple-300 hover:bg-purple-50"
                >
                  <Download className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}

          {/* Hidden audio element */}
          {audioData && (
            <audio
              ref={audioRef}
              src={audioData}
              onPlay={() => setIsAudioPlaying(true)}
              onPause={() => setIsAudioPlaying(false)}
              onEnded={() => setIsAudioPlaying(false)}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}