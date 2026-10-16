import React from 'react';
import {AbsoluteFill} from 'remotion';
import type {YearEntry} from '../data/posts';
import {colors, fonts, GUTTER} from '../theme';
import {FadeIn} from './FadeIn';

/**
 * 一个年份镜头：大号等宽年份 + 动词 + 篇数，下面是篇名列表。
 * 五个年份镜头共用它，2023「停笔」走 subdued 变体。
 *
 * subdued（`entry.subdued === true`）把年份/动词/篇数一起降到细线色 rule，
 * 且用 entry.note 顶替篇名列表；对比度因此明显低于其余四年，这是刻意的。
 */
export const YearCard: React.FC<{entry: YearEntry}> = ({entry}) => {
  const subdued = entry.subdued === true;

  return (
    <AbsoluteFill
      style={{
        padding: `0 ${GUTTER}px`,
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <FadeIn rise={12}>
        <div
          style={{
            fontFamily: fonts.mono,
            fontSize: 132,
            fontWeight: 700,
            lineHeight: 1,
            letterSpacing: -3,
            color: subdued ? colors.rule : colors.seal,
          }}
        >
          {entry.year}
        </div>
      </FadeIn>

      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          // gap 28 是**盒子**之间的距离。动词那行的 letterSpacing 14 会留在行尾、
          // 算进动词盒子的宽度里，所以画面上两段文字看着隔了 42px。按字号调 gap
          // 时记住这一份偏移，别照 28 估。
          gap: 28,
          marginTop: 22,
        }}
      >
        <FadeIn delay={6} rise={10}>
          <div
            style={{
              fontFamily: fonts.title,
              fontSize: 46,
              letterSpacing: 14,
              color: subdued ? colors.rule : colors.ink,
            }}
          >
            {entry.verb}
          </div>
        </FadeIn>

        <FadeIn delay={10} rise={10}>
          <div
            style={{
              fontFamily: fonts.mono,
              fontSize: 22,
              color: subdued ? colors.rule : colors.inkMuted,
            }}
          >
            {entry.count} 篇
          </div>
        </FadeIn>
      </div>

      {subdued ? (
        // delay 70（≈2.3s）是故意的：spec 要求这一拍几乎静止，晚出现才有停顿感。
        // 别当成写顺手改小 —— 改小就成了又一年份卡，2023 的「停笔」感就没了。
        <FadeIn delay={70} rise={0} style={{marginTop: 40}}>
          <div
            style={{
              fontFamily: fonts.title,
              fontSize: 28,
              letterSpacing: 10,
              color: colors.rule,
            }}
          >
            {entry.note}
          </div>
        </FadeIn>
      ) : (
        // 版心宽 1920 − 2×GUTTER = 1600，而这是个**块级** div：不设 maxWidth 也会在
        // 1600 处换行，不存在「冲出右边距」。1200 的实际作用是提前 400px 换行，是个
        // 魔数。当前有篇名列表的四年（2023 走 subdued 分支、没有列表）实测行宽
        // 972 / 1019 / 1035 / 1025，都在 1200 以内 —— 这个上限至今没被碰到。
        // 另外只有 subdued 的年份允许 posts 为空：非 subdued 配空数组会 join 出空串，
        // 卡片仍占着 marginTop 那 40px，于是整体下移、底下留一块空白。
        <FadeIn delay={16} rise={10} style={{marginTop: 40}}>
          <div
            style={{
              fontFamily: fonts.title,
              fontSize: 24,
              lineHeight: 2,
              letterSpacing: 3,
              color: colors.inkMuted,
              maxWidth: 1200,
            }}
          >
            {entry.posts.map((p) => p.label).join('　·　')}
          </div>
        </FadeIn>
      )}
    </AbsoluteFill>
  );
};