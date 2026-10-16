import React from 'react';
import {Composition, Folder} from 'remotion';
import {PersonalIntro} from './personal/PersonalIntro';
import {Hello} from './personal/Hello';
import {Focus} from './personal/Focus';
import {Journal} from './personal/Journal';
import {BlogIntro} from './BlogIntro';
import {DURATION_IN_FRAMES, FPS, HEIGHT, WIDTH} from './theme';

export const RemotionRoot: React.FC = () => {
  return (
    <>
    <Composition id="PersonalIntro" component={PersonalIntro} durationInFrames={540} fps={30} width={1280} height={720} />
    <Folder name="Personal-scenes">
      <Composition id="Hello" component={Hello} durationInFrames={180} fps={30} width={1280} height={720} />
      <Composition id="Focus" component={Focus} durationInFrames={180} fps={30} width={1280} height={720} />
      <Composition id="Journal" component={Journal} durationInFrames={180} fps={30} width={1280} height={720} />
    </Folder>
    <Composition
      id="BlogIntro"
      component={BlogIntro}
      durationInFrames={DURATION_IN_FRAMES}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
    </>
  );
};
