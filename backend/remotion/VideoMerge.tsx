// backend/remotion/VideoMerge.tsx
import React from 'react';
import { AbsoluteFill, Video, useCurrentFrame, useVideoConfig, Sequence } from 'remotion';

export interface VideoClip {
  path: string;
  duration: number;
  width: number;
  height: number;
}

export interface VideoMergeProps {
  videos: VideoClip[];
}

export const VideoMerge: React.FC<VideoMergeProps> = ({ videos }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Calculate start frames for each video
  let startFrame = 0;
  const videoSequences = videos.map((video, index) => {
    const durationInFrames = Math.floor(video.duration * fps);
    const sequence = {
      video,
      startFrame,
      durationInFrames,
      index,
    };
    startFrame += durationInFrames;
    return sequence;
  });

  return (
    <AbsoluteFill style={{ backgroundColor: 'black' }}>
      {videoSequences.map((seq) => (
        <Sequence
          key={seq.index}
          from={seq.startFrame}
          durationInFrames={seq.durationInFrames}
        >
          <AbsoluteFill
            style={{
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Video
              src={seq.video.path}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
              startFrom={0}
              endAt={seq.durationInFrames}
            />
            
            {/* Optional: Add transition effects */}
            <TransitionEffect
              frame={frame - seq.startFrame}
              durationInFrames={seq.durationInFrames}
              isFirst={seq.index === 0}
              isLast={seq.index === videos.length - 1}
            />
          </AbsoluteFill>
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

// Optional transition effect component
const TransitionEffect: React.FC<{
  frame: number;
  durationInFrames: number;
  isFirst: boolean;
  isLast: boolean;
}> = ({ frame, durationInFrames, isFirst, isLast }) => {
  const transitionFrames = 15; // 0.5 second transition at 30fps
  
  // Fade in at start
  let opacity = 1;
  if (!isFirst && frame < transitionFrames) {
    opacity = frame / transitionFrames;
  }
  
  // Fade out at end
  if (!isLast && frame > durationInFrames - transitionFrames) {
    opacity = (durationInFrames - frame) / transitionFrames;
  }
  
  if (opacity === 1) return null;
  
  return (
    <AbsoluteFill
      style={{
        backgroundColor: 'black',
        opacity: 1 - opacity,
      }}
    />
  );
};