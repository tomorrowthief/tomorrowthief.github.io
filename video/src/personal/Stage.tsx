import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';

export const palette = {paper: '#f4f0e8', ink: '#292b27', muted: '#737568', accent: '#a54f38', rule: '#d5d2c7'};
export const serif = '"Songti SC", "Noto Serif SC", Georgia, serif';

export const Reveal: React.FC<{children: React.ReactNode; delay?: number; style?: React.CSSProperties}> = ({children, delay = 0, style}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return <div style={{
    ...style,
    opacity: interpolate(frame, [delay * fps, (delay + 0.7) * fps], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
    translate: `0 ${interpolate(frame, [delay * fps, (delay + 0.7) * fps], [22, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.22, 1, 0.36, 1)})}px`,
  }}>{children}</div>;
};

export const Stage: React.FC<{chapter: string; number: string; children: React.ReactNode}> = ({chapter, number, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return <AbsoluteFill style={{background: palette.paper, color: palette.ink, fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif', padding: '58px 80px', overflow: 'hidden'}}>
    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 18, letterSpacing: 3, color: palette.muted}}>
      <span>钟灵毓秀 / {chapter}</span><span style={{fontFamily: 'Menlo, monospace', letterSpacing: 1}}>{number} / 03</span>
    </div>
    <div style={{height: 1, background: palette.rule, marginTop: 24}} />
    <div style={{flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', opacity: interpolate(frame, [fps * 5.78, fps * 6 - 1], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}}>{children}</div>
    <div style={{display: 'flex', justifyContent: 'space-between', color: palette.muted, fontSize: 18, letterSpacing: 1}}>
      <span>zhongling</span><span>技术 · 阅读 · 生活</span>
    </div>
  </AbsoluteFill>;
};
