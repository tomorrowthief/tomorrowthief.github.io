import fs from 'node:fs';
import path from 'node:path';
import {describe, expect, it} from 'vitest';
import {type PostRef, journalPosts, toZhNumeral, totalPosts, yearEntry, years} from './posts';

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

// 判定草稿。Hugo v0.148.2 的 `hugo list drafts` 把下列写法都当草稿（已在临时站点上逐条核对）：
//   draft: true / True / TRUE / yes / on / "true" / `true # 注释`
// 而 draft: false / no / off / 缺省，以及被注释掉的 `# draft: true` 都不算。
// 对应 YAML 1.1 的布尔集合 + 引号 + 行尾注释，所以不区分大小写、允许引号与注释。
const DRAFT_RE = /^[ \t]*draft\s*:\s*["']?(true|yes|on)["']?\s*(#.*)?$/im;

const isDraft = (file: string): boolean =>
  DRAFT_RE.test(fs.readFileSync(path.join(postsDir, file), 'utf8'));

// 「Hugo 会发布」的近似集合：只排除草稿。未来日期（publishDate）与过期（expiryDate）
// 目前没有任何文章命中，未做模拟；一旦出现，count 类断言的口径会与 `hugo list published` 分叉。
const publishedLike = sourceFiles.filter((f) => !isDraft(f));

// yearOfFile 用 frontmatter 的 date 年份代替 Hugo 的发布归属。
const yearOfFile = (file: string): number | null => {
  const raw = fs.readFileSync(path.join(postsDir, file), 'utf8');
  const m = raw.match(/^date:\s*['"]?(20\d{2})/m);
  return m ? Number(m[1]) : null;
};

// 文件名 -> 年份，模块加载时只解析一次，避免每个年份都重读全部源文件。
const postYears = new Map(sourceFiles.map((f) => [f, yearOfFile(f)] as const));

// 只数已发布（近似）的文章。草稿会让口径与 `hugo list published` 分叉，
// 那种情况由「口径前提：content/posts 里没有草稿」单独报警，这里不再重复报错。
const countInYear = (year: number): number =>
  publishedLike.filter((f) => postYears.get(f) === year).length;

describe('data/posts', () => {
  it('画面上出现的每一篇都有对应的源文件', () => {
    const refs = [...years.flatMap((y) => y.posts), ...journalPosts];
    expect(refs.length).toBeGreaterThan(0);
    for (const ref of refs) {
      expect(sourceFiles, `面板上显示了「${ref.label}」，但 content/posts/${ref.file} 不存在`).toContain(ref.file);
    }
  });

  it('口径前提：content/posts 里没有草稿', () => {
    // hugo list published 不计草稿，而 count 类断言按 frontmatter date 计数，两者口径会分叉。
    // 所以这里让「有草稿」成为唯一的报警：count 类断言已经改用 publishedLike，
    // 不会再喊你把 count / totalPosts 改成 Hugo 不会发布的那个数字。
    const drafted = sourceFiles.filter(isDraft);
    expect(
      drafted,
      `content/posts 里出现了草稿：${drafted.join(', ')}。hugo list published 不计草稿，但 count 类断言按 date 计数，两者口径已分叉 —— 请改用 hugo list published，或删掉这些草稿`,
    ).toEqual([]);
  });

  it('各年 count 与 content/posts 里的实际篇数一致', () => {
    for (const entry of years) {
      const actual = countInYear(entry.year);
      expect(
        actual,
        `${entry.year} 年实际有 ${actual} 篇，但 data/posts.ts 写的是 ${entry.count} 篇 —— 请更新 video/src/data/posts.ts`,
      ).toBe(entry.count);
    }
  });

  it('totalPosts 等于各年 count 之和', () => {
    const sum = years.reduce((acc, y) => acc + y.count, 0);
    expect(
      totalPosts,
      `data/posts.ts 里 totalPosts 是 ${totalPosts}，但各年 count 之和是 ${sum} —— 请更新 video/src/data/posts.ts：把 totalPosts 改成 ${sum}，或修正那一年的 count`,
    ).toBe(sum);
  });

  it('totalPosts 等于已发布篇数', () => {
    // 基准是「已发布（近似）」篇数，不是 sourceFiles.length：草稿由上面的 guard 单独报警，
    // 这里不该再喊一个 Hugo 不会发布的数字。
    expect(
      totalPosts,
      `content/posts 里现在有 ${publishedLike.length} 篇已发布文章，但 data/posts.ts 里 totalPosts 是 ${totalPosts} —— 请更新 video/src/data/posts.ts：totalPosts 改为 ${publishedLike.length}，并把新增文章那一年的 count 加 1`,
    ).toBe(publishedLike.length);
  });

  it('年份按时间升序排列', () => {
    const list = years.map((y) => y.year);
    expect(list).toEqual([...list].sort((a, b) => a - b));
  });

  it('yearEntry 找不到年份时报错', () => {
    expect(() => yearEntry(1999)).toThrow(/1999/);
  });

  it('每个数组内部的 label / file 不重复', () => {
    // 只查数组内部：同一篇札记允许既出现在某年的卡片里、又出现在下面的书单里，
    // 跨数组重名/重文件是版式允许的。数组内部重复则一定是复制粘贴笔误 ——
    // 它会把同一篇文章在同一处印两遍。
    const arrays: {name: string; refs: PostRef[]}[] = [
      ...years.map((y) => ({name: `${y.year} 年卡片`, refs: y.posts})),
      {name: 'journalPosts', refs: journalPosts},
    ];
    for (const {name, refs} of arrays) {
      for (const key of ['label', 'file'] as const) {
        const vals = refs.map((r) => r[key]);
        const dupes = [...new Set(vals.filter((v, i) => vals.indexOf(v) !== i))];
        expect(dupes, `${name} 的数组里 ${key} 重复：${dupes.join(', ')}`).toEqual([]);
      }
    }
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

  it('视频实际打印的数字', () => {
    // 两个数字都来自 data/posts.ts：开场卡印 totalPosts（「四年半 · 三十六篇」），
    // 2026 年卡片旁边印那一年的 count = 12。
    expect(toZhNumeral(36)).toBe('三十六');
    expect(toZhNumeral(12)).toBe('十二');
  });

  it('个位数全部落在单字集合内', () => {
    for (const n of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]) {
      expect(toZhNumeral(n)).toMatch(/^[〇一二三四五六七八九]$/);
    }
  });

  it('边界值', () => {
    expect(toZhNumeral(0)).toBe('〇');
    expect(toZhNumeral(9)).toBe('九');
    expect(toZhNumeral(10)).toBe('十'); // n < 20 分支的空后缀
    expect(toZhNumeral(19)).toBe('十九');
    expect(toZhNumeral(20)).toBe('二十');
    expect(toZhNumeral(21)).toBe('二十一');
    expect(toZhNumeral(99)).toBe('九十九');
  });

  it('超出 0-99 的整数时报错', () => {
    expect(() => toZhNumeral(100)).toThrow(/0-99/);
    expect(() => toZhNumeral(-1)).toThrow(/0-99/);
    expect(() => toZhNumeral(1.5)).toThrow(/0-99/);
  });
});