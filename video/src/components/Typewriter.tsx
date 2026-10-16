import React from 'react';
import {useCurrentFrame} from 'remotion';
import {termColors} from '../theme';

/**
 * 逐字吐字。startFrame 之前的 elapsed 被夹到 0，所以起始帧一到，文字从空串开始长，
 * 不会出现负的输出长度；跑到 text.length 就停住，不再往下切。
 *
 * startFrame 是这一层 useCurrentFrame 的帧轴上的位置，不是整片的绝对帧号 ——
 * 套进 Sequence 之后，第 0 帧是那一段的起点。
 *
 * style 最后合并，可以覆盖 color。
 */
export const Typewriter: React.FC<{
  text: string;
  /** 相对镜头开始的起始帧 */
  startFrame: number;
  /** 每帧输出多少个字符 */
  charsPerFrame?: number;
  color?: string;
  style?: React.CSSProperties;
}> = ({text, startFrame, charsPerFrame = 1.4, color = termColors.fg, style}) => {
  const frame = useCurrentFrame();
  const elapsed = Math.max(0, frame - startFrame);
  const visible = Math.min(text.length, Math.floor(elapsed * charsPerFrame));

  return <span style={{color, ...style}}>{text.slice(0, visible)}</span>;
};

/**
 * 方块光标。亮灭由帧号每 15 帧翻转一次决定，30fps 下即一个 30 帧（1 秒）的周期。
 * 15 是写死的、不按 fps 换算：换掉 composition 的 fps，闪烁周期会跟着变。
 * 它只接收 style、不接收文字，亮灭与 Typewriter 吐到第几个字无关。
 */
export const Cursor: React.FC<{style?: React.CSSProperties}> = ({style}) => {
  const frame = useCurrentFrame();
  const on = Math.floor(frame / 15) % 2 === 0;

  return (
    <span
      style={{
        display: 'inline-block',
        width: 14,
        height: 28,
        backgroundColor: termColors.blue,
        verticalAlign: -4,
        marginLeft: 8,
        opacity: on ? 1 : 0,
        ...style,
      }}
    />
  );
};