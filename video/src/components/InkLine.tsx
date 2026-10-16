import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {colors, ease, ENTRANCE_FRAMES} from '../theme';

/**
 * 细横线自左展开。画的过程中 transformOrigin 必须是 left center，
 * 否则线会从中心同时往两边长，和版面的左对齐基线对不上。
 */
export const InkLine: React.FC<{
  width: number | string;
  delay?: number;
  durationInFrames?: number;
  color?: string;
  thickness?: number;
  /** style 最后合并；不要传 transform/opacity，会覆盖动画 */
  style?: React.CSSProperties;
}> = ({
  width,
  delay = 0,
  durationInFrames = ENTRANCE_FRAMES,
  color = colors.rule,
  thickness = 1,
  style,
}) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame - delay, [0, durationInFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ease,
  });
  // 画完之后 transform 与 transformOrigin 一起撤掉：transform 是包含块陷阱，
  // 静止时也没必要留一个合成层。两者由同一个 drawing 开关控制，不会只剩一个。
  const drawing = progress < 1;

  return (
    <div
      style={{
        width,
        height: thickness,
        backgroundColor: color,
        transform: drawing ? `scaleX(${progress})` : undefined,
        transformOrigin: drawing ? 'left center' : undefined,
        ...style,
      }}
    />
  );
};