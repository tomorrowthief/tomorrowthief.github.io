import React from 'react';
import {AbsoluteFill} from 'remotion';
import {colors, HEIGHT, WIDTH} from '../theme';

/**
 * 宣纸底：铺底色 + 一层很淡的纸纹。
 *
 * 纸纹用内联 SVG 的 feTurbulence 生成，免得引入图片资源。下面几条都是实测
 * 撞出来的，改之前先读：
 *
 * 1. 噪声尺度两头都不行，只有中间一小段可用。周期 80px 上下的大斑块扛得住
 *    编码（σ 4.10 → 4.32），但在一屏留白里读作云、读作大理石纹，压不住正文；
 *    逐像素的细噪点反过来，still 预览里看得见，一过 JPEG q80 的 8×8 DCT 就
 *    整个被量化掉（σ 0.78 → 0.000），成品 mp4 是纯平色。最终取 baseFrequency
 *    0.035（周期约 29px）：细到读作纸的纤维，又粗到能穿过编码 —— 空间尺度确实
 *    不衰减（自相关 0.87/0.62/0.17 → 0.86/0.62/0.19），但「无损」是错的：H.264
 *    会重排色度，R 通道振幅见涨而 luma 基本不动，另在 8×8 网格上留下约 0.2%
 *    的台阶。这里刻意不写具体 σ 对：它随取样窗口变，换个 crop 就换一组数。
 * 2. 必须 mix-blend-mode: overlay，不能只降不透明度。feTurbulence 的输出
 *    自带 alpha（均值约 0.5），直接拿不透明度叠等于把纸往灰里拉：实测
 *    不透明度 0.5 时纸色从 246 掉到 215，整块底变脏灰。overlay 以中灰为
 *    基准，均值基本不动，只把反差做大。
 *    overlay 走哪一支由底色的亮度决定：colors.paper 三通道都接近 1，走柔和的
 *    light 支；哪天把 colors.paper 调暗，会静默切到 Multiply 支，颗粒被放大
 *    约一个数量级，intercept 也随之作废。
 * 3. 必须先用 feColorMatrix 把三个通道并成同一个灰度值，否则三通道各自
 *    独立取噪声，而 overlay 对偏白的纸在三个通道上的斜率并不相同
 *    （B 通道斜率是 R 的 2.3 倍），会渲染出粉黄蓝的彩色斑点。
 * 4. 纹理铺满整帧，不做 repeat。振幅放大到能穿过编码后，小 tile 的重复
 *    在 1920 宽里一眼就能看出来，像贴了张花纹纸；整帧一张图就没有接缝问题。
 *    SVG 里的 stitchTiles='stitch' 是刻意留着的：现在整帧一张、又是 no-repeat，
 *    它没有任何视觉效果，只为日后改回小 tile 平铺时备用 —— 那时还得把 filter
 *    区域的 x/y/width/height 显式写成 0/0/100%/100%，否则相邻 tile 的噪声
 *    对不上，会显出一条条接缝。
 * 5. data URI 前缀 data:image/svg+xml, 不能漏。少了它整串会被当成相对
 *    路径去请求，图加载不出来，纸纹静默消失（现象是背景变成纯 colors.paper）。
 *
 * feFuncR/G/B 的 intercept 不是随手填的魔法数：噪声均值不在 0.5，线性拉伸会把
 * 叠出来的底色推离 colors.paper。这里按实测把三个通道的均值拉回 246/242/234
 * （即 #f6f2ea），让屏幕上真正铺着的那块底就是 token 的颜色。改 slope 必须
 * 连着重定 intercept；改 baseFrequency 或 numOctaves 会移动噪声自身的均值，
 * 同样会让 intercept 作废、必须重算。
 */

// SVG 的 width/height 必须和 backgroundSize 一致，否则 1:1 映射就没了。
const PAPER_TEXTURE_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${WIDTH}' height='${HEIGHT}'%3E%3Cfilter id='n' x='0' y='0' width='100%25' height='100%25'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.035' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 0 0 0 0 1'/%3E%3CfeComponentTransfer%3E%3CfeFuncR type='linear' slope='0.85' intercept='-0.1855'/%3E%3CfeFuncG type='linear' slope='0.85' intercept='-0.1855'/%3E%3CfeFuncB type='linear' slope='0.85' intercept='-0.1855'/%3E%3CfeFuncA type='linear' slope='0' intercept='1'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Crect width='${WIDTH}' height='${HEIGHT}' filter='url(%23n)'/%3E%3C/svg%3E")`;

export const Paper: React.FC = () => {
  return (
    <AbsoluteFill style={{backgroundColor: colors.paper}}>
      <AbsoluteFill
        style={{
          backgroundImage: PAPER_TEXTURE_SVG,
          backgroundSize: `${WIDTH}px ${HEIGHT}px`,
          backgroundRepeat: 'no-repeat',
          mixBlendMode: 'overlay',
        }}
      />
    </AbsoluteFill>
  );
};