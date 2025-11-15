# Video Editor Feature - Installation & Usage Guide

## Overview
A professional browser-based video editing interface that allows users to select, trim, arrange, and merge multiple video clips into a single video file. Built with FFmpeg.wasm for client-side video processing.

## Features

### ✨ Core Capabilities
- **Video Library**: Browse and select from fetched Pexels videos
- **Timeline Editor**: Drag-and-drop interface for arranging clips
- **Precision Trimming**: Adjust start and end times for each clip with sliders
- **Real-time Preview**: Preview individual clips before exporting
- **Video Merging**: Client-side processing using FFmpeg.wasm
- **Export**: Download the final merged video in MP4 format

### 🎯 User Experience
- **Professional UI**: Dark theme with smooth animations
- **Drag & Drop**: Reorder clips easily by dragging
- **Visual Feedback**: Progress indicators during processing
- **Responsive Design**: Works on all screen sizes
- **Keyboard Shortcuts**: ESC to close editor

## Installation

### 1. Install Dependencies

Navigate to the frontend directory and install the required packages:

```bash
cd frontend
npm install @ffmpeg/ffmpeg@^0.12.10 @ffmpeg/util@^0.12.1
```

Or if using yarn:

```bash
yarn add @ffmpeg/ffmpeg@^0.12.10 @ffmpeg/util@^0.12.1
```

### 2. Restart Development Server

```bash
npm run dev
```

## File Structure

```
frontend/
├── components/
│   └── content/
│       ├── video-editor-modal.tsx    # Main editor interface
│       ├── video-preview-modal.tsx   # Individual video preview
│       └── content-preview.tsx        # Updated with editor integration
├── lib/
│   └── video-processing.ts           # FFmpeg.wasm service
└── package.json                       # Updated dependencies
```

## Usage Guide

### For Users

1. **Navigate to Content**: Go to any content page with video suggestions
2. **Click "Edit & Merge Videos"**: Button appears when videos are available
3. **Add Clips**: Click "Add to Timeline" on videos you want to include
4. **Arrange**: Drag clips to reorder them
5. **Trim**: Use sliders to adjust start/end times for each clip
6. **Preview**: Click any clip in the timeline to preview it
7. **Export**: Click "Export Video" to process and download

### For Developers

#### VideoEditorModal Component

```tsx
import VideoEditorModal from '@/components/content/video-editor-modal';

<VideoEditorModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  videos={videosArray}
/>
```

#### Video Processing Service

```typescript
import { videoProcessingService } from '@/lib/video-processing';

// Load FFmpeg (required once)
await videoProcessingService.loadFFmpeg((progress) => {
  console.log(`Loading: ${progress}%`);
});

// Process videos
const blob = await videoProcessingService.trimAndMergeVideos(
  clips,
  (progress, message) => {
    console.log(`${message}: ${progress}%`);
  }
);
```

## Technical Details

### FFmpeg.wasm
- **Version**: 0.12.10
- **Processing**: Fully client-side (no server required)
- **Codecs**: H.264 (video), AAC (audio)
- **Format**: MP4 output

### Performance
- **Loading**: ~10-20 seconds first time (downloads WASM)
- **Processing**: Depends on video count/length
- **Memory**: Handles multiple videos efficiently
- **Quality**: Configurable CRF (default: 23 for final output)

### Processing Pipeline
1. **Download**: Fetch video files from URLs
2. **Trim**: Extract specified segments using `-ss` and `-t`
3. **Encode**: Re-encode with H.264/AAC for compatibility
4. **Concat**: Merge all trimmed clips into final video
5. **Export**: Return as downloadable Blob

## Configuration

### Video Quality

Edit `frontend/lib/video-processing.ts`:

```typescript
// For faster processing (lower quality)
'-preset', 'ultrafast',
'-crf', '28',

// For better quality (slower processing)
'-preset', 'slow',
'-crf', '18',
```

### Supported Video Formats
- Input: MP4, WebM, MOV (via Pexels)
- Output: MP4 (H.264 + AAC)

## Troubleshooting

### "Failed to load FFmpeg"
- **Cause**: Network issue or CORS
- **Solution**: Check internet connection, ensure CDN access

### "Export failed"
- **Cause**: Insufficient memory or corrupt video
- **Solution**: Use fewer/shorter clips, refresh page

### Slow Processing
- **Cause**: Large videos or many clips
- **Solution**: Reduce clip count, use shorter segments

### Cross-Origin Issues
- **Cause**: Pexels videos served from different domain
- **Solution**: Videos must support CORS (Pexels does by default)

## Browser Compatibility

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome 90+ | ✅ Full | Recommended |
| Edge 90+ | ✅ Full | Recommended |
| Firefox 90+ | ✅ Full | Works well |
| Safari 15+ | ⚠️ Limited | May have CORS issues |
| Mobile | ⚠️ Limited | Memory constraints |

## Future Enhancements

- [ ] Add video filters and effects
- [ ] Support audio track adjustments
- [ ] Add transition effects between clips
- [ ] Implement video speed control
- [ ] Support for text overlays
- [ ] Save/load project files
- [ ] Batch export multiple variations

## API Reference

### VideoProcessingService

#### `loadFFmpeg(onProgress?: (progress: number) => void): Promise<void>`
Load the FFmpeg WASM engine.

#### `trimAndMergeVideos(clips: VideoClip[], onProgress?: (progress, message) => void): Promise<Blob>`
Process and merge video clips.

#### `isFFmpegLoaded(): boolean`
Check if FFmpeg is loaded and ready.

## License
Part of the Social Media Generator project.
