import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {Paper} from './components/Paper';
import {Scene01Title} from './scenes/Scene01Title';
import {Scene02Year} from './scenes/Scene02Year';
import {Scene03Year} from './scenes/Scene03Year';
import {Scene04Year} from './scenes/Scene04Year';
import {Scene05Year} from './scenes/Scene05Year';
import {Scene06Year} from './scenes/Scene06Year';
import {Scene07Timeline} from './scenes/Scene07Timeline';
import {Scene08Terminal} from './scenes/Scene08Terminal';
import {beatById} from './timings';

const Beat: React.FC<{id: string; children: React.ReactNode}> = ({id, children}) => {
  const beat = beatById(id);
  return (
    <Sequence from={beat.from} durationInFrames={beat.durationInFrames} name={beat.name}>
      {children}
    </Sequence>
  );
};

export const BlogIntro: React.FC = () => {
  return (
    <AbsoluteFill>
      <Paper />
      <Beat id="title">
        <Scene01Title />
      </Beat>
      <Beat id="y2022">
        <Scene02Year />
      </Beat>
      <Beat id="y2023">
        <Scene03Year />
      </Beat>
      <Beat id="y2024">
        <Scene04Year />
      </Beat>
      <Beat id="y2025">
        <Scene05Year />
      </Beat>
      <Beat id="y2026">
        <Scene06Year />
      </Beat>
      <Beat id="read">
        <Scene07Timeline />
      </Beat>
      <Beat id="now">
        <Scene08Terminal />
      </Beat>
    </AbsoluteFill>
  );
};