import {Easing} from 'remotion';

export const WIDTH = 1920;
export const HEIGHT = 1080;
export const FPS = 30;
export const DURATION_IN_FRAMES = 2040;

/** 入场动画的统一时长。缓动很前置，太短会把淡入压成台阶。 */
export const ENTRANCE_FRAMES = 30;

/** 版面左边距。横线的左端与正文都对齐这条线。 */
export const GUTTER = 160;

export const colors = {
  paper: '#f6f2ea',
  ink: '#1c1a17',
  seal: '#b03a2e',
  inkMuted: '#6b6355',
  rule: '#c9c0ae',
} as const;

export const termColors = {
  bg: '#0d1117',
  fg: '#c9d1d9',
  green: '#7ee787',
  cyan: '#4ec9b0',
  blue: '#58a6ff',
  muted: '#8b949e',
} as const;

export const fonts = {
  title: '"Songti SC", "Noto Serif SC", serif',
  body: '"PingFang SC", "Hiragino Sans GB", sans-serif',
  mono: '"SF Mono", Menlo, monospace',
} as const;

export const ease = Easing.bezier(0.22, 1, 0.36, 1);