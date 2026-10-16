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
  /**
   * subdued 变体在篇名位置显示的短语。手写而非 toZhNumeral(count)：
   * 2 在量词前是不规则读音「两」，toZhNumeral(2) 得到的是「二」，
   * 派生渲染会印成「二篇」。改动这里时别顺手改成派生。
   */
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

/** 36 -> 三十六。接受 0-99 的整数（0 -> 〇），超出范围或非整数会抛错；本项目用不到更大的数。 */
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