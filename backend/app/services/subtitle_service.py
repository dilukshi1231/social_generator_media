# backend/app/services/subtitle_service.py
import os
import re
import subprocess
import asyncio
from pathlib import Path
from typing import Dict, List, Optional
from datetime import timedelta


class SubtitleService:
    """Service for generating and embedding subtitles using FFmpeg."""
    
    def __init__(self):
        self.temp_dir = Path("uploads/temp")
        self.temp_dir.mkdir(parents=True, exist_ok=True)
    
    def generate_webvtt(
        self, 
        text: str, 
        duration: float,
        words_per_second: float = 2.5
    ) -> str:
        """
        Generate WebVTT subtitle file content from text.
        
        Args:
            text: The narration text
            duration: Video duration in seconds
            words_per_second: Average speaking rate
        
        Returns:
            WebVTT file content as string
        """
        # Split text into sentences
        sentences = re.split(r'[.!?]+', text)
        sentences = [s.strip() for s in sentences if s.strip()]
        
        if not sentences:
            return "WEBVTT\n\n"
        
        # Calculate timing for each sentence
        total_words = len(text.split())
        estimated_duration = total_words / words_per_second
        
        # Adjust if estimated duration differs from actual
        time_ratio = duration / estimated_duration if estimated_duration > 0 else 1
        
        vtt_content = "WEBVTT\n\n"
        current_time = 0.0
        
        for i, sentence in enumerate(sentences):
            words_in_sentence = len(sentence.split())
            sentence_duration = (words_in_sentence / words_per_second) * time_ratio
            
            # Ensure we don't exceed video duration
            if current_time + sentence_duration > duration:
                sentence_duration = duration - current_time
            
            start_time = self._format_timestamp(current_time)
            end_time = self._format_timestamp(current_time + sentence_duration)
            
            vtt_content += f"{i + 1}\n"
            vtt_content += f"{start_time} --> {end_time}\n"
            vtt_content += f"{sentence}\n\n"
            
            current_time += sentence_duration
            
            # Stop if we've reached the end
            if current_time >= duration:
                break
        
        return vtt_content
    
    def _format_timestamp(self, seconds: float) -> str:
        """Format seconds to WebVTT timestamp (HH:MM:SS.mmm)"""
        td = timedelta(seconds=seconds)
        hours = int(td.total_seconds() // 3600)
        minutes = int((td.total_seconds() % 3600) // 60)
        secs = td.total_seconds() % 60
        return f"{hours:02d}:{minutes:02d}:{secs:06.3f}"
    
    async def embed_subtitles_in_video(
        self,
        video_path: str,
        subtitle_text: str,
        duration: float,
        output_path: Optional[str] = None
    ) -> Dict:
        """
        Embed soft subtitles into video using FFmpeg.
        
        Args:
            video_path: Path to input video
            subtitle_text: Text to convert to subtitles
            duration: Video duration
            output_path: Optional custom output path
        
        Returns:
            Dictionary with output path and success status
        """
        try:
            # Generate WebVTT content
            vtt_content = self.generate_webvtt(subtitle_text, duration)
            
            # Save VTT file temporarily
            vtt_filename = f"subtitles_{os.path.basename(video_path)}.vtt"
            vtt_path = self.temp_dir / vtt_filename
            
            with open(vtt_path, 'w', encoding='utf-8') as f:
                f.write(vtt_content)
            
            # Determine output path
            if not output_path:
                video_name = Path(video_path).stem
                output_path = str(Path(video_path).parent / f"{video_name}_subtitled.mp4")
            
            # FFmpeg command to add soft subtitles
            cmd = [
                'ffmpeg',
                '-y',  # Overwrite output
                '-i', str(video_path),  # Input video
                '-i', str(vtt_path),    # Input subtitles
                '-c:v', 'copy',         # Copy video stream
                '-c:a', 'copy',         # Copy audio stream
                '-c:s', 'mov_text',     # Subtitle codec for MP4
                '-metadata:s:s:0', 'language=eng',
                '-metadata:s:s:0', 'title=English',
                str(output_path)
            ]
            
            # Run FFmpeg
            loop = asyncio.get_running_loop()
            
            def run_cmd():
                return subprocess.run(
                    cmd,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    check=True
                )
            
            await loop.run_in_executor(None, run_cmd)
            
            # Cleanup temp VTT file
            vtt_path.unlink(missing_ok=True)
            
            return {
                "success": True,
                "output_path": output_path,
                "subtitle_file": str(vtt_path),
                "message": "Subtitles embedded successfully"
            }
            
        except subprocess.CalledProcessError as e:
            stderr = e.stderr.decode('utf-8', errors='ignore') if e.stderr else ''
            return {
                "success": False,
                "error": f"FFmpeg error: {stderr}",
                "output_path": None
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to embed subtitles: {str(e)}",
                "output_path": None
            }
    
    async def generate_vtt_file_only(
        self,
        text: str,
        duration: float,
        output_filename: str
    ) -> Dict:
        """
        Generate standalone VTT file without embedding in video.
        Useful for browser-side subtitle tracks.
        
        Args:
            text: Subtitle text
            duration: Duration in seconds
            output_filename: Output filename
        
        Returns:
            Dictionary with file path and URL
        """
        try:
            vtt_content = self.generate_webvtt(text, duration)
            
            subtitles_dir = Path("uploads/subtitles")
            subtitles_dir.mkdir(parents=True, exist_ok=True)
            
            vtt_path = subtitles_dir / output_filename
            
            with open(vtt_path, 'w', encoding='utf-8') as f:
                f.write(vtt_content)
            
            return {
                "success": True,
                "file_path": str(vtt_path),
                "subtitle_url": f"/uploads/subtitles/{output_filename}",
                "message": "Subtitle file generated successfully"
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to generate VTT file: {str(e)}"
            }