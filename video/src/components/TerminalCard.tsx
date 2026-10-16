import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {siteUrl, totalPosts} from '../data/posts';
import {colors, ease, fonts, GUTTER, termColors} from '../theme';
import {Cursor, Typewriter} from './Typewriter';
import {FadeIn} from './FadeIn';

/** 行首那个绿色 ❯。末尾的空格是承重的：去掉它，❯ 会贴死在打出来的字上。 */
const Prompt: React.FC = () => <span style={{color: termColors.green}}>❯ </span>;

/** 铺满整帧的扫描线。它是这一层的子元素，所以跟着 cover 一起淡入，不会在宣纸
 *  阶段就压到纸上。 */
const SCANLINES =
  'repeating-linear-gradient(0deg, rgba(255,255,255,0.02) 0 1px, transparent 1px 3px)';

/** 朱红线横扫的时长。线从画面左外进、右外出，这个区间定了它的速度。 */
const SWEEP_FRAMES = 26;

/** 第二行的 @ 与主机名共用这个起手帧。@ 若像提示符那样从头常驻，它会在名字
 *  还没打出来时先孤零零地挂在行首。 */
const ZHIXIA_START = 34;

/** 终端正文的字号与行高。父级的 fontSize / lineHeight 与 `zhongling@zhixia`
 *  那一行的 minHeight 都从这里取（为什么需要那个 minHeight，见下方那一段的注释）。 */
const MONO_SIZE = 30;
const MONO_LINE = 2.1;

/**
 * 第 8 拍，也是全片的风格切换点：深色终端换掉宣纸。
 *
 * 换场由这一层自己的不透明度完成 —— 底色 termColors.bg 是实色，cover 在 0–18 帧
 * 从 0 走到 1 后 clamp 住，第 18 帧起宣纸被完全遮住。这里不碰 Paper 的透明度，
 * 「宣纸退场」就是被压在底下看不见了；能不能压住还取决于渲染顺序：BlogIntro 里
 * Paper 在前、这一层在后，对调就会反过来被纸盖住。
 *
 * 另有一条朱红细线横扫而过：位移从 −100% 走到 +100%，扫完之后 clamp 在 +100%，
 * 整条线停在右边框外，画面里就再没有它 —— 「什么时候扫完」和「什么时候看不见」
 * 是同一个数，没有另设一个撤掉的开关。
 *
 * 这条线的缓动刻意不用 theme.ease —— spec §3.3 的「缓动统一」为它单记了一条例外。
 * ease 的两个 y 控制点都取 1：x 走到一半时 y 已经 0.96，最后那一半输入只挪 4%。
 * 喂给一条横扫，它头几帧就会扫过整屏，余下的时间只是慢慢退出画面，读到的是
 * 闪一下接一段拖尾。对称的 Easing.inOut(Easing.quad) 才是「扫过」。别再把它
 * 「统一」回 ease。
 *
 * 各行的 startFrame 是写死的字面量，与 timings.ts 里那一拍的长度没有计算关系；
 * 它们取值于这一层 useCurrentFrame 的帧轴，第 0 帧是这一层的起点。
 */
export const TerminalCard: React.FC = () => {
  const frame = useCurrentFrame();

  // 盖场用 18 帧，不跟 ENTRANCE_FRAMES(30)：第一条 Typewriter 第 6 帧就起手，
  // 底得赶在那之前盖上大部分，否则吐出来的字会半透明地叠在宣纸上。
  const cover = interpolate(frame, [0, 18], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ease,
  });

  const sweep = interpolate(frame, [0, SWEEP_FRAMES], [-1, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.quad),
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: termColors.bg,
        opacity: cover,
        padding: `0 ${GUTTER}px`,
        justifyContent: 'center',
      }}
    >
      <AbsoluteFill style={{backgroundImage: SCANLINES}} />

      {/* 朱红细线横扫而过，表达「宣纸退场」：-1 完全在左框外，0 铺满整帧，+1 从右边扫出。 */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: '50%',
          width: '100%',
          height: 3,
          backgroundColor: colors.seal,
          transform: `translateX(${sweep * 100}%)`,
        }}
      />

      <div
        style={{
          // 提成定位元素，文字才画在那条绝对定位的横扫线之上（当下两者不重叠，
          // 是留给版式再调的余量）。
          position: 'relative',
          fontFamily: fonts.mono,
          fontSize: MONO_SIZE,
          lineHeight: MONO_LINE,
          color: termColors.muted,
        }}
      >
        <div>
          <Prompt />
          <Typewriter text="whoami" startFrame={6} />
        </div>
        {/* 整行都由打字机吐出的行：visible===0 时 span 为空、不生成 line box、
            div 高度为 0，而外层是垂直居中 —— 块高每变一次，整块就跳一次。
            minHeight 取该行的行高把它钉住（MONO_SIZE × MONO_LINE，与父级同一个来源）。
            第 1、3、5 行有常驻的 ❯ 撑着，不需要。 */}
        <div style={{minHeight: MONO_SIZE * MONO_LINE}}>
          <Typewriter text="zhongling" startFrame={22} />
          {frame >= ZHIXIA_START ? <span style={{color: termColors.cyan}}>@</span> : null}
          <Typewriter text="zhixia" startFrame={ZHIXIA_START} />
        </div>
        <div style={{marginTop: 16}}>
          <Prompt />
          <Typewriter text="posts --since 2022 --count" startFrame={46} />
        </div>
        {/* 同上：36 落地那一帧之前这行也是空的，68 × 1.35 = 91.8。 */}
        <div style={{fontSize: 68, fontWeight: 600, lineHeight: 1.35, minHeight: 68 * 1.35}}>
          <Typewriter
            text={String(totalPosts)}
            startFrame={88}
            charsPerFrame={4}
            color={termColors.cyan}
          />
        </div>
        <div style={{marginTop: 16}}>
          <Prompt />
          <Typewriter text="还在写…" startFrame={116} color={termColors.fg} />
          <Cursor />
        </div>
      </div>

      {/* 用 FadeIn 而不是手写 interpolate：spec §3.3 要求文字入场是「透明度 0→1 +
          8–12px 上移」并且全片共用同一条缓动曲线，FadeIn 三样都给了。 */}
      <FadeIn delay={130} rise={10} style={{position: 'absolute', right: GUTTER, bottom: 88}}>
        <div style={{fontFamily: fonts.mono, fontSize: 22, color: termColors.muted}}>
          {siteUrl}
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};