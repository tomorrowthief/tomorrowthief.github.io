import React from 'react';
import {palette, Reveal, serif, Stage} from './Stage';

const Topic: React.FC<{label: string; detail: string; delay: number}> = ({label, detail, delay}) => <Reveal delay={delay} style={{display: 'flex', alignItems: 'center', padding: '19px 0', borderBottom: `1px solid ${palette.rule}`, gap: 40}}>
  <span style={{width: 340, fontSize: 35}}>{label}</span><span style={{fontSize: 27, color: palette.muted}}>{detail}</span>
</Reveal>;

export const Focus: React.FC = () => <Stage chapter="正在探索" number="02">
  <Reveal><div style={{fontFamily: serif, fontSize: 66, marginBottom: 30}}>从想法，到实现<span style={{color: palette.accent}}>。</span></div></Reveal>
  <Topic label="AI Agent" detail="智能体应用与基础设施" delay={0.35} />
  <Topic label="Agent Memory" detail="探索智能体的记忆能力" delay={0.8} />
  <Topic label="软件开发与架构" detail="前端 · Node.js · Python" delay={1.25} />
</Stage>;
