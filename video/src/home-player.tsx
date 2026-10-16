import React from 'react';
import {createRoot} from 'react-dom/client';
import {Player} from '@remotion/player';
import {PersonalIntro} from './personal/PersonalIntro';
import {personalIntro} from './personal/config';

export const mount = (element: HTMLElement) => {
  createRoot(element).render(<Player
    component={PersonalIntro}
    compositionWidth={personalIntro.width}
    compositionHeight={personalIntro.height}
    durationInFrames={personalIntro.durationInFrames}
    fps={personalIntro.fps}
    controls
    autoPlay
    showVolumeControls={false}
    clickToPlay
    doubleClickToFullscreen
    style={{width: '100%', aspectRatio: '16 / 9'}}
    errorFallback={() => <p style={{padding: 24}}>暂时无法播放，请阅读<a href="/about/">关于作者</a>。</p>}
  />);
};
