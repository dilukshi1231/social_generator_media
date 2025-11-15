import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Check, X, RefreshCw, Facebook, Instagram, Linkedin, Image as ImageIcon, Copy, Sparkles, Video, ExternalLink, Loader2, Volume2, Play, Pause, Download, Scissors } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import type { Content } from '@/types';
import Image from 'next/image';
import PublishDialog from '@/components/content/publish-dialog';
import VideoPreviewModal from '@/components/content/video-preview-modal';
import VideoEditorModal from '@/components/content/video-editor-modal';
// Video player component not used here; import removed to fix unused import warnings

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

interface ContentPreviewProps {
  content: Content;
  onApprove?: () => Promise<boolean | void> | boolean | void;
  onReject: () => void;
  onRegenerateCaptions: () => void;
  onRegenerateImage: () => void;
  isLoading?: boolean;
}

interface VideoResult {
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
}

interface AudioData {
  success: boolean;
  audio_base64?: string;
  audio_data_url?: string;
  size_bytes?: number;
  voice_id?: string;
  error?: string;
}

export default function ContentPreview({
  content,
  onApprove,
  onReject,
  onRegenerateCaptions,
  onRegenerateImage,
  isLoading = false,
}: ContentPreviewProps) {
  const { toast } = useToast();
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [videos, setVideos] = useState<VideoResult[]>([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);

  // Video preview modal state
  const [selectedVideo, setSelectedVideo] = useState<VideoResult | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  // Video editor modal state
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // Audio states
  const [audioData, setAudioData] = useState<AudioData | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [selectedVoice, setSelectedVoice] = useState('21m00Tcm4TlvDq8ikWAM');

  // Handler to open video preview modal
  const handleVideoClick = (video: VideoResult) => {
    setSelectedVideo(video);
    setIsVideoModalOpen(true);
  };

  // Handler to close video preview modal
  const handleCloseVideoModal = () => {
    setIsVideoModalOpen(false);
    setSelectedVideo(null);
  };

  // Handler to open video editor
  const handleOpenEditor = () => {
    setIsEditorOpen(true);
  };

  // Memoized fetchVideos function to prevent infinite loops
  const fetchVideos = useCallback(async (searchQuery: string) => {
    console.log('[fetchVideos] Starting video search for:', searchQuery);
    setIsLoadingVideos(true);
    setVideoError(null);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('access_token');

      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('[fetchVideos] Calling API:', `${API_URL}/api/v1/content/search-videos`);

      const response = await fetch(`${API_URL}/api/v1/content/search-videos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt: searchQuery,
          per_page: 6,  // Increased to 6 for better grid layout
        }),
      });

      console.log('[fetchVideos] Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[fetchVideos] API error:', errorText);
        throw new Error(`Failed to fetch videos: ${response.status}`);
      }

      const data = await response.json();
      console.log('[fetchVideos] Response data:', data);

      if (data.success && data.videos) {
        console.log('[fetchVideos] Videos found:', data.videos.length);
        setVideos(data.videos);

        if (data.videos.length === 0) {
          setVideoError('No portrait videos found for this topic. Try a different search term.');
        }
      } else {
        console.error('[fetchVideos] API returned unsuccessful response:', data);
        throw new Error(data.error || 'Failed to fetch videos');
      }
    } catch (error) {
      console.error('[fetchVideos] Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch videos';
      setVideoError(errorMessage);
      toast({
        title: 'Video search failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoadingVideos(false);
    }
  }, [toast]);

  // Fetch videos when content topic is available
  useEffect(() => {
    const searchQuery = content?.image_prompt || content?.topic;

    if (searchQuery) {
      console.log('[useEffect] Triggering video search with query:', searchQuery);
      fetchVideos(searchQuery);
    } else {
      console.log('[useEffect] No search query available');
    }
  }, [content?.topic, content?.image_prompt, fetchVideos]);

  // Cleanup audio element on unmount
  useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
      }
    };
  }, [audioElement]);

  const handleApproveAndPublish = async () => {
    if (onApprove) {
      const result = await onApprove();
      if (result === false) {
        return;
      }
    }
    setPublishDialogOpen(true);
  };

  // Generate audio from caption
  const generateAudio = async (caption: string) => {
    if (!caption || !caption.trim()) {
      toast({
        title: 'Error',
        description: 'No caption available to generate audio',
        variant: 'destructive',
      });
      return;
    }

    setIsGeneratingAudio(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('access_token');

      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_URL}/api/v1/content/generate-audio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          text: caption,
          voice_id: selectedVoice,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to generate audio');
      }

      const data: AudioData = await response.json();

      if (data.success) {
        setAudioData(data);
        // Stop any currently playing audio
        if (audioElement) {
          audioElement.pause();
          setIsPlayingAudio(false);
        }
        toast({
          title: 'Success!',
          description: `Audio generated successfully (${(data.size_bytes! / 1024).toFixed(1)} KB)`,
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
  // Updated content-preview.tsx with AI summarization
  // Add this new state and function at the top of your component:

  const [summarizedPrompt, setSummarizedPrompt] = useState<string>('');
  const [isSummarizing, setIsSummarizing] = useState(false);

  // Add this function to summarize the video prompt using Gemini API
  const summarizeVideoPrompt = useCallback(async (fullPrompt: string): Promise<string> => {
    if (!fullPrompt || fullPrompt.trim() === '') {
      return '';
    }

    // Check word count first
    const wordCount = fullPrompt.trim().split(/\s+/).length;
    if (wordCount <= 50) {
      // Already short enough, no need to summarize
      return fullPrompt;
    }

    setIsSummarizing(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('access_token');

      if (!token) {
        throw new Error('No authentication token found');
      }

      // Call backend to summarize using Gemini
      const response = await fetch(`${API_URL}/api/v1/content/summarize-prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt: fullPrompt,
          max_words: 50,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to summarize prompt');
      }

      const data = await response.json();
      return data.summarized_prompt || fullPrompt;

    } catch (error) {
      console.error('[Summarize] Error:', error);
      toast({
        title: 'Summarization failed',
        description: 'Using original prompt',
        variant: 'destructive',
      });
      // Fallback: Simple word limit
      return fullPrompt.split(/\s+/).slice(0, 50).join(' ') + '...';
    } finally {
      setIsSummarizing(false);
    }
  }, [toast]);

  // Add this useEffect to summarize when content loads
  useEffect(() => {
    const prompt = content.image_prompt || content.topic;
    if (prompt) summarizeVideoPrompt(prompt).then(setSummarizedPrompt);
  }, [content.image_prompt, content.topic]);

  // Replace the "AI Voiceover Generation" Card section:
  // Play/Pause audio
  const toggleAudioPlayback = () => {
    if (!audioData?.audio_data_url) return;

    if (audioElement) {
      if (isPlayingAudio) {
        audioElement.pause();
        setIsPlayingAudio(false);
      } else {
        audioElement.play();
        setIsPlayingAudio(true);
      }
    } else {
      const audio = new Audio(audioData.audio_data_url);
      audio.onended = () => setIsPlayingAudio(false);
      audio.onerror = () => {
        setIsPlayingAudio(false);
        toast({
          title: 'Playback error',
          description: 'Failed to play audio',
          variant: 'destructive',
        });
      };
      audio.play();
      setAudioElement(audio);
      setIsPlayingAudio(true);
    }
  };

  // Download audio
  const downloadAudio = () => {
    if (!audioData?.audio_data_url) return;

    const link = document.createElement('a');
    link.href = audioData.audio_data_url;
    link.download = `voiceover_${Date.now()}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Download started',
      description: 'Audio file is being downloaded',
    });
  };

  const platforms = [
    {
      name: 'Facebook',
      icon: Facebook,
      caption: content.facebook_caption,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      caption: content.linkedin_caption,
      color: 'text-blue-700',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-300',
    },
    {
      name: 'Twitter',
      icon: XIcon,
      caption: content.twitter_caption,
      color: 'text-slate-900',
      bgColor: 'bg-slate-50',
      borderColor: 'border-slate-200',
    },
    {
      name: 'TikTok',
      icon: TikTokIcon,
      caption: content.threads_caption,
      color: 'text-gray-900',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
    },
  ];

  const copyToClipboard = (text: string, platform: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: `${platform} caption copied to clipboard`,
    });
  };

  // (Removed unused caption helper and platform state.)

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Success Header */}
      <Card className="border-0 shadow-2xl bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg">
                  <Check className="h-7 w-7 text-white" />
                </div>
                <div>
                  <CardTitle className="text-3xl font-bold bg-gradient-to-r from-green-700 to-emerald-700 bg-clip-text text-transparent">
                    Content Generated Successfully! 🎉
                  </CardTitle>
                  <p className="text-base text-slate-600 mt-1">
                    Your AI-powered content is ready for review
                  </p>
                </div>
              </div>
            </div>
            <Badge
              variant={content.status === 'approved' ? 'default' : 'secondary'}
              className="px-5 py-2.5 text-base font-semibold shadow-md"
            >
              {content.status.replace('_', ' ')}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Image Preview */}
      <Card className="border-0 shadow-2xl bg-white/80">
        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-b-2 border-slate-100">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-3 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl shadow-lg">
              <ImageIcon className="h-6 w-6 text-white" />
            </div>
            <span className="bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent font-bold">
              Generated Image
            </span>
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={onRegenerateImage}
            disabled={isLoading}
            className="hover:bg-white hover:border-indigo-300"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Regenerate
          </Button>
        </CardHeader>
        <CardContent className="p-6">
          {content.image_url ? (
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 shadow-2xl">
              <Image
                src={content.image_url}
                alt="Generated content"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          ) : (
            <div className="w-full aspect-video rounded-2xl bg-gradient-to-br from-slate-100 to-slate-300 flex items-center justify-center">
              <div className="text-center">
                <ImageIcon className="h-12 w-12 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-500 font-medium">No image generated</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Video Suggestions - Portrait Layout */}
      <Card className="border-0 shadow-2xl bg-white/80">
        <CardHeader className="bg-gradient-to-r from-purple-50 via-pink-50 to-purple-50 border-b-2 border-slate-100">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-3 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl shadow-lg">
                <Video className="h-6 w-6 text-white" />
              </div>
              <span className="bg-gradient-to-r from-purple-700 to-pink-700 bg-clip-text text-transparent font-bold">
                Suggested Portrait Videos from Pexels
              </span>
            </CardTitle>
            {videos.length > 0 && (
              <Button
                onClick={handleOpenEditor}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <Scissors className="h-4 w-4 mr-2" />
                Edit & Merge Videos
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {isLoadingVideos ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              <span className="ml-3 text-slate-600">Searching for portrait videos...</span>
            </div>
          ) : videoError ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                <X className="h-8 w-8 text-red-600" />
              </div>
              <p className="text-red-600 font-medium mb-2">Video Search Failed</p>
              <p className="text-sm text-slate-600 mb-4">{videoError}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchVideos(content.image_prompt || content.topic)}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          ) : videos.length === 0 ? (
            <div className="text-center py-12">
              <Video className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 font-medium mb-2">No portrait videos found</p>
              <p className="text-sm text-slate-500">Try a different search term</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {videos.map((video) => (
                <div
                  key={video.id}
                  className="group relative rounded-xl overflow-hidden border-2 border-slate-200 hover:border-purple-300 transition-all hover:shadow-lg cursor-pointer"
                  onClick={() => handleVideoClick(video)}
                >
                  <div className="relative aspect-[9/16] bg-slate-100">
                    <Image
                      src={video.image}
                      alt="Video preview"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="bg-white/90 rounded-full p-3 shadow-lg">
                        <Play className="h-8 w-8 text-purple-600 fill-purple-600" />
                      </div>
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      {Math.floor(video.duration)}s
                    </div>
                  </div>
                  <div className="p-2 bg-white">
                    <p className="text-xs text-slate-600 mb-1 truncate">
                      {video.width}x{video.height}
                    </p>
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs text-slate-500 truncate flex-1">{video.user.name}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(video.video_url, '_blank');
                        }}
                        className="h-6 px-1.5 shrink-0"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Audio Generation Section */}
      <Card className="border-0 shadow-2xl bg-white/80">
        <CardHeader className="bg-gradient-to-r from-orange-50 via-pink-50 to-purple-50 border-b-2 border-slate-100">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-3 bg-gradient-to-br from-orange-600 to-pink-600 rounded-xl shadow-lg">
              <Volume2 className="h-6 w-6 text-white" />
            </div>
            <span className="bg-gradient-to-r from-orange-700 to-pink-700 bg-clip-text text-transparent font-bold">
              AI Voiceover Generation
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Summarized Video Prompt Display (Read-only) */}
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                Video Prompt Summary (Max 50 words)
                {isSummarizing && (
                  <Loader2 className="h-4 w-4 animate-spin text-orange-600" />
                )}
              </label>
              <div className="relative">
                <textarea
                  value={isSummarizing ? 'Summarizing prompt...' : (summarizedPrompt || 'Loading...')}
                  readOnly
                  rows={3}
                  className="w-full p-3 border-2 border-slate-200 rounded-xl bg-slate-50 text-slate-700 resize-none cursor-not-allowed"
                />
                <Badge className="absolute top-2 right-2 bg-gradient-to-r from-blue-500 to-purple-500">
                  AI Summarized
                </Badge>
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-slate-500">
                  ✨ Automatically summarized from your content prompt
                </p>
                <p className="text-xs font-medium text-slate-600">
                  {summarizedPrompt.split(/\s+/).filter(w => w.length > 0).length} words
                </p>
              </div>

              {/* Show original prompt in collapsible section */}
              <details className="mt-3 group">
                <summary className="text-xs text-blue-600 cursor-pointer hover:text-blue-700 font-medium">
                  View original full prompt
                </summary>
                <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {content.image_prompt || content.topic}
                  </p>
                </div>
              </details>
            </div>

            {/* Voice Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Select Voice
              </label>
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                className="w-full p-3 border-2 border-slate-200 rounded-xl focus:border-orange-400 focus:outline-none bg-white"
                disabled={isSummarizing}
              >
                <option value="21m00Tcm4TlvDq8ikWAM">Rachel - Natural, Clear</option>
                <option value="AZnzlk1XvdvUeBnXmlld">Domi - Strong, Confident</option>
                <option value="EXAVITQu4vr4xnSDxMaL">Bella - Soft, Warm</option>
                <option value="ErXwobaYiN019PkySvjV">Antoni - Well-rounded</option>
                <option value="MF3mGyEYCl7XYWbV9V6O">Elli - Emotional</option>
                <option value="TxGEqnHWrfWFTfGW9XjX">Josh - Deep, Authoritative</option>
                <option value="VR6AewLTigWG4xSOukaG">Arnold - Crisp, Professional</option>
                <option value="pNInz6obpgDQGcFmaJgB">Adam - Narrative Style</option>
              </select>
            </div>

            {/* Generate Button */}
            <Button
              onClick={() => generateAudio(summarizedPrompt)}
              disabled={isGeneratingAudio || isSummarizing || !summarizedPrompt}
              className="w-full h-14 text-lg bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700"
            >
              {isGeneratingAudio ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Generating Voiceover...
                </>
              ) : isSummarizing ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Preparing Prompt...
                </>
              ) : (
                <>
                  <Volume2 className="h-5 w-5 mr-2" />
                  Generate Voiceover from Summary
                </>
              )}
            </Button>

            {/* Audio Player */}
            {audioData && audioData.success && (
              <div className="p-6 bg-gradient-to-r from-orange-50 to-pink-50 rounded-xl border-2 border-orange-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button
                      onClick={toggleAudioPlayback}
                      size="lg"
                      className="bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700"
                    >
                      {isPlayingAudio ? (
                        <>
                          <Pause className="h-5 w-5 mr-2" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="h-5 w-5 mr-2" />
                          Play
                        </>
                      )}
                    </Button>
                    <div className="text-sm text-slate-600">
                      <p className="font-semibold flex items-center gap-2">
                        <Volume2 className="h-4 w-4 text-orange-600" />
                        Audio Ready!
                      </p>
                      <p>Size: {audioData.size_bytes ? (audioData.size_bytes / 1024).toFixed(1) : '0'} KB</p>
                    </div>
                  </div>
                  <Button
                    onClick={downloadAudio}
                    variant="outline"
                    className="border-orange-300 hover:bg-orange-50"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download MP3
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Captions Preview */}
      <Card className="border-0 shadow-2xl bg-white/80">
        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 border-b-2 border-slate-100">
          <CardTitle className="text-xl font-bold flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
              Platform Captions
            </span>
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={onRegenerateCaptions}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Regenerate All
          </Button>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs defaultValue="facebook" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              {platforms.map((platform) => (
                <TabsTrigger key={platform.name} value={platform.name.toLowerCase()}>
                  <platform.icon className={`h-4 w-4 mr-1.5 ${platform.color}`} />
                  <span className="hidden sm:inline">{platform.name}</span>
                </TabsTrigger>
              ))}
            </TabsList>
            {platforms.map((platform) => (
              <TabsContent key={platform.name} value={platform.name.toLowerCase()} className="space-y-4 mt-6">
                <div className={`p-8 ${platform.bgColor} rounded-2xl border-2 ${platform.borderColor}`}>
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white rounded-xl shadow-md">
                        <platform.icon className={`h-7 w-7 ${platform.color}`} />
                      </div>
                      <span className="font-bold text-xl text-slate-900">{platform.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(platform.caption || '', platform.name)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                  <div className="p-5 bg-white/60 rounded-xl">
                    <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">
                      {platform.caption || 'No caption generated'}
                    </p>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {content.status === 'pending_approval' && (
        <Card className="border-0 shadow-2xl">
          <CardContent className="pt-8 pb-8">
            <div className="flex flex-col sm:flex-row gap-5">
              <Button
                onClick={handleApproveAndPublish}
                size="lg"
                className="flex-1 h-20 text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600"
                disabled={isLoading}
              >
                <Check className="mr-3 h-7 w-7" />
                Approve & Save Content
              </Button>
              <Button
                onClick={onReject}
                size="lg"
                variant="outline"
                className="flex-1 h-20 text-xl font-bold"
                disabled={isLoading}
              >
                <X className="mr-3 h-7 w-7" />
                Reject & Regenerate
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Publish Dialog */}
      <PublishDialog
        open={publishDialogOpen}
        onOpenChange={setPublishDialogOpen}
        content={content}
      />

      {/* Video Preview Modal */}
      <VideoPreviewModal
        isOpen={isVideoModalOpen}
        onClose={handleCloseVideoModal}
        video={selectedVideo}
      />

      {/* Video Editor Modal */}
      <VideoEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        videos={videos}
      />
    </div>
  );
}