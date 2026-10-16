import React from 'react';
import {palette, Reveal, serif, Stage} from './Stage';

export const Journal: React.FC = () => <Stage chapter="在这里分享" number="03">
  <Reveal style={{fontFamily: serif, fontSize: 78, lineHeight: 1.45}}>记录技术，<br />也记录<span style={{color: palette.accent}}>生活</span>。</Reveal>
  <Reveal delay={0.6} style={{fontSize: 29, color: palette.muted, marginTop: 28}}>AI 实践与开发心得，读书札记与日常思考。</Reveal>
  <Reveal delay={1.2} style={{display: 'flex', alignItems: 'center', gap: 22, marginTop: 40}}>
    <span style={{width: 44, height: 2, background: palette.accent}} />
    <span style={{fontSize: 25}}>欢迎来到「钟灵毓秀」</span>
    <span style={{fontSize: 21, color: palette.muted}}>zhixia.pages.dev</span>
  </Reveal>
</Stage>;
