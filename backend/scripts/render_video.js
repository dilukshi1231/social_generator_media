const { bundle } = require('@remotion/bundler');
const { renderMedia, selectComposition } = require('@remotion/renderer');
const path = require('path');
const fs = require('fs');

async function renderVideo(configPath, outputPath, tempDir) {
  try {
    console.log('[Remotion] Starting render...');
    console.log('[Remotion] Config:', configPath);
    console.log('[Remotion] Output:', outputPath);

    // Read composition config
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    console.log('[Remotion] Loaded config:', JSON.stringify(config, null, 2));

    // Bundle Remotion code
    const bundleLocation = path.join(tempDir, 'bundle');
    const remotionRoot = path.join(__dirname, '..', 'remotion', 'Root.tsx');

    console.log('[Remotion] Bundling from:', remotionRoot);

    const bundled = await bundle({
      entryPoint: remotionRoot,
      webpackOverride: (config) => config,
    });

    console.log('[Remotion] Bundle created:', bundled);

    // Get composition
    const composition = await selectComposition({
      serveUrl: bundled,
      id: 'VideoMerge',
      inputProps: {
        videos: config.videos,
      },
    });

    console.log('[Remotion] Composition selected');

    // Update composition with actual duration
    const updatedComposition = {
      ...composition,
      durationInFrames: config.durationInFrames,
      width: config.width,
      height: config.height,
      fps: config.fps,
    };

    console.log('[Remotion] Rendering video...');
    console.log('[Remotion] Duration:', config.durationInFrames, 'frames');
    console.log('[Remotion] Resolution:', config.width, 'x', config.height);

    // Render video
    await renderMedia({
      composition: updatedComposition,
      serveUrl: bundled,
      codec: 'h264',
      outputLocation: outputPath,
      inputProps: {
        videos: config.videos,
      },
      onProgress: ({ progress }) => {
        console.log(`[Remotion] Render progress: ${(progress * 100).toFixed(1)}%`);
      },
    });

    console.log('[Remotion] ✅ Render complete:', outputPath);
    process.exit(0);

  } catch (error) {
    console.error('[Remotion] ❌ Render failed:', error);
    process.exit(1);
  }
}

// Get command line arguments
const [configPath, outputPath, tempDir] = process.argv.slice(2);

if (!configPath || !outputPath || !tempDir) {
  console.error('Usage: node render_video.js <configPath> <outputPath> <tempDir>');
  process.exit(1);
}

renderVideo(configPath, outputPath, tempDir);