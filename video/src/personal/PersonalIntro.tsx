import React from 'react';
import {AbsoluteFill, Series, useVideoConfig} from 'remotion';
import {Hello} from './Hello';
import {Focus} from './Focus';
import {Journal} from './Journal';
import {palette} from './Stage';

export const PersonalIntro: React.FC = () => {
  const {fps} = useVideoConfig();
  return <AbsoluteFill style={{backgroundColor: palette.paper}}>
    <Series>
      <Series.Sequence name="你好，我是 zhongling" durationInFrames={6 * fps} premountFor={fps}><Hello /></Series.Sequence>
      <Series.Sequence name="正在探索" durationInFrames={6 * fps} premountFor={fps}><Focus /></Series.Sequence>
      <Series.Sequence name="记录技术与生活" durationInFrames={6 * fps} premountFor={fps}><Journal /></Series.Sequence>
    </Series>
  </AbsoluteFill>;
};
