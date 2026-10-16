export type Beat = {
  id: string;
  name: string;
  from: number;
  durationInFrames: number;
};

// 帧区间来自 spec 第 4 节分镜表，30fps。
export const beats: Beat[] = [
  {id: 'title', name: '开场', from: 0, durationInFrames: 150},
  {id: 'y2022', name: '2022 搬', from: 150, durationInFrames: 240},
  {id: 'y2023', name: '2023 停笔', from: 390, durationInFrames: 150},
  {id: 'y2024', name: '2024 学', from: 540, durationInFrames: 300},
  {id: 'y2025', name: '2025 做', from: 840, durationInFrames: 360},
  {id: 'y2026', name: '2026 造', from: 1200, durationInFrames: 420},
  {id: 'read', name: '读 · 贯穿线', from: 1620, durationInFrames: 180},
  {id: 'now', name: '现在 · 终端', from: 1800, durationInFrames: 240},
];

export const beatById = (id: string): Beat => {
  const found = beats.find((b) => b.id === id);
  if (!found) {
    throw new Error(`timings.ts 中没有 id 为 "${id}" 的镜头`);
  }
  return found;
};