import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {colors, fonts} from '../theme';

/**
 * 朱红印章落下。这是全片唯一一处「重」动效 —— 其余进场一律淡入配 8–12px 上移、
 * 不回弹，所以这里刻意不用 theme 的 ease，改用 spring：回弹是 spring 的自然行为。
 *
 * 关于包含块：`FadeIn` 在 `rise > 0` 且进场未结束时输出 translateY，那一层就成了
 * 绝对定位后代的包含块 —— 调用方一般用 style 传 `position: absolute` 来摆印章，
 * 所以**不要把它套进 `FadeIn`**。让印章错位的不是印章自己的 transform（它没有
 * 绝对定位后代），是父层那个。`rise={0}` 的 FadeIn 不会成为包含块，但别依赖这个。
 *
 * 贴边摆放要留的余量（缩放绕中心，而定位锚的是角）：落下相整盒比落定态左右下三边
 * 各外扩 0.275×size，**同时整体上移最多 30px**。所以左右下留 `0.275×size` 够了，
 * **上边要留 `0.275×size + 30`**。别把上边也按 0.275×size 算 —— 那样会短约 30px，
 * 印章贴顶时仍会被裁掉一角。余量按整段落下相里最外的那一帧算；透明度到 1 的那个
 * 可见相起点上，上边实际外扩约 `0.242×size + 26px`。
 *
 * 两条文字排版约束：不要以 `\n` 开头，那会把整块墨迹下推约 0.19×size；竖排最多
 * 两行 —— 三行会溢出方框（3 × 1.06 × 0.36 = 1.145 > 1），而这里没有 overflow: hidden。
 */
export const Seal: React.FC<{
  /** 印章文字，用 \n 分行。例如 '钟\n灵' 会排成竖排两字 */
  text: string;
  /** 方形边长（px）。字号 (0.36)、圆角 (0.06)、字距 (0.04) 都按它换算，
   *  所以调大小请改这里，不要往 style 里写 width/height */
  size?: number;
  /** 相对镜头开始的延迟帧数 */
  delay?: number;
  /** style 最后合并。不要传这些：transform / translate / rotate / scale /
   *  transformOrigin / opacity / filter / width / height / padding / boxSizing。
   *  前四个与 transform 是**相乘**而非覆盖；filter 会再乘一层透明度；
   *  transformOrigin 会改掉缩放中心（居中、以及上面那段贴边余量，都建立在它的
   *  默认 50% 50% 上）；width/height 会覆盖 size 而字号圆角仍按 size 算；
   *  padding / boxSizing 会抵消掉内部那笔字距补偿，让字重新偏左。
   *  调大小用 size，改颜色用 backgroundColor / color */
  style?: React.CSSProperties;
}> = ({text, size = 104, delay = 0, style}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: {damping: 14, mass: 0.7, stiffness: 220},
  });

  // scale / translateY 刻意不 clamp：progress 会过冲到约 1.12，那 6% 的缩小与
  // 约 3.5px 的下沉**就是** spec 要的那次回弹，clamp 掉就只剩硬停。
  // opacity 反过来必须 clamp —— 它只负责「什么时候看得见」，过冲没有意义。
  // spring 数值（ζ≈0.56）待 Task 11 对着真实版式复核，见计划 Task 5 / Task 11 两节。
  const scale = interpolate(progress, [0, 1], [1.55, 1]);
  const translateY = interpolate(progress, [0, 1], [-30, 0]);
  const opacity = interpolate(progress, [0, 0.12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        width: size,
        height: size,
        backgroundColor: colors.seal,
        borderRadius: size * 0.06,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        whiteSpace: 'pre-line',
        textAlign: 'center',
        color: colors.paper,
        fontFamily: fonts.title,
        fontSize: size * 0.36,
        lineHeight: 1.06,
        letterSpacing: size * 0.04,
        // letterSpacing 会给每行**末尾**也留出字距，textAlign: center 下整列字
        // 因此左偏半个字距。用等量的 paddingLeft 抵消；boxSizing 必须是
        // border-box，否则盒子会宽出这一份 padding，方形就不方了。
        boxSizing: 'border-box',
        paddingLeft: size * 0.04,
        opacity,
        transform: `translateY(${translateY}px) scale(${scale})`,
        ...style,
      }}
    >
      {text}
    </div>
  );
};