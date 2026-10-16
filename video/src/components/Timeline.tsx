import React from 'react';
import {AbsoluteFill} from 'remotion';
import {closingLine, journalPosts, years} from '../data/posts';
import {colors, fonts, GUTTER} from '../theme';
import {FadeIn} from './FadeIn';
import {InkLine} from './InkLine';

/**
 * 第 7 拍：镜头拉远，前面五个年份收成一条 2022→2026 的时间轴。「拉远」是这一拍的
 * 修辞，靠版式对比实现（上一拍 132px 的年份大字 → 这里 18px 的一行），代码里没有
 * 任何缩放动画 —— 别照着这四个字去找运镜。
 * 轴上压两条线 —— 上面一条细灰线是年份轴，下面一条粗朱红线是札记那条贯穿线，
 * 视觉上表达「五年里只有这一条没断过」。札记篇名与收束句依次落在朱红线下方。
 *
 * 两条线是两个独立的 InkLine，各自 width="100%"：细线直接以 AbsoluteFill 的内容盒
 * 为包含块，朱红线外面还套了一层 div —— 那层是拉伸的 flex 子项，宽度同样是一整个
 * 内容盒，所以百分比解出来都是版心 1920 − 2×GUTTER，两条线等宽且左右端重合。
 * 谁把其中一条改成写死的数字，两条线就不再共享同一个宽度来源 —— 改 GUTTER 时
 * 只有另一条还会跟着走。
 *
 * 年份行用 space-between：首尾两个年份的盒子分别贴住内容盒的左右边，端点与那两条线
 * 一致；字形自带左右边距，墨迹因此比线略窄一点，是字体的边距、不是没对齐。
 */
export const Timeline: React.FC = () => {
  return (
    <AbsoluteFill style={{padding: `0 ${GUTTER}px`, flexDirection: 'column', justifyContent: 'center'}}>
      <FadeIn>
        <div
          style={{
            fontFamily: fonts.title,
            fontSize: 32,
            letterSpacing: 8,
            color: colors.ink,
            marginBottom: 44,
          }}
        >
          读 · 从未断过
        </div>
      </FadeIn>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontFamily: fonts.mono,
          fontSize: 18,
          color: colors.rule,
          marginBottom: 10,
        }}
      >
        {years.map((y) => (
          <span key={y.year}>{y.year}</span>
        ))}
      </div>

      <InkLine width="100%" color={colors.rule} durationInFrames={30} />

      <div style={{marginTop: 46}}>
        {/* 朱红线 thickness 3，比年份轴的默认 1px 粗；delay 18 让它晚于年份轴起笔。 */}
        <InkLine
          width="100%"
          color={colors.seal}
          thickness={3}
          delay={18}
          durationInFrames={40}
        />
        <FadeIn delay={44} style={{marginTop: 24}}>
          <div
            style={{
              fontFamily: fonts.title,
              fontSize: 24,
              lineHeight: 2,
              letterSpacing: 3,
              color: colors.inkMuted,
            }}
          >
            {journalPosts.map((p) => p.label).join('　·　')}
          </div>
        </FadeIn>
      </div>

      <FadeIn delay={86} style={{marginTop: 56}}>
        <div
          style={{
            fontFamily: fonts.title,
            fontSize: 40,
            letterSpacing: 6,
            color: colors.ink,
          }}
        >
          {closingLine}
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};