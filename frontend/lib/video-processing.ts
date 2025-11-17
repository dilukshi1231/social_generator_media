export interface VideoClip {
    id: string;
    videoData: {
        video_url: string;
        duration: number;
    };
    startTime: number;
    endTime: number;
    order: number;
}

class VideoProcessingService {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private ffmpeg: any = null;
    private isLoaded = false;
    private loadPromise: Promise<void> | null = null;

    async loadFFmpeg(onProgress?: (progress: number) => void): Promise<void> {
        if (this.isLoaded) return;
        if (this.loadPromise) return this.loadPromise;

        this.loadPromise = (async () => {
            try {
                // Dynamically import FFmpeg only in browser
                if (typeof window === 'undefined') {
                    throw new Error('FFmpeg can only be loaded in browser');
                }

                const { FFmpeg } = await import('@ffmpeg/ffmpeg');
                const { toBlobURL } = await import('@ffmpeg/util');

                this.ffmpeg = new FFmpeg();

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                this.ffmpeg.on('log', ({ message }: any) => {
                    console.log('[FFmpeg]', message);
                });

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                this.ffmpeg.on('progress', ({ progress }: any) => {
                    const percentage = Math.round(progress * 100);
                    console.log(`[FFmpeg Progress] ${percentage}%`);
                    onProgress?.(percentage);
                });

                const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
                const coreURL = await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript');
                const wasmURL = await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm');

                await this.ffmpeg.load({
                    coreURL,
                    wasmURL,
                });

                this.isLoaded = true;
                console.log('[FFmpeg] Loaded successfully');
            } catch (error) {
                console.error('[FFmpeg] Load error:', error);
                this.loadPromise = null;
                throw new Error('Failed to load FFmpeg');
            }
        })();

        return this.loadPromise;
    }

    async trimAndMergeVideos(
        clips: VideoClip[],
        onProgress?: (progress: number, message: string) => void
    ): Promise<Blob> {
        if (!this.ffmpeg || !this.isLoaded) {
            throw new Error('FFmpeg not loaded');
        }

        try {
            const { fetchFile } = await import('@ffmpeg/util');

            onProgress?.(5, 'Downloading video clips...');

            // Sort clips by order
            const sortedClips = [...clips].sort((a, b) => a.order - b.order);

            // Download all video files
            const videoFiles: string[] = [];
            for (let i = 0; i < sortedClips.length; i++) {
                const clip = sortedClips[i];
                const fileName = `input_${i}.mp4`;

                onProgress?.(10 + (i / sortedClips.length) * 20, `Downloading clip ${i + 1}/${sortedClips.length}...`);

                const videoData = await fetchFile(clip.videoData.video_url);
                await this.ffmpeg.writeFile(fileName, videoData);

                videoFiles.push(fileName);
            }

            onProgress?.(35, 'Trimming and normalizing clips...');

            // Trim and normalize each video clip to ensure compatibility
            const trimmedFiles: string[] = [];
            for (let i = 0; i < sortedClips.length; i++) {
                const clip = sortedClips[i];
                const inputFile = videoFiles[i];
                const outputFile = `trimmed_${i}.mp4`;

                onProgress?.(40 + (i / sortedClips.length) * 30, `Processing clip ${i + 1}/${sortedClips.length}...`);

                // Trim and re-encode with consistent settings for all videos
                const duration = clip.endTime - clip.startTime;
                await this.ffmpeg.exec([
                    '-i', inputFile,
                    '-ss', clip.startTime.toString(),
                    '-t', duration.toString(),
                    // Video settings - normalize all clips
                    '-c:v', 'libx264',
                    '-profile:v', 'main',
                    '-level', '4.0',
                    '-pix_fmt', 'yuv420p',
                    '-r', '30', // Set consistent frame rate
                    '-preset', 'ultrafast',
                    '-crf', '23',
                    // Audio settings - normalize all clips
                    '-c:a', 'aac',
                    '-ar', '44100', // Set consistent sample rate
                    '-ac', '2', // Stereo audio
                    '-b:a', '128k',
                    // Ensure streams are present
                    '-map', '0:v:0',
                    '-map', '0:a:0?', // Optional audio (? means don't fail if no audio)
                    '-movflags', '+faststart',
                    outputFile
                ]);

                trimmedFiles.push(outputFile);
            }

            onProgress?.(75, 'Merging video clips...');

            // Create concat file for merging
            const concatContent = trimmedFiles.map(f => `file '${f}'`).join('\n');
            await this.ffmpeg.writeFile('concat_list.txt', new TextEncoder().encode(concatContent));

            // Merge all trimmed videos using concat demuxer
            // Since we normalized all clips, they should concatenate smoothly
            await this.ffmpeg.exec([
                '-f', 'concat',
                '-safe', '0',
                '-i', 'concat_list.txt',
                '-c', 'copy', // Copy streams since they're already normalized
                'output.mp4'
            ]);

            onProgress?.(95, 'Finalizing video...');

            // Read the output file
            const data = await this.ffmpeg.readFile('output.mp4');
            const blob = new Blob([data.buffer], { type: 'video/mp4' });

            onProgress?.(100, 'Complete!');

            // Cleanup
            for (const file of [...videoFiles, ...trimmedFiles, 'output.mp4', 'concat_list.txt']) {
                try {
                    await this.ffmpeg.deleteFile(file);
                } catch {
                    // Ignore cleanup errors
                }
            }

            return blob;
        } catch (error) {
            console.error('[FFmpeg] Processing error:', error);

            // Log FFmpeg logs for debugging
            if (this.ffmpeg) {
                try {
                    const logs = await this.ffmpeg.readFile('ffmpeg.log');
                    console.error('[FFmpeg Logs]', new TextDecoder().decode(logs));
                } catch {
                    // No logs available
                }
            }

            throw new Error(`Video processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    isFFmpegLoaded(): boolean {
        return this.isLoaded;
    }
}

// Singleton instance
export const videoProcessingService = new VideoProcessingService();
