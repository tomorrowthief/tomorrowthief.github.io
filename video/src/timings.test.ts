import {describe, expect, it} from 'vitest';
import {beats} from './timings';
import {DURATION_IN_FRAMES} from './theme';

describe('timings', () => {
  it('第一拍从第 0 帧开始', () => {
    expect(beats[0].from).toBe(0);
  });

  it('各拍首尾相接，没有空隙也没有重叠', () => {
    for (let i = 1; i < beats.length; i++) {
      const prev = beats[i - 1];
      const expectedFrom = prev.from + prev.durationInFrames;
      expect(
        beats[i].from,
        `${beats[i].name} 应紧接 ${prev.name} 结束的下一帧（第 ${expectedFrom} 帧），实际是第 ${beats[i].from} 帧`,
      ).toBe(expectedFrom);
    }
  });

  it('所有拍加起来正好等于 Composition 时长', () => {
    const last = beats[beats.length - 1];
    expect(last.from + last.durationInFrames).toBe(DURATION_IN_FRAMES);
  });

  it('beat id 不重复', () => {
    const ids = beats.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('共有 8 拍', () => {
    expect(beats).toHaveLength(8);
  });
});