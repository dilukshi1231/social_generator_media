import React from 'react';
import { Composition } from 'remotion';
import { VideoMerge, VideoMergeProps } from './VideoMerge';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="VideoMerge"
        component={VideoMerge}
        durationInFrames={300} // Will be overridden
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          videos: [],
        } as VideoMergeProps}
      />
    </>
  );
};
