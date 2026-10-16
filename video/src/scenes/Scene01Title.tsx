import React from 'react';
import {AbsoluteFill} from 'remotion';
import {FadeIn} from '../components/FadeIn';
import {InkLine} from '../components/InkLine';
import {Seal} from '../components/Seal';
import {toZhNumeral, totalPosts} from '../data/posts';
import {colors, fonts, GUTTER} from '../theme';

const TITLE = '钟灵毓秀';

export const Scene01Title: React.FC = () => {
  return (
    <AbsoluteFill style={{padding: `0 ${GUTTER}px 180px`, justifyContent: 'flex-end'}}>
      <div style={{position: 'absolute', top: 168, left: GUTTER}}>
        <InkLine width={420} delay={14} />
      </div>
      {/* 150 是印章落定态的顶边位置。Seal.tsx 规定上边余量需 ≥ 0.275×size + 30
          （size 默认 104 → 58.6），往上挪时别低于它，否则落下相会被裁掉一角。 */}
      <Seal text={'钟\n灵'} delay={30} style={{position: 'absolute', top: 150, right: GUTTER}} />

      <div style={{display: 'flex', fontFamily: fonts.title, fontSize: 118, color: colors.ink}}>
        {/* 逐字进场靠的是 delay 的 5 帧步长，不是靠缩短时长 —— 步长留着、时长用
            默认的 30，第 12 帧同样是四字分立。各字 20 帧（短于默认 ENTRANCE_FRAMES=30）：
            末字第 15 帧起手，整串第 35 帧收完；默认的 30 会拖到第 45 帧，而副标题
            第 34 帧就起手了。 */}
        {TITLE.split('').map((char, i) => (
          <FadeIn key={`${i}-${char}`} delay={i * 5} durationInFrames={20} rise={12}>
            {/* marginRight 在最后一个字上也生效，标题块因此比墨迹宽 26px。左对齐、块级
                撑满，画面无影响 —— 但哪天要把标题居中，这 26px 尾距就会露出来。 */}
            <span style={{display: 'inline-block', marginRight: 26}}>{char}</span>
          </FadeIn>
        ))}
      </div>

      <FadeIn delay={34} rise={10} style={{marginTop: 28}}>
        <div style={{fontFamily: fonts.title, fontSize: 30, letterSpacing: 6, color: colors.inkMuted}}>
          四年半 · {toZhNumeral(totalPosts)}篇
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};