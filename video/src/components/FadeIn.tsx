import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {ease, ENTRANCE_FRAMES} from '../theme';

/**
 * 淡入 + 上移。spec §3.3 动效原则：进场只做淡入配 8–12px 上移，不回弹。
 * 所有镜头共用这一处实现，缓动统一走 theme 里的 ease。
 */
export const FadeIn: React.FC<{
  /** 相对镜头开始的延迟帧数 */
  delay?: number;
  durationInFrames?: number;
  /** 上移距离（px），0 表示只淡入不位移 */
  rise?: number;
  children: React.ReactNode;
  /** style 最后合并；不要传 transform/opacity，会覆盖动画 */
  style?: React.CSSProperties;
}> = ({delay = 0, durationInFrames = ENTRANCE_FRAMES, rise = 10, children, style}) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame - delay, [0, durationInFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ease,
  });
  // 位移为 0 时不输出 transform：静止时这一层就不必是绝对定位后代的包含块，
  // 也少一个合成层。注意这只解决进场结束之后——进场过程中仍在输出 translateY，
  // 那时这层依然是包含块，所以印章这类绝对定位子元素不能放进 FadeIn。
  const offset = (1 - progress) * rise;

  return (
    <div
      style={{
        opacity: progress,
        transform: offset === 0 ? undefined : `translateY(${offset}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};