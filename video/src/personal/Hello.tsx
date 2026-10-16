import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {palette, Reveal, serif, Stage} from './Stage';

export const Hello: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return <Stage chapter="关于我" number="01">
    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 36}}>
      <div>
        <div style={{fontFamily: serif, fontSize: 62, lineHeight: 1.3}}>你好，我是</div>
        <div style={{fontFamily: 'Georgia, serif', fontSize: 108, lineHeight: 1.25, letterSpacing: -4}}>zhongling<span style={{color: palette.accent}}> .</span></div>
        <div style={{height: 3, background: palette.accent, marginTop: 20, width: interpolate(frame, [0, fps * 1.4], [28, 126], {extrapolateRight: 'clamp'})}} />
        <Reveal delay={0.5} style={{fontSize: 30, marginTop: 28, color: palette.muted}}>软件开发者 · 架构师 · 生活探索者</Reveal>
        <Reveal delay={1.1} style={{fontSize: 23, marginTop: 18, color: palette.muted}}>杭州 / 郑州</Reveal>
      </div>
      <Reveal delay={0.25} style={{width: 230, height: 230, border: `2px solid ${palette.accent}`, padding: 20, color: palette.accent, rotate: '-4deg', flexShrink: 0}}>
        <div style={{border: `1px solid ${palette.accent}`, height: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'center', justifyItems: 'center', fontFamily: serif, fontSize: 64, lineHeight: 1.2}}>
          <span>钟</span><span>灵</span><span>毓</span><span>秀</span>
        </div>
      </Reveal>
    </div>
  </Stage>;
};
