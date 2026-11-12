# 钟灵毓秀博客介绍视频 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用 Remotion 做一支 68 秒、1920×1080、静音可懂的博客介绍片，并嵌进 `zhixia.pages.dev` 首页。

**Architecture:** 8 个镜头各自是一个独立的 React 组件，由一个 `BlogIntro` 容器用 `<Sequence>` 按固定的帧区间拼起来。宣纸底作为整片的公共底层，只有第 8 拍（终端）自带不透明深色背景盖在上面，形成唯一的风格反转。所有文案集中在 `src/data/posts.ts`，动画代码不含硬编码文本。

**Tech Stack:** Remotion 4.0.533 · React 19.3.0 · TypeScript 5.9.3 · Vitest 5.0.3 · Hugo（站内嵌入）

**设计文档:** `video/docs/specs/2026-10-07-blog-intro-video-design.md`

**对 spec 结构的三处补充**（都是为了让 spec 里的要求可验证，其余严格按 spec）：

1. `src/timings.ts` —— 把 8 拍的帧区间抽成数据，并加测试断言**首尾相接、无空隙无重叠**。视频里镜头之间漏几帧就是几帧黑屏，这是个必须被测试兜住的真实故障。
2. `src/components/FadeIn.tsx` —— spec 的动效原则要求"文字淡入配 8–12px 上移"，这个模式在 8 个镜头里都要用，抽成共享组件而不是各写一遍。
3. `PostRef` 类型（`{label, file}`）—— spec 要求"`posts` 中每个篇名必须真实存在于 `content/posts/`"。画面显示名是简称（「孙子兵法」对应 `art-of-war.md`），所以必须同时记录源文件名才能做精确校验。

**验证方式说明（重要）：** 本项目不做组件单元测试（spec 第 6 节）。组件类任务的验证方式统一是：

1. `npm run typecheck` —— 类型必须干净
2. `npx remotion still BlogIntro out/check-<名字>.png --frame=<代表帧>` —— 把该镜头动画停止后的那一帧渲染成 PNG
3. **用 Read 工具打开这张 PNG 真的看一眼**，确认文字、颜色、位置、有无溢出

第 3 步不是走过场。文字溢出画面、颜色写错、元素重叠，只有看图才能发现。

---

## 前置检查

- [ ] **确认工作目录**

```bash
pwd   # 必须是 /Users/zhongling/mypro/tomorrowthief.github.io
node -v   # 必须 >= 20（本机 v22.22.3）
ls content/posts/*.md | grep -vc '_index.md'   # 必须输出 36
```

- [ ] **确认 spec 已被用户批准**

`video/docs/specs/2026-10-07-blog-intro-video-design.md` 已存在且用户已确认。

---

## Task 1: 脚手架与主题常量

**Files:**
- Create: `video/package.json`
- Create: `video/tsconfig.json`
- Create: `video/remotion.config.ts`
- Create: `video/src/theme.ts`
- Create: `video/src/index.ts`
- Create: `video/src/Root.tsx`
- Create: `video/src/BlogIntro.tsx`

- [ ] **Step 1: 建 `video/package.json`**

```json
{
  "name": "blog-intro-video",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "studio": "remotion studio",
    "render": "remotion render BlogIntro out/blog-intro.mp4 --crf=20",
    "still": "remotion still BlogIntro",
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@remotion/cli": "4.0.533",
    "react": "19.3.0",
    "react-dom": "19.3.0",
    "remotion": "4.0.533"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@types/react": "19.3.0",
    "@types/react-dom": "19.3.0",
    "typescript": "5.9.3",
    "vitest": "5.0.3"
  }
}
```

TypeScript 固定在 5.9.3 而不是最新的 7.0.2：TS 7 是全新的原生编译器，Remotion 的工具链尚未跟到，这里不冒这个险。

不要加 `"type": "module"` —— 测试里用 `process.cwd()` 向上查找目录（Task 3），不依赖 ESM 的 `import.meta`，避免 CJS/ESM 歧义。

- [ ] **Step 2: 建 `video/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src", "remotion.config.ts"]
}
```

- [ ] **Step 3: 建 `video/remotion.config.ts`**

```ts
import {Config} from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
```

- [ ] **Step 4: 建 `video/src/theme.ts`**

```ts
import {Easing} from 'remotion';

export const WIDTH = 1920;
export const HEIGHT = 1080;
export const FPS = 30;
export const DURATION_IN_FRAMES = 2040;

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
```

字体用系统栈是用户的选择。这意味着**渲染必须在这台 Mac 上跑**，别的机器会回退到其它字体。

- [ ] **Step 5: 建占位版 `video/src/BlogIntro.tsx`**

```tsx
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {colors, fonts} from './theme';

export const BlogIntro: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.paper,
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: fonts.title,
        fontSize: 64,
        color: colors.ink,
      }}
    >
      脚手架就绪
    </AbsoluteFill>
  );
};
```

- [ ] **Step 6: 建 `video/src/Root.tsx`**

```tsx
import React from 'react';
import {Composition} from 'remotion';
import {BlogIntro} from './BlogIntro';
import {DURATION_IN_FRAMES, FPS, HEIGHT, WIDTH} from './theme';

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="BlogIntro"
      component={BlogIntro}
      durationInFrames={DURATION_IN_FRAMES}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
  );
};
```

- [ ] **Step 7: 建 `video/src/index.ts`**

```ts
import {registerRoot} from 'remotion';
import {RemotionRoot} from './Root';

registerRoot(RemotionRoot);
```

- [ ] **Step 8: 安装依赖**

```bash
cd video && npm install
```

Expected: 安装成功，出现 `video/node_modules/` 和 `video/package-lock.json`。

- [ ] **Step 9: 验证 Remotion 能识别 composition**

```bash
cd video && npx remotion compositions
```

Expected: 输出一行包含 `BlogIntro`，尺寸 `1920x1080`，时长 `2040` 帧。

若报错找不到入口，检查 `package.json` 里没有 `"main"` 字段冲突，Remotion 默认找 `src/index.ts`。

- [ ] **Step 10: 类型检查**

```bash
cd video && npm run typecheck
```

Expected: 无输出（退出码 0）。

- [ ] **Step 11: 提交**

```bash
git add video/package.json video/package-lock.json video/tsconfig.json video/remotion.config.ts video/src
git commit -m "Scaffold Remotion video project

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

## Task 2: 镜头时间轴 + Vitest 接入

**Files:**
- Create: `video/src/timings.ts`
- Create: `video/src/timings.test.ts`

- [ ] **Step 1: 先写失败的测试 `video/src/timings.test.ts`**

```ts
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
```

- [ ] **Step 2: 跑测试确认失败**

```bash
cd video && npm test
```

Expected: FAIL — 无法解析 `./timings`（文件还不存在）。

- [ ] **Step 3: 建 `video/src/timings.ts`**

```ts
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
```

- [ ] **Step 4: 跑测试确认通过**

```bash
cd video && npm test
```

Expected: PASS — 5 个测试全绿。

- [ ] **Step 5: 提交**

```bash
git add video/src/timings.ts video/src/timings.test.ts
git commit -m "Add scene timeline with contiguity tests

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

## Task 3: 文章数据 + 校验测试

**Files:**
- Create: `video/src/data/posts.test.ts`
- Create: `video/src/data/posts.ts`

- [ ] **Step 1: 先写失败的测试 `video/src/data/posts.test.ts`**

```ts
import fs from 'node:fs';
import path from 'node:path';
import {describe, expect, it} from 'vitest';
import {journalPosts, toZhNumeral, totalPosts, yearEntry, years} from './posts';

// 从 video/ 或仓库根目录运行都能找到 content/posts，不依赖 cwd。
const findPostsDir = (): string => {
  let dir = process.cwd();
  for (let i = 0; i < 6; i++) {
    const candidate = path.join(dir, 'content', 'posts');
    if (fs.existsSync(candidate)) {
      return candidate;
    }
    dir = path.dirname(dir);
  }
  throw new Error('向上查找 6 层仍找不到 content/posts 目录，请在仓库内运行测试');
};

const postsDir = findPostsDir();

const sourceFiles = fs
  .readdirSync(postsDir)
  .filter((f) => f.endsWith('.md') && f !== '_index.md');

const yearOfFile = (file: string): number | null => {
  const raw = fs.readFileSync(path.join(postsDir, file), 'utf8');
  const m = raw.match(/^date:\s*['"]?(20\d{2})/m);
  return m ? Number(m[1]) : null;
};

describe('data/posts', () => {
  it('画面上出现的每一篇都有对应的源文件', () => {
    const refs = [...years.flatMap((y) => y.posts), ...journalPosts];
    expect(refs.length).toBeGreaterThan(0);
    for (const ref of refs) {
      expect(sourceFiles, `面板上显示了「${ref.label}」，但 content/posts/${ref.file} 不存在`).toContain(ref.file);
    }
  });

  it('各年 count 与 content/posts 里的实际篇数一致', () => {
    for (const entry of years) {
      const actual = sourceFiles.filter((f) => yearOfFile(f) === entry.year).length;
      expect(
        actual,
        `${entry.year} 年实际有 ${actual} 篇，但 data/posts.ts 写的是 ${entry.count} 篇 —— 请更新 video/src/data/posts.ts`,
      ).toBe(entry.count);
    }
  });

  it('totalPosts 等于各年 count 之和', () => {
    expect(totalPosts).toBe(years.reduce((acc, y) => acc + y.count, 0));
  });

  it('totalPosts 等于源文件总数', () => {
    expect(totalPosts).toBe(sourceFiles.length);
  });

  it('年份按时间升序排列', () => {
    const list = years.map((y) => y.year);
    expect(list).toEqual([...list].sort((a, b) => a - b));
  });

  it('yearEntry 找不到年份时报错', () => {
    expect(() => yearEntry(1999)).toThrow(/1999/);
  });
});

describe('toZhNumeral', () => {
  it('个位数', () => {
    expect(toZhNumeral(5)).toBe('五');
  });

  it('十几', () => {
    expect(toZhNumeral(11)).toBe('十一');
    expect(toZhNumeral(12)).toBe('十二');
  });

  it('整十', () => {
    expect(toZhNumeral(20)).toBe('二十');
  });

  it('三十六', () => {
    expect(toZhNumeral(36)).toBe('三十六');
  });

  it('视频用到的数字都能转', () => {
    for (const n of [2, 3, 4, 5, 6]) {
      expect(toZhNumeral(n)).not.toContain('undefined');
    }
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

```bash
cd video && npm test
```

Expected: FAIL — 无法解析 `./posts`。

- [ ] **Step 3: 建 `video/src/data/posts.ts`**

`file` 字段对应 `content/posts/` 下的真实文件名，`label` 是画面上显示的简称。两者分开是为了让测试能精确校验，同时画面文字保持简洁。

```ts
export type PostRef = {
  /** 画面上显示的名字，可以是简称 */
  label: string;
  /** content/posts/ 下的源文件名，供测试校验 */
  file: string;
};

export type YearEntry = {
  year: number;
  /** 那一年的动词：搬 / 停笔 / 学 / 做 / 造 */
  verb: string;
  /** 画面上列出的篇名。可以少于 count，按展示需要裁剪 */
  posts: PostRef[];
  /** 该年真实篇数，由测试与 content/posts 对齐 */
  count: number;
  /** true 时用低对比变体渲染（2023 停笔） */
  subdued?: boolean;
  /** subdued 变体在篇名位置显示的短语 */
  note?: string;
};

export const years: YearEntry[] = [
  {
    year: 2022,
    verb: '搬',
    count: 5,
    posts: [
      {label: '蛙泳学思', file: 'swim.md'},
      {label: '深度思考', file: 'deep-thinking.md'},
      {label: '孙子兵法', file: 'art-of-war.md'},
      {label: '扩展性设计', file: 'extend-design.md'},
      {label: '文章搬运开始啦', file: 'kaishila.md'},
    ],
  },
  {
    year: 2023,
    verb: '停笔',
    count: 2,
    posts: [],
    subdued: true,
    note: '两 篇',
  },
  {
    year: 2024,
    verb: '学',
    count: 6,
    posts: [
      {label: 'Python 学习总结', file: 'ai-python.md'},
      {label: '后端开发经验', file: 'ai-backend-dev.md'},
      {label: 'LLM 长记忆工具', file: 'ai-longterm-memory.md'},
      {label: 'Devops 概念梳理', file: 'devops.md'},
    ],
  },
  {
    year: 2025,
    verb: '做',
    count: 11,
    posts: [
      {label: 'Cursor & Claude Code', file: 'ai-cursor-claudecode.md'},
      {label: 'Vibe Coding', file: 'ai-vibe-coding.md'},
      {label: 'WebGL-Hub', file: 'ai-apps-webgl.md'},
      {label: 'AI 应用前端技术', file: 'ai-tec-web.md'},
    ],
  },
  {
    year: 2026,
    verb: '造',
    count: 12,
    posts: [
      {label: 'LangGraph 深度学习', file: 'ai-agent-langgraph.md'},
      {label: 'Dify Graphon 到 LangGraph', file: 'workflow-engine-graphon-langgraph.md'},
      {label: '渐进式渲染专利思路', file: 'llm-progressive-ui-patent-concept.md'},
    ],
  },
];

export const journalPosts: PostRef[] = [
  {label: '六国论', file: 'liuguolun.md'},
  {label: '了凡四训', file: 'liaofansixun.md'},
  {label: '苏东坡', file: 'sudongpo.md'},
  {label: '红楼梦', file: 'hongloumeng.md'},
  {label: '三体', file: 'santi.md'},
  {label: '俞军产品方法论', file: 'yujun-product-methodology.md'},
];

export const totalPosts = 36;
export const siteUrl = 'zhixia.pages.dev';
export const closingLine = '技术是工作，抄书是日子。';

export const yearEntry = (year: number): YearEntry => {
  const found = years.find((y) => y.year === year);
  if (!found) {
    throw new Error(`data/posts.ts 中没有 ${year} 年的数据`);
  }
  return found;
};

const ZH_DIGITS = '〇一二三四五六七八九';

/** 36 -> 三十六。只处理 1-99，本项目用不到更大的数。 */
export const toZhNumeral = (n: number): string => {
  if (!Number.isInteger(n) || n < 0 || n > 99) {
    throw new Error(`toZhNumeral 只支持 0-99 的整数，收到 ${n}`);
  }
  if (n < 10) {
    return ZH_DIGITS[n];
  }
  if (n < 20) {
    return `十${n % 10 === 0 ? '' : ZH_DIGITS[n % 10]}`;
  }
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  return `${ZH_DIGITS[tens]}十${ones === 0 ? '' : ZH_DIGITS[ones]}`;
};
```

- [ ] **Step 4: 跑测试确认通过**

```bash
cd video && npm test
```

Expected: PASS — 11 个测试全绿。

若「各年 count 与实际篇数一致」失败，说明 `content/posts/` 有新文章，按失败信息里的提示更新 `count`。

- [ ] **Step 5: 提交**

```bash
git add video/src/data
git commit -m "Add post data with source-file validation tests

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

## Task 4: 基础视觉组件（Paper / FadeIn / InkLine）

**Files:**
- Create: `video/src/components/Paper.tsx`
- Create: `video/src/components/FadeIn.tsx`
- Create: `video/src/components/InkLine.tsx`
- Modify: `video/src/BlogIntro.tsx`

- [ ] **Step 1: 建 `video/src/components/FadeIn.tsx`**

spec 的动效原则：淡入配 8–12px 上移，缓动统一 `bezier(0.22, 1, 0.36, 1)`。

```tsx
import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {ease} from '../theme';

export const FadeIn: React.FC<{
  /** 相对镜头开始的延迟帧数 */
  delay?: number;
  durationInFrames?: number;
  /** 上移距离（px），0 表示只淡入不位移 */
  rise?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({delay = 0, durationInFrames = 18, rise = 10, children, style}) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame - delay, [0, durationInFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ease,
  });

  return (
    <div
      style={{
        opacity: progress,
        transform: `translateY(${(1 - progress) * rise}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};
```

- [ ] **Step 2: 建 `video/src/components/Paper.tsx`**

宣纸底 + 极淡的噪点纹理。噪点用内联 SVG `feTurbulence`，避免引入图片资源。

```tsx
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {colors} from '../theme';

const NOISE_SVG =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)'/%3E%3C/svg%3E\")";

export const Paper: React.FC = () => {
  return (
    <AbsoluteFill style={{backgroundColor: colors.paper}}>
      <AbsoluteFill style={{backgroundImage: NOISE_SVG, opacity: 0.06}} />
    </AbsoluteFill>
  );
};
```

- [ ] **Step 3: 建 `video/src/components/InkLine.tsx`**

细横线自左展开。`transformOrigin: 'left center'` 是关键，否则会从中心往两边长。

```tsx
import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {colors, ease} from '../theme';

export const InkLine: React.FC<{
  width: number | string;
  delay?: number;
  durationInFrames?: number;
  color?: string;
  thickness?: number;
  style?: React.CSSProperties;
}> = ({
  width,
  delay = 0,
  durationInFrames = 24,
  color = colors.rule,
  thickness = 1,
  style,
}) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame - delay, [0, durationInFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ease,
  });

  return (
    <div
      style={{
        width,
        height: thickness,
        backgroundColor: color,
        transform: `scaleX(${progress})`,
        transformOrigin: 'left center',
        ...style,
      }}
    />
  );
};
```

- [ ] **Step 4: 临时改 `video/src/BlogIntro.tsx` 做目视验证**

把这三个组件摆进画面，用完即弃（Task 11 会整体重写这个文件）。

```tsx
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {FadeIn} from './components/FadeIn';
import {InkLine} from './components/InkLine';
import {Paper} from './components/Paper';
import {colors, fonts} from './theme';

export const BlogIntro: React.FC = () => {
  return (
    <AbsoluteFill>
      <Paper />
      <AbsoluteFill style={{padding: 160, justifyContent: 'center', gap: 40}}>
        <FadeIn delay={0}>
          <div style={{fontFamily: fonts.title, fontSize: 72, color: colors.ink}}>
            淡入测试
          </div>
        </FadeIn>
        <InkLine width={600} delay={6} />
        <InkLine width={400} delay={12} color={colors.seal} thickness={3} />
        <FadeIn delay={40} rise={0}>
          <div style={{fontFamily: fonts.body, fontSize: 28, color: colors.inkMuted}}>
            延迟淡入测试
          </div>
        </FadeIn>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
```

- [ ] **Step 5: 渲染代表帧**

```bash
cd video && npm run typecheck && npx remotion still BlogIntro out/check-base.png --frame=120
```

Expected: 生成 `video/out/check-base.png`。

- [ ] **Step 6: 看图核验**

用 Read 工具打开 `video/out/check-base.png`，逐项确认：

- 背景是暖白宣纸色（不是纯白），能看到极淡的颗粒感
- 「淡入测试」完全不透明，宋体
- 两条横线的**左端对齐**在同一竖直线上（验证 `transformOrigin` 生效），且已经完整展开
- 朱红那条比灰的那条粗、颜色是深朱红
- 「延迟淡入测试」完全不透明
- 没有任何文字溢出画面边缘

有任一项不符就修对应组件，重跑 Step 5。

- [ ] **Step 7: 提交**

```bash
git add video/src/components video/src/BlogIntro.tsx
git commit -m "Add paper, fade-in and ink-line primitives

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

> **实施后修订（`3d332b8`、`9edfd5e`）** —— 上面这些代码块在实施后经质量审查改动过，以仓库里的代码为准：
>
> - **入场时长**。`FadeIn` / `InkLine` 的默认时长统一改为 `theme.ts` 的 `ENTRANCE_FRAMES = 30`（原为 18 / 24）。改的原因有二：该缓动非常前置，18 帧会把淡入压成三帧台阶，读起来是"弹入"而非淡入；且 `InkLine` 比 `FadeIn` 长，会让横线晚于它所锚定的文字画完。经八拍核算，最紧的两处（第 3 拍「两篇」delay 70、第 7 拍落款 delay 86）仍留出 1.67 / 2.13 秒静置，全部满足 spec §3.3。
> - **纸纹重做**。原实现是逐像素噪点（still 里 σ 0.78），但 Remotion 每帧先经 **JPEG-80 中间态**编码，把它完全抹平——从成片抽帧实测 σ **0.000**，即纸纹只存在于 `remotion still` 里，成品是纯平色，且 Task 4–11 所有基于 still 的核验都会看不出来。现改为低频纹理（`baseFrequency 0.035` + 灰度化 + `overlay`），成片抽帧实测 σ 2.88、三通道均值落在 `colors.paper` 上。
> - **纸纹强度还没签核**。上一条里 σ 2.88 这一版我并没有在正确的图上看过：早先签核「读作安静的细纸纹」时看的是 `out/probe-final-f0.png`（12:34），那是 `9edfd5e` **之前**的纹理，比出货版强一倍（色度 σ 4.39 vs 2.04）。出货的 `out/final-still.png` 在一屏留白里读作揉皱的纸，不是我说的细纸纹。复审建议先别动参数——留白是纸纹最难看的场景，正文压上去会重新锚定白点——所以留到 Task 11 有真实字时再判（见 Task 11 Step 4）。
> - **`GUTTER = 160`** 已提到 `theme.ts`，后续镜头不要再写字面量。**`FadeIn` 在无位移时不再输出 `transform`**，避免无谓地成为绝对定位子元素的包含块 —— 但注意进场过程中仍在输出 `translateY`，那时它依然是包含块，**印章这类绝对定位子元素不能放进 `FadeIn`**（Task 5 起适用）。
>
> 与本任务无关但会影响 Task 12：这台机器的 Homebrew `ffmpeg` / `ffprobe` 起不来（`dyld: libopenvino_onnx_frontend`），成片核验请用 `npx remotion media-parser` 或 `node_modules/@remotion/compositor-darwin-arm64` 里的二进制。

---

## Task 5: 印章组件

**Files:**
- Create: `video/src/components/Seal.tsx`
- Modify: `video/src/BlogIntro.tsx`

- [ ] **Step 1: 建 `video/src/components/Seal.tsx`**

spec 规定这是全片唯一一处"重"动效：scale 落下 + 回弹。用 `spring` 而不是 bezier，因为回弹正是 spring 的自然行为。

```tsx
import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {colors, fonts} from '../theme';

export const Seal: React.FC<{
  /** 印章文字，用 \n 分行。例如 '钟\n灵' 会排成竖排两字 */
  text: string;
  size?: number;
  delay?: number;
  style?: React.CSSProperties;
}> = ({text, size = 104, delay = 0, style}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: {damping: 14, mass: 0.7, stiffness: 220},
  });

  const scale = interpolate(progress, [0, 1], [1.55, 1]);
  const translateY = interpolate(progress, [0, 1], [-30, 0]);
  const opacity = interpolate(progress, [0, 0.12], [0, 1], {
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
        opacity,
        transform: `translateY(${translateY}px) scale(${scale})`,
        ...style,
      }}
    >
      {text}
    </div>
  );
};
```

- [ ] **Step 2: 临时改 `video/src/BlogIntro.tsx` 做目视验证**

```tsx
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Paper} from './components/Paper';
import {Seal} from './components/Seal';
import {colors, fonts} from './theme';

export const BlogIntro: React.FC = () => {
  return (
    <AbsoluteFill>
      <Paper />
      <AbsoluteFill style={{padding: 160}}>
        <Seal text={'钟\n灵'} delay={10} />
        <Seal text={'钟\n灵'} delay={10} size={200} style={{position: 'absolute', right: 160, top: 160}} />
        <div style={{fontFamily: fonts.title, fontSize: 28, color: colors.inkMuted, position: 'absolute', bottom: 160}}>
          印章落下后应完全停稳，不回弹过度
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
```

- [ ] **Step 3: 渲染两个关键帧**

```bash
cd video && npm run typecheck && npx remotion still BlogIntro out/check-seal-drop.png --frame=12 && npx remotion still BlogIntro out/check-seal-overshoot.png --frame=16 && npx remotion still BlogIntro out/check-seal-settled.png --frame=120
```

Expected: 生成三张 PNG（下面 Step 4 的帧号已按实测的 spring 行为修正）。

- [ ] **Step 4: 看图核验**

Read `video/out/check-seal-drop.png`（第 12 帧，delay 10）：印章应当**明显比最终尺寸大、位置偏上**（实测小章 136px / 大章 264px，约最终尺寸的 1.31 倍）。此时**已经完全不透明**——透明度在 progress 0.12 就到 1，比尺寸先到位，所以别指望在这一帧看到半透明。

Read `video/out/check-seal-overshoot.png`（第 16 帧）：**这一帧不是「还没落定」**。这套 spring（damping 14 / mass 0.7 / stiffness 220，ζ≈0.56）从 progress 0 到 1 只用 **4.4 帧**，第 16 帧已越过最终值、正落在过冲上：比最终尺寸小约 6%、位置低 8–10px（过冲由 translateY 的约 3.5px 加上 scale 绕中心收缩使盒顶下移构成）。要看「delay 之前不可见」，渲第 5 帧——印章像素应为 0（负帧被 `springCalculation` 的 `Math.max(0, frame)` 夹住，progress 0 → opacity 0）。

Read `video/out/check-seal-settled.png`，逐项确认：

- 两个印章都端正清晰，**大小比例正确**（大的是小的约 2 倍）
- 印章内文字是「钟」在上、「灵」在下，两行都居中
- 印章底色是朱红，字是宣纸色
- 印章是方形、四个角有**轻微**圆角（不是圆或大圆角）
- 印章停在了最终位置，没有偏移或被裁切

- [ ] **Step 5: 提交**

```bash
git add video/src/components/Seal.tsx video/src/BlogIntro.tsx
git commit -m "Add seal drop animation

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

## Task 6: 年份卡组件

**Files:**
- Create: `video/src/components/YearCard.tsx`

- [ ] **Step 1: 建 `video/src/components/YearCard.tsx`**

这是复用 4 次的组件（2022 / 2024 / 2025 / 2026），外加 2023 的 `subdued` 变体。年份数字用等宽体、朱红；`subdued` 时降到细线色。

```tsx
import React from 'react';
import {AbsoluteFill} from 'remotion';
import type {YearEntry} from '../data/posts';
import {colors, fonts, GUTTER} from '../theme';
import {FadeIn} from './FadeIn';

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

      <div style={{display: 'flex', alignItems: 'baseline', gap: 28, marginTop: 22}}>
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
```

`subdued` 的分支故意把「两 篇」的延迟设成 70 帧（约 2.3 秒）—— spec 要求这一拍"画面几乎静止 3 秒"，晚出现才会产生停顿感。

本任务**不做渲染核验**：这个组件要喂给 5 个镜头（2022–2026），单独渲染一次是重复劳动。它的目视核验放在 Task 7，那里会一次渲染出全部五种年份状态，包括 `subdued` 变体。

- [ ] **Step 2: 提交**

```bash
git add video/src/components/YearCard.tsx
git commit -m "Add year card component

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

## Task 7: 六个年份镜头（Scene02–Scene06）

**Files:**
- Create: `video/src/scenes/Scene02Year.tsx`
- Create: `video/src/scenes/Scene03Year.tsx`
- Create: `video/src/scenes/Scene04Year.tsx`
- Create: `video/src/scenes/Scene05Year.tsx`
- Create: `video/src/scenes/Scene06Year.tsx`
- Modify: `video/src/BlogIntro.tsx`

这五个文件各自只有几行，是刻意的：每个镜头有自己的名字和文件，后面要单独改某一拍时不用在一个大文件里找。年份用 `yearEntry(2022)` 查找而不是数组下标，这样在 `data/posts.ts` 里插入新年份不会让镜头错位。

- [ ] **Step 1: 建五个镜头文件**

`video/src/scenes/Scene02Year.tsx`：

```tsx
import React from 'react';
import {YearCard} from '../components/YearCard';
import {yearEntry} from '../data/posts';

export const Scene02Year: React.FC = () => <YearCard entry={yearEntry(2022)} />;
```

`video/src/scenes/Scene03Year.tsx`：

```tsx
import React from 'react';
import {YearCard} from '../components/YearCard';
import {yearEntry} from '../data/posts';

export const Scene03Year: React.FC = () => <YearCard entry={yearEntry(2023)} />;
```

`video/src/scenes/Scene04Year.tsx`：

```tsx
import React from 'react';
import {YearCard} from '../components/YearCard';
import {yearEntry} from '../data/posts';

export const Scene04Year: React.FC = () => <YearCard entry={yearEntry(2024)} />;
```

`video/src/scenes/Scene05Year.tsx`：

```tsx
import React from 'react';
import {YearCard} from '../components/YearCard';
import {yearEntry} from '../data/posts';

export const Scene05Year: React.FC = () => <YearCard entry={yearEntry(2025)} />;
```

`video/src/scenes/Scene06Year.tsx`：

```tsx
import React from 'react';
import {YearCard} from '../components/YearCard';
import {yearEntry} from '../data/posts';

export const Scene06Year: React.FC = () => <YearCard entry={yearEntry(2026)} />;
```

- [ ] **Step 2: 临时改 `video/src/BlogIntro.tsx` 做目视验证**

用**与 `timings.ts` 完全一致**的帧区间，这样这里的核验帧和成片里的位置一一对应。

```tsx
import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {Paper} from './components/Paper';
import {Scene02Year} from './scenes/Scene02Year';
import {Scene03Year} from './scenes/Scene03Year';
import {Scene04Year} from './scenes/Scene04Year';
import {Scene05Year} from './scenes/Scene05Year';
import {Scene06Year} from './scenes/Scene06Year';

export const BlogIntro: React.FC = () => {
  return (
    <AbsoluteFill>
      <Paper />
      <Sequence from={150} durationInFrames={240}>
        <Scene02Year />
      </Sequence>
      <Sequence from={390} durationInFrames={150}>
        <Scene03Year />
      </Sequence>
      <Sequence from={540} durationInFrames={300}>
        <Scene04Year />
      </Sequence>
      <Sequence from={840} durationInFrames={360}>
        <Scene05Year />
      </Sequence>
      <Sequence from={1200} durationInFrames={420}>
        <Scene06Year />
      </Sequence>
    </AbsoluteFill>
  );
};
```

- [ ] **Step 3: 渲染五张代表帧**

每个镜头取该拍动画全部停稳后的一帧（都在该拍的最后一秒内）：

```bash
cd video && npm run typecheck \
  && npx remotion still BlogIntro out/check-y2022.png --frame=360 \
  && npx remotion still BlogIntro out/check-y2023.png --frame=520 \
  && npx remotion still BlogIntro out/check-y2024.png --frame=810 \
  && npx remotion still BlogIntro out/check-y2025.png --frame=1170 \
  && npx remotion still BlogIntro out/check-y2026.png --frame=1590
```

- [ ] **Step 4: 逐张看图核验**

Read 这五张 PNG。每一张都要确认：

- 年份数字是**朱红**（2023 那张是**灰色**）
- 年份数字是等宽体，字重很粗，尺寸很大但**没有溢出左边距**
- 动词在年份下方，宋体，字间距明显拉开
- 年份数字右边一行小字「N 篇」，N 分别是 5 / 2 / 6 / 11 / 12
- 篇名列表在动词下方，灰色，用全角间隔号「　·　」连接，**不换行溢出、不超出右边界**
- 2023 那张：只有「停笔」「2 篇」「两 篇」，**没有**篇名列表，整体对比度明显比其它四张低
- 五张的背景都是同一张宣纸

重点检查 2026 那张：它有最长的篇名（「Dify Graphon 到 LangGraph」），最容易溢出。

- [ ] **Step 5: 提交**

```bash
git add video/src/scenes video/src/BlogIntro.tsx
git commit -m "Add five year scenes

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

## Task 8: 开场镜头（Scene01）

**Files:**
- Create: `video/src/scenes/Scene01Title.tsx`
- Modify: `video/src/BlogIntro.tsx`

- [ ] **Step 1: 建 `video/src/scenes/Scene01Title.tsx`**

spec 要求：「钟灵毓秀」**逐字**淡入，细横线自左展开，朱红印章在右上一顿落下。所以标题要拆成四个字符各自延迟，而不是整块淡入。

```tsx
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
```

副标题里篇数走 `toZhNumeral(totalPosts)`，所以改数据文件里的 `totalPosts` 会同时改到这里和终端那一拍 —— 不会出现两处数字打架。

三处水平 160 全部走 `GUTTER`（与 Task 6 的 `4a08ecd` 同一处理）：它们是版心边距，和 `YearCard` 用的是同一个数，写死会让改版心时漏掉这里。`top: 168` / `top: 150` 是纵向定位，不是边距，保持字面量。

标题的 `rise={12}` 压在 spec §3.3「文字入场配 8–12px 上移」的上界。这里原本写 14，越出了范围，而 spec §3.3 与 `FadeIn.tsx` 的 JSDoc 都写 8–12；两份文档和代码打架时改代码，别改文档。全片其余调用点（`YearCard.tsx` 的 12 / 10 / 10 / 0）都在范围内。

- [ ] **Step 2: 临时改 `video/src/BlogIntro.tsx` 做目视验证**

```tsx
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Paper} from './components/Paper';
import {Scene01Title} from './scenes/Scene01Title';

export const BlogIntro: React.FC = () => {
  return (
    <AbsoluteFill>
      <Paper />
      <Scene01Title />
    </AbsoluteFill>
  );
};
```

- [ ] **Step 3: 渲染两个关键帧**

```bash
cd video && npm run typecheck \
  && npx remotion still BlogIntro out/check-title-stagger.png --frame=12 \
  && npx remotion still BlogIntro out/check-title-end.png --frame=145
```

**核验帧是 12 不是 20 上下**：四个字各 20 帧、错开 5 帧起手，最后一个字在第 35 帧落定。第 22 帧时第 4 个字已到约 92% 不透明度，看着接近「整齐划一」，证明不了逐字。第 12 帧才是各字状态拉开的一帧。

- [ ] **Step 4: 看图核验**

Read `video/out/check-title-stagger.png`（第 12 帧）：应当**四字状态明显不同** —— 第 1、2 字实墨已落定，第 3 字灰、第 4 字几乎看不见。若四字浓淡一致，说明逐字延迟没生效。（实测基准：第 12 帧下「钟」「灵」全黑、「毓」中灰、「秀」缺失。）

Read `video/out/check-title-end.png`（第 145 帧），逐项确认：

- 「钟灵毓秀」四字完整、宋体、字间距很宽，整体在画面**左下偏下**位置
- 副标题「四年半 · 三十六篇」在标题下方，「三十六」是**中文数字**不是「36」
- 细横线在左上（y≈168、x 160–580），已完全展开，是浅灰色
- 朱红印章在右上（落定态 x 1656–1760、y 150–253），方正，内为竖排「钟」「灵」
- 印章和横线**都不与标题重叠**（标题顶边约 y≈690）
- 无文字溢出

**这一步不判纸纹强度** —— still 直接渲染、不过 JPEG 中间帧，是纸纹的**上界**。判定见 Task 11 Step 4。

- [ ] **Step 5: 提交**

```bash
git add video/src/scenes/Scene01Title.tsx video/src/BlogIntro.tsx
git commit -m "Add title scene with per-character fade

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

## Task 9: 贯穿线镜头（Scene07）

**Files:**
- Create: `video/src/components/Timeline.tsx`
- Create: `video/src/scenes/Scene07Timeline.tsx`
- Modify: `video/src/BlogIntro.tsx`

- [ ] **Step 1: 建 `video/src/components/Timeline.tsx`**

年度轴用细线，札记用一条**粗的朱红实线**压在其下 —— 视觉上表达"五年里只有这一条没断过"。

```tsx
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {closingLine, journalPosts, years} from '../data/posts';
import {colors, fonts, GUTTER} from '../theme';
import {FadeIn} from './FadeIn';
import {InkLine} from './InkLine';

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
```

- [ ] **Step 2: 建 `video/src/scenes/Scene07Timeline.tsx`**

```tsx
import React from 'react';
import {Timeline} from '../components/Timeline';

export const Scene07Timeline: React.FC = () => <Timeline />;
```

- [ ] **Step 3: 临时改 `video/src/BlogIntro.tsx` 做目视验证**

```tsx
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Paper} from './components/Paper';
import {Scene07Timeline} from './scenes/Scene07Timeline';

export const BlogIntro: React.FC = () => {
  return (
    <AbsoluteFill>
      <Paper />
      <Scene07Timeline />
    </AbsoluteFill>
  );
};
```

- [ ] **Step 4: 渲染代表帧**

```bash
cd video && npm run typecheck && npx remotion still BlogIntro out/check-read.png --frame=175
```

- [ ] **Step 5: 看图核验**

Read `video/out/check-read.png`，逐项确认：

- 顶部是「读 · 从未断过」，宋体
- 五个年份 2022 2023 2024 2025 2026 **左端和右端分别对齐**画面的左右边距，均匀分布
- 年份下方有**两条线**：上面一条细灰线，下面一条粗朱红线，两条**等宽且左右对齐**
- 札记篇名在朱红线下方，灰色，六个名字用全角间隔号连接，**不溢出**
- 最下方是「技术是工作，抄书是日子。」，宋体，比其它文字大
- 无重叠、无溢出

- [ ] **Step 6: 提交**

```bash
git add video/src/components/Timeline.tsx video/src/scenes/Scene07Timeline.tsx video/src/BlogIntro.tsx
git commit -m "Add through-line timeline scene

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

## Task 10: 终端落版镜头（Scene08）

**Files:**
- Create: `video/src/components/Typewriter.tsx`
- Create: `video/src/components/TerminalCard.tsx`
- Create: `video/src/scenes/Scene08Terminal.tsx`
- Modify: `video/src/BlogIntro.tsx`

- [ ] **Step 1: 建 `video/src/components/Typewriter.tsx`**

```tsx
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {termColors} from '../theme';

export const Typewriter: React.FC<{
  text: string;
  /** 相对镜头开始的起始帧 */
  startFrame: number;
  /** 每帧输出多少个字符 */
  charsPerFrame?: number;
  color?: string;
  style?: React.CSSProperties;
}> = ({text, startFrame, charsPerFrame = 1.4, color = termColors.fg, style}) => {
  const frame = useCurrentFrame();
  const elapsed = Math.max(0, frame - startFrame);
  const visible = Math.min(text.length, Math.floor(elapsed * charsPerFrame));

  return <span style={{color, ...style}}>{text.slice(0, visible)}</span>;
};

/** 30fps 下 15 帧亮 15 帧灭 = 1Hz 闪烁 */
export const Cursor: React.FC<{style?: React.CSSProperties}> = ({style}) => {
  const frame = useCurrentFrame();
  const on = Math.floor(frame / 15) % 2 === 0;

  return (
    <span
      style={{
        display: 'inline-block',
        width: 14,
        height: 28,
        backgroundColor: termColors.blue,
        verticalAlign: -4,
        marginLeft: 8,
        opacity: on ? 1 : 0,
        ...style,
      }}
    />
  );
};
```

- [ ] **Step 2: 建 `video/src/components/TerminalCard.tsx`**

这一拍是 spec 说的主转场：终端底色从不透明 0 淡入到 1，**盖在宣纸上**；同时一条朱红细线横扫而过，表达"宣纸退场"。因为终端层是不透明的，宣纸自然被覆盖，不需要单独做淡出。

盖场用 18 帧而不是 `ENTRANCE_FRAMES`(30)：它不是「元素落在一张静止页上」，是整帧换场，而且必须赶在第一条 `Typewriter`（第 6 帧）起手之前基本做完，否则字会浮在半透明的场里。`ease` 前段极陡，正是 18 帧够用的原因。

**朱红线的缓动是 spec §3.3「缓动统一」的一个明示例外**（spec 里已记这一笔）。`ease` 是给透明度/位移的「入场」用的前倾曲线；拿来跑一条**横扫的线**，会让它第 3 帧就盖过九成屏宽、第 4 帧扫完全程，之后却要二十来帧才慢慢退出画面 —— 读到的是闪光接一段拖尾，不是横扫。所以这条线用对称的 `Easing.inOut(Easing.quad)`：起步与收尾都缓、中段快，读作一次从容的扫过。两条曲线各自服务各自的目的，不要合并成一个 token。

朱红线用 `translateX` 从画面左外进、右外出，**横跨整帧、不对齐 GUTTER**：前七拍的墨线是「页面上的一行」，所以对齐版心；这一条是「盖场动作」，全出血才是对的。

下面是这一拍的实现。**以 `video/src/components/TerminalCard.tsx` 为准** —— 这一块是计划里的快照（连带省掉了组件的 JSDoc），实现过程中若有微调只改文件，不要回来同步这一块。

```tsx
import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {siteUrl, totalPosts} from '../data/posts';
import {colors, ease, fonts, GUTTER, termColors} from '../theme';
import {FadeIn} from './FadeIn';
import {Cursor, Typewriter} from './Typewriter';

/** 行首那个绿色 ❯。末尾的空格是承重的：去掉它，❯ 会贴死在打出来的字上。 */
const Prompt: React.FC = () => <span style={{color: termColors.green}}>❯ </span>;

const SCANLINES =
  'repeating-linear-gradient(0deg, rgba(255,255,255,0.02) 0 1px, transparent 1px 3px)';

/** 朱红线横扫的时长。线从画面左外进、右外出，这个区间定了它的速度。 */
const SWEEP_FRAMES = 26;

/** 第二行的 @ 与主机名共用这个起手帧。@ 若像提示符那样从头常驻，它会在名字
 *  还没打出来时先孤零零地挂在行首。 */
const ZHIXIA_START = 34;

/** 终端正文的字号与行高。父级的 fontSize / lineHeight 与第 2 行的 minHeight
 *  都从这里取（第 2 行为什么需要 minHeight，见那一段的注释）。 */
const MONO_SIZE = 30;
const MONO_LINE = 2.1;

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

      {/* -1 完全在左框外，0 铺满整帧，+1 从右边扫出。clamp 会把线停在画面外，
          所以不需要额外的守卫来决定它什么时候消失。 */}
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
```

- [ ] **Step 3: 建 `video/src/scenes/Scene08Terminal.tsx`**

```tsx
import React from 'react';
import {TerminalCard} from '../components/TerminalCard';

export const Scene08Terminal: React.FC = () => <TerminalCard />;
```

- [ ] **Step 4: 临时改 `video/src/BlogIntro.tsx` 做目视验证**

```tsx
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Paper} from './components/Paper';
import {Scene08Terminal} from './scenes/Scene08Terminal';

// 临时预览：单独渲染终端镜头做目视验证。
// Task 11 才用 Beat 包装定稿 —— 别把这里的直接渲染当成最终结构。
// Root.tsx 里 composition 的时长仍是整片的 2040 帧，而这里没有 Sequence，
// 第 0 帧就是入场起点：终端在第 18 帧把宣纸盖满，随后各行吐字、右下角网址淡入，
// 这些到第 160 帧全部落定；再往后到第 2040 帧画面就停了（只剩光标还在亮灭）。
// 所以渲整片得到的是「整段都停在终端这一拍」（入场动画只在开头跑一遍），
// 不是一条八秒的预览。
export const BlogIntro: React.FC = () => {
  return (
    <AbsoluteFill>
      <Paper />
      <Scene08Terminal />
    </AbsoluteFill>
  );
};
```

- [ ] **Step 5: 渲染三个关键帧**

```bash
cd video && npm run typecheck \
  && npx remotion still BlogIntro out/check-term-start.png --frame=2 \
  && npx remotion still BlogIntro out/check-term-sweep.png --frame=13 \
  && npx remotion still BlogIntro out/check-term-mid.png --frame=100 \
  && npx remotion still BlogIntro out/check-term-end.png --frame=230 \
  && npx remotion still BlogIntro out/check-term-line2-before.png --frame=21 \
  && npx remotion still BlogIntro out/check-term-line2-after.png --frame=24 \
  && npx remotion still BlogIntro out/check-term-line4-before.png --frame=88 \
  && npx remotion still BlogIntro out/check-term-line4-after.png --frame=90
```

- [ ] **Step 6: 看图核验**

Read `video/out/check-term-start.png`：应当能看到**宣纸还没被完全盖住**（偏浅或半透明），且朱红线**刚从左边框探进来一小截**。这验证转场。

**这一步必须挑早年帧，第 2 帧是量出来的、不是随手挑的。** `cover` 用的 `ease`（bezier(0.22, 1, 0.36, 1)）前段极陡，实测第 8 帧已经盖到九成以上 —— 拿第 8 帧来核「宣纸还在不在」，看到的只会是一张几乎全黑的图，然后把一个正常的转场误判成「没做」。sweep 同理，挑晚了只能看到线已经出画。

Read `video/out/check-term-sweep.png`（第 13 帧）：`SWEEP_FRAMES` 取 26 且用 `inOut(quad)`，中点正在第 13 帧，此时**线应当正好铺满整帧**（左右两端都顶到画面边缘）。这是这条线唯一的形状核验点 —— 若它此时没顶满，说明 `SWEEP_FRAMES` 或缓动被人改过。

Read 四张 `check-term-line2-before/after.png`（第 21 / 24 帧）与 `check-term-line4-before/after.png`（第 88 / 90 帧）：**每一对之间，画面上已经有文字的那些行的 y 位置必须逐像素相同。**

这两对是同一件事的两个实例，都出在「整行都由 `Typewriter` 吐出」的行上 —— 第 2 行到第 22 帧才吐出第一个字，`36` 那行到第 89 帧才吐出。在那之前那个 `div` 里只有一个空 span，不生成 line box、高度是 0，而外层是垂直居中，于是字一落地**整块版面就跳一下**（实测 `36` 落地那帧上跳 46px，第 22 帧另有一次）。两个 `minHeight` 就是钉这个的。看这两对图时不能只看「字出来了没有」—— 要量已有行的位置动没动。

Read `video/out/check-term-mid.png`：`36` **已经输完**（第 88 帧起手、每帧 4 字，两个字一帧就出齐），`还在写…` 那一行的**文字**还没出现 —— 但那行的绿色 `❯` 与闪烁光标从第 0 帧就在渲染，所以那一行并不是空的。这两点都不是缺陷，是提示符本来就是常驻的。

Read `video/out/check-term-end.png`，逐项确认：

- 背景是**深色**（近黑，不是宣纸），有极淡的横向扫描线
- 四行内容依次是：`❯ whoami` / `zhongling@zhixia`（`@` 是青色）/ `❯ posts --since 2022 --count` / `36`
- `36` 是**青色**、明显很大、等宽体
- 最后一行 `❯ 还在写…`，后面有一个**蓝色方块光标**（`termColors.blue`，不是 `cyan` —— spec §3.1 里 蓝=termBlue `#58a6ff`、青=termCyan `#4ec9b0`，这一处用的是前者）
- 右下角有 `zhixia.pages.dev`
- 全部是等宽字体
- 无溢出

注意：光标是闪烁的，`--frame=230` 时正好处于熄灭状态（`floor(230/15) = 15`，是奇数）。如果看不到光标，改用 `--frame=220`（`floor(220/15) = 14`，是偶数）再看一次，不要误判为 bug。

- [ ] **Step 7: 提交**

```bash
git add video/src/components/Typewriter.tsx video/src/components/TerminalCard.tsx video/src/scenes/Scene08Terminal.tsx video/src/BlogIntro.tsx
git commit -m "Add terminal closing scene with style switch

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

## Task 11: 组装整片

**Files:**
- Modify: `video/src/BlogIntro.tsx`

- [ ] **Step 1: 用最终的组装版本替换 `video/src/BlogIntro.tsx`**

把 Task 4–10 里所有临时的单人预览版换成完整版。`Beat` 组件从 `timings.ts` 取帧区间，所以时间轴只有一处定义。

```tsx
import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {Paper} from './components/Paper';
import {Scene01Title} from './scenes/Scene01Title';
import {Scene02Year} from './scenes/Scene02Year';
import {Scene03Year} from './scenes/Scene03Year';
import {Scene04Year} from './scenes/Scene04Year';
import {Scene05Year} from './scenes/Scene05Year';
import {Scene06Year} from './scenes/Scene06Year';
import {Scene07Timeline} from './scenes/Scene07Timeline';
import {Scene08Terminal} from './scenes/Scene08Terminal';
import {beatById} from './timings';

const Beat: React.FC<{id: string; children: React.ReactNode}> = ({id, children}) => {
  const beat = beatById(id);
  return (
    <Sequence from={beat.from} durationInFrames={beat.durationInFrames} name={beat.name}>
      {children}
    </Sequence>
  );
};

export const BlogIntro: React.FC = () => {
  return (
    <AbsoluteFill>
      <Paper />
      <Beat id="title">
        <Scene01Title />
      </Beat>
      <Beat id="y2022">
        <Scene02Year />
      </Beat>
      <Beat id="y2023">
        <Scene03Year />
      </Beat>
      <Beat id="y2024">
        <Scene04Year />
      </Beat>
      <Beat id="y2025">
        <Scene05Year />
      </Beat>
      <Beat id="y2026">
        <Scene06Year />
      </Beat>
      <Beat id="read">
        <Scene07Timeline />
      </Beat>
      <Beat id="now">
        <Scene08Terminal />
      </Beat>
    </AbsoluteFill>
  );
};
```

宣纸 `<Paper />` 放在所有 `Beat` 之外，作为整片底层，贯穿第 1–7 拍；第 8 拍的终端层不透明地盖在它上面。

- [ ] **Step 2: 类型检查与测试**

```bash
cd video && npm run typecheck && npm test
```

Expected: 类型无错误，测试全绿。

- [ ] **Step 3: 渲染 8 张镜头代表帧**

```bash
cd video \
  && npx remotion still BlogIntro out/beat-1-title.png --frame=120 \
  && npx remotion still BlogIntro out/beat-2-2022.png --frame=360 \
  && npx remotion still BlogIntro out/beat-3-2023.png --frame=520 \
  && npx remotion still BlogIntro out/beat-4-2024.png --frame=810 \
  && npx remotion still BlogIntro out/beat-5-2025.png --frame=1170 \
  && npx remotion still BlogIntro out/beat-6-2026.png --frame=1590 \
  && npx remotion still BlogIntro out/beat-7-read.png --frame=1770 \
  && npx remotion still BlogIntro out/beat-8-now.png --frame=2010
```

- [ ] **Step 4: 逐张看图核验**

Read 这 8 张 PNG，确认每一拍都出现在**正确的时间点**且内容正确。重点：

- 第 1 张是标题（不是年份卡），第 2–6 张依次是 2022 / 2023 / 2024 / 2025 / 2026
- 第 7 张是贯穿线，第 8 张是深色终端
- 每一张的背景都对（1–7 宣纸，8 深色）
- **纸纹强度在这里做方向判断，定案不在这里。** 第 1 张（标题，字最少、留白最大）是基准图。要读作纸，不能读作揉皱的纸、也不能读作云纹。此前只在空留白的预览上看过一次，且看错了文件（见 Task 4 修订块），这是第一次有真实版式可判。
  **但 still 是纸纹的上界**：`remotion still` 直接出 PNG，而成片的每一帧在进 H.264 前先过一遍 JPEG-80，细纹在那一步就被量化掉了 —— still 看着偏重、成片未必偏重。所以：这一步只判断方向（明显偏重 / 明显偏轻 / 可以），**不要据此改参数**；等 Task 12 出片后从成片抽一帧（**Task 12 Step 5**，抽第 1 拍，如 t≈4s），以**那一帧**定案。届时若确偏重，把 `Paper.tsx` 的 `slope` 从 0.85 降到 0.65–0.70 并重算 intercept（降幅不要再大），重渲成片再抽帧。
- **印章落下速度也在这里定案**。Task 5 实测：这套 spring 从 progress 0 到 1 只用 4.4 帧（0.15 秒），第 16 帧已进入过冲，约第 20 帧停稳。它符合 spec「scale 落下 + 2px 回弹」的字面要求（translateY 过冲实测约 3.5px），但在一支别处都用 30 帧淡入的片子里，这 4 帧是「利落的一下」还是「一闪而过的跳」，只能等第 1 拍有真实标题字时对着看。若嫌轻，按 ζ≈0.56 等比降频即可（如 `{damping: 7, mass: 0.7, stiffness: 55}`，落下约 9 帧、过冲比例不变），**不要只调 stiffness 或只调 mass**——那会同时改掉过冲量，spec 的「2px 回弹」就没了。

这一步是在验证 `timings.ts` 与镜头组装的对应关系。如果第 4 张显示的是 2025，说明某个 `Beat` 的 `id` 写错了。

- [ ] **Step 5: 渲染转场处的关键帧**

转场是最容易出问题的地方，单独核。注意这里说的「3→4」是 **spec 分镜表的拍序号**（2023 停笔 → 2024 学），对应的帧是 540，不是 390（390 是 2022→2023）。

```bash
cd video \
  && npx remotion still BlogIntro out/transition-3to4.png --frame=560 \
  && npx remotion still BlogIntro out/transition-7to8.png --frame=1802
```

Read 两张图，确认：

- `transition-3to4.png`（第 560 帧 = 540 之后 20 帧）：年份 `2024` 与动词已**完整进场**（朱红、完全不透明）；**篇名列表此刻仍在淡入中** —— `YearCard` 的列表用错峰 `FadeIn`（`delay` 16），560 帧时它只走到自身的第 4 帧、缓动值约 0.51，属第 4 拍 30 帧入场的正常中途态，**不是缺陷**；画面上**不应残留** 2023 那一拍的「两 篇」或灰色年份
- `transition-7to8.png`（第 1802 帧 = 终端切入后 2 帧）：终端层**正在淡入**，看起来应偏半透明，宣纸还没被完全盖住，朱红线刚从左边框探进来。**这里同样必须挑早年帧**，理由与 Task 10 Step 6 同：`cover` 的 `ease` 前段极陡，切入后 10 帧就已经盖到九成以上，拿第 1810 帧核「正在淡入」只会看到一张全黑的图

- [ ] **Step 6: 提交**

```bash
git add video/src/BlogIntro.tsx
git commit -m "Assemble full video from eight beats

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

## Task 12: 渲染成片

**Files:**
- 产物: `video/out/blog-intro.mp4`（不提交，已在 `.gitignore`）

- [ ] **Step 1: 渲染 mp4**

1080p、2040 帧，本机渲染大约需要几分钟。

```bash
cd video && npm run render
```

Expected: 生成 `video/out/blog-intro.mp4`。

- [ ] **Step 2: 核验时长与体积**

```bash
cd video && ls -lh out/blog-intro.mp4 && ffprobe -v error -show_entries format=duration,size -of default=noprint_wrappers=1 out/blog-intro.mp4
```

Expected:
- `duration` 约 `68.0`（秒）—— **必须落在 67.9–68.1 之间**
- `size` 在 5–30 MB 之间

如果时长不是 68 秒，说明 `DURATION_IN_FRAMES` 或 `timings.ts` 有问题，回到 Task 11 检查。

如果体积超过 30 MB，把 `package.json` 里 `render` 脚本的 `--crf=20` 调到 `--crf=24` 重渲。

没有 `ffprobe` 时用 `ffprobe` 的替代：`npx remotion media-parser out/blog-intro.mp4`，或直接跳过体积检查、只靠 Remotion 渲染日志里报出的帧数确认。

- [ ] **Step 3: 生成封面图**

用于 `static/` 里的 `<video poster>`。

```bash
cd video && npx remotion still BlogIntro out/blog-intro-poster.png --frame=120
```

Expected: 生成标题帧的 PNG。

- [ ] **Step 4: 抽帧复核静音可懂性**

spec 的核心要求是"静音也能看懂"，逐帧看图已经覆盖了这一点，但成片里**每一拍的起始瞬间**最容易被忽略。抽这几帧确认没有空画面：

```bash
cd video \
  && npx remotion still BlogIntro out/onset-1.png --frame=2 \
  && npx remotion still BlogIntro out/onset-2.png --frame=152 \
  && npx remotion still BlogIntro out/onset-8.png --frame=1808
```

Read 三张图：第 2 帧应当已经能看到标题的第一个字开始出现（而不是全空白）；第 152 帧应当能看到 2022 的年份数字开始出现；第 1808 帧（终端切入后 8 帧）应当能看到深色底色**已经铺开相当一部分**。**如果任何一张是全空白或纯宣纸，说明那一拍进场太慢，需要把该镜头首个 `FadeIn` 的 `delay` 调小。**

- [ ] **Step 5: 从成片抽帧，定案纸纹并复核扫描线**

**Task 11 Step 4 把纸纹强度推到了这一步定案** —— 上面 Step 3/4 用的都是 `remotion still`，直接出 PNG、不过 JPEG 中间帧，是纸纹的**上界**；只有从这里抽出来的帧才是观众真正看到的东西。

```bash
cd video \
  && DYLD_LIBRARY_PATH=node_modules/@remotion/compositor-darwin-arm64 \
     node_modules/@remotion/compositor-darwin-arm64/ffmpeg \
     -ss 4 -i out/blog-intro.mp4 -frames:v 1 -y out/mp4-frame-title.png \
  && DYLD_LIBRARY_PATH=node_modules/@remotion/compositor-darwin-arm64 \
     node_modules/@remotion/compositor-darwin-arm64/ffmpeg \
     -ss 62 -i out/blog-intro.mp4 -frames:v 1 -y out/mp4-frame-terminal.png
```

（这台机器的 Homebrew `ffmpeg` 起不来，`DYLD_LIBRARY_PATH` 指向 Remotion 自带的那份是必需的，不是可选的。）

Read 两张图：

- **`mp4-frame-title.png`（t=4s，第 1 拍）判纸纹。** 要读作纸，不能读作揉皱的纸、也不能读作云纹。这里判**重**才算数：still 只会比它更重，这里若已经偏轻，说明纹理被中间态吃掉了，该去查 `Paper.tsx` 的 `baseFrequency` 而不是降 `slope`。若确偏重，把 `slope` 从 0.85 降到 0.65–0.70 并按文件里的说明重算 `intercept`（降幅不要再大），重渲成片再抽一次。
- **`mp4-frame-terminal.png`（t=62s，第 8 拍）复核扫描线。** 那层是 1px 亮 / 2px 透、仅 2% 白的高频图案，正是 JPEG-80 那一步最容易整个吃掉的东西，而它在 still 里看得见（`remotion still` 实测背景列在 `13,13,17 / 13,13,18` 之间循环）。**吃到零就吃到零** —— 它是装饰，不是承重结构，没了不改任何参数，只在这里记一笔结果。真正要确认的是这一帧除了少一层纹理之外一切正常：底色近黑、内容在正常打字中。**注意 t=62s 是第 1860 帧、第 8 拍从 1800 起，此时才走到这一层自己的第 60 帧** —— `TerminalCard` 里 `36` 的 `startFrame` 是 88（≈62.9s）、右下角网址的 `FadeIn delay` 是 130（≈64.3s），**两者此刻都还没到**，画面是已打完的 `❯ whoami`、`zhongling@zhixia`，加上**还在打字中途**的第三行（`posts --since 2022 --count` 那句的 `startFrame` 是 46，此刻才走了十几帧，远没打完）和一个光标。**这不是缺陷**；要核「四行齐全 + 右下角网址」得抽 t=66s 或更晚的帧（settled 态）。

  **它若存活，还要看缩小显示时会不会摩尔纹。** 周期只有 3px，一缩就容易落到 1px 附近、拍出粗横条。**先核实际显示宽度**：Task 13 给 `<video>` 的内联样式是 `max-width:720px`，所以 CSS 宽度上限是 720px（不是这里原先写的 800–900px）；而浏览器按**设备像素**缩放，Retina（DPR 2）上 720 CSS px = 1440 设备像素（比例 0.75），非 Retina（DPR 1）才是 720 像素（比例 0.375）。判法：把抽出的这一帧缩到**这些实际比例**上看一眼，并且**必须写明用的哪种重采样** —— 这一条会给出相反的结论：点采样（`flags=neighbor`）在 0.42–0.44 倍一带会拍出肉眼可见的粗横带，浏览器实际用的平滑缩放（bilinear 及以上）不会。别只测一档、也别不说重采样器就下结论。

  **已测（2026-10-07），结论：保留 `SCANLINES`，不重渲。** 按 720 / 1080 / 1440 三档实际比例 × 平滑与点采样各跑一遍：**平滑缩放（浏览器对 `<video>` 的现实路径，GPU bilinear 及以上）三档全部没有粗横带**；只有点采样（`flags=neighbor`）在 720px（DPR 1）那一档会混叠出粗带。机理可复算：3px 图案缩 s 倍后基频是 1/(3s) c/px，超过 Nyquist 的 0.5 才混叠，即 **s < 2/3 才有危险** —— 于是危险档是**非 Retina 的 720 CSS px**（s=0.375，混叠到约 9px 周期），而 Retina 的 1440（s=0.75）压根不混叠。**原先「缩到 800–900px 会拍出粗横条」的担心点位写错了**（0.42×1920=806 不对应任何真实档位），而且方向也反了：风险来自非 Retina。Task 13 Step 5 起服务时，**非 Retina 窗口 + 720px 宽**是唯一的高危组合，值得多看那一眼。

- [ ] **Step 6: 提交渲染配置的改动（如有）**

只有在 Step 2 调整过 `--crf` 时才需要提交：

```bash
git add video/package.json
git commit -m "Lower render quality to reduce output size

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

## Task 13: 嵌入博客首页

**Files:**
- Create: `layouts/partials/home_info.html`
- Create: `static/blog-intro.mp4`
- Create: `static/blog-intro-poster.png`

首页当前由主题的 `_default/list.html` 渲染，其中的 `home_info.html` partial 负责首页那块介绍区。仓库里已经有 `layouts/partials/head.html` 和 `extend_footer.html` 的覆盖先例，所以这里同样用根目录覆盖，**不需要改 theme submodule**。

- [ ] **Step 1: 复制 mp4 与封面到 static/**

```bash
cd /Users/zhongling/mypro/tomorrowthief.github.io \
  && cp video/out/blog-intro.mp4 static/blog-intro.mp4 \
  && cp video/out/blog-intro-poster.png static/blog-intro-poster.png \
  && ls -lh static/blog-intro.mp4 static/blog-intro-poster.png
```

Expected: 两个文件都在 `static/` 下，mp4 体积与 Task 12 核验的一致。

- [ ] **Step 2: 建 `layouts/partials/home_info.html`**

以主题版本为基础，在 `entry-content` 里加一个 `<video>`。样式用内联，避免改动 submodule 里的 CSS 文件。

```html
{{- with site.Params.homeInfoParams }}
<article class="first-entry home-info">
    <header class="entry-header">
        <h1>{{ .Title | markdownify }}</h1>
    </header>
    <section class="entry-content">
        <p>{{ .Content | markdownify }}</p>
        <video
            controls
            preload="metadata"
            playsinline
            poster="{{ "blog-intro-poster.png" | absURL }}"
            style="width:100%;max-width:720px;margin-top:1rem;border-radius:8px;display:block"
        >
            <source src="{{ "blog-intro.mp4" | absURL }}" type="video/mp4" />
            你的浏览器不支持 video 标签，可以<a href="{{ "blog-intro.mp4" | absURL }}">直接下载观看</a>。
        </video>
    </section>
    <footer class="entry-footer">
        {{ partial "social_icons.html" site.Params.socialIcons }}
    </footer>
</article>
{{- end -}}
```

- [ ] **Step 3: 构建并确认视频进了首页**

```bash
cd /Users/zhongling/mypro/tomorrowthief.github.io \
  && hugo --minify --cleanDestinationDir \
  && grep -c 'blog-intro.mp4' docs/index.html
```

Expected: `grep` 输出至少 `1`。

如果输出 `0`，说明根目录的 `home_info.html` 没被采用 —— 检查文件路径确实是 `layouts/partials/home_info.html`，并确认 `hugo --printPathWarnings` 没有相关告警。

- [ ] **Step 4: 跑仓库自带的 SEO 检查**

```bash
cd /Users/zhongling/mypro/tomorrowthief.github.io \
  && python3 scripts/check_seo.py docs \
  && git diff --check
```

Expected: 两项都无报错输出。

- [ ] **Step 5: 本地起服务实际看一眼**

```bash
cd /Users/zhongling/mypro/tomorrowthief.github.io && hugo server
```

打开 `http://localhost:1313/`，确认：

- 首页介绍区下方出现视频，带封面图（标题帧），不自播放
- 点播放能正常播放，画面与渲染出的 mp4 一致
- 窗口拉窄到手机宽度时视频随之缩放，**不撑破容器**

- [ ] **Step 6: 提交**

```bash
cd /Users/zhongling/mypro/tomorrowthief.github.io \
  && git add layouts/partials/home_info.html static/blog-intro.mp4 static/blog-intro-poster.png \
  && git commit -m "Embed intro video on the home page

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

- [ ] **Step 7: 部署**

按 `AGENTS.md` 的发布流程走 GitHub REST API（不能用普通 `git push`）。推送前先 `GET /git/ref/heads/main` 确认远程没有领先，推送后通过 `GET /commits/{sha}/check-runs` 确认部署结果，并检查 `/llms.txt`、`/robots.txt`、`/sitemap.xml` 三个路径仍可访问。

**部署需要用户明确授权，不要自行推送。**

---

## 完成标准

- [ ] `cd video && npm test` 全绿
- [ ] `cd video && npm run typecheck` 无错误
- [ ] `video/out/blog-intro.mp4` 时长 68 秒，8 拍内容与 spec 分镜表逐项一致
- [ ] 静音播放能完整理解内容（无旁白依赖）
- [ ] 首页出现视频，移动端宽度下不撑破布局
- [ ] `python3 scripts/check_seo.py docs` 通过