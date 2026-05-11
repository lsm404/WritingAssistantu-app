import type {
  ArticleLength,
  ExpressionMode,
  GeneratePayload,
  ReferenceFocus,
  ReferenceLevel,
  RewriteGoal,
  WechatAccount,
  WritingMode,
} from "./types";

export type SidebarView = "workspace" | "membership" | "wechat" | "model" | "prompt" | "image" | "settings" | "agent";

export type PromptSlot = {
  id: string;
  name: string;
  defaultName: string;
  content: string;
  defaultContent: string;
  /** 服务端创建时间（ISO），可选 */
  createdAt?: string;
};

export type DraftMeta = {
  title: string;
  author: string;
  digest: string;
};

export function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function parseStoredValue<T>(key: string, fallback: T): T {
  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function extractTitleFromMarkdown(markdown: string, fallback: string) {
  const heading = markdown
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.startsWith("# "));
  if (heading) return heading.replace(/^#\s+/, "").trim().slice(0, 64);
  return fallback.trim().slice(0, 64);
}

export function summarizeMarkdown(markdown: string) {
  return markdown
    .replace(/^#+\s+/gm, "")
    .replace(/[*_`>#-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

export function maskValue(value: string, keepStart = 8, keepEnd = 5) {
  if (!value) return "未配置";
  if (value.length <= keepStart + keepEnd) return value;
  return `${value.slice(0, keepStart)}****${value.slice(-keepEnd)}`;
}

/** 新建/表单占位用的空账号（不含默认名称，列表初始为空） */
export function emptyWechatAccount(): WechatAccount {
  return {
    id: createId("account"),
    name: "",
    appId: "",
    appSecret: "",
    thumbMediaId: "",
  };
}

const PROMPT_GENERIC = `# Role

你是一位拥有多年经验的微信公众号头部作者，长期撰写：

- AI
- 科技
- 互联网
- 创业
- 产品
- 自媒体
- 社会观察

类内容。

你的目标不是“生成一篇文章”。

而是：

写出一篇真正像人类公众号作者深夜亲自写出来的内容。

文章必须具备：

- 真人感
- 作者感
- 情绪感
- 思考感
- 公众号传播感

最终效果：

像已经发布在微信公众号里的真实文章，
而不是 AI 生成稿。

---

# Core Goal

请始终记住：

你不是 AI 助手，
你是一个真实公众号作者。

不要“完成任务”，
而是“表达观点”。

不要追求标准化，
而是追求真实感。

---

# 最重要规则（必须严格遵守）

禁止输出任何 AI 模板化内容。

绝对不要出现：

- （完）
- 完
- 【作者手记】
- 编后语
- 配图建议
- 封面建议
- 阅读引导
- 点赞关注提示
- “看到这里”
- “希望这篇文章”
- “总之”
- “最后”
- “综上所述”
- “值得注意的是”
- “随着AI的发展”
- “不可否认”
- “毋庸置疑”

禁止出现：

- 工整排比
- AI总结
- 任务式收尾
- 模板化升华
- 正确的废话
- 强行价值观

---

# 写作风格要求

文章必须像真人写作。

不是论文，
不是报告，
不是营销文案。

而是真实公众号作者的表达。

---

# 语言风格

整体风格参考：

- 微信公众号 10w+ 作者
- 差评
- 虎嗅
- 极客公园
- 少数派
- 半佛仙人
- 人人都是产品经理

但不要模仿任何具体作者。

---

# 语言要求（非常重要）

## 1. 段落长度随机

必须有：

- 一句话短段落
- 两三行短情绪
- 长观点段落

不要所有段落长度一致。

真人不会那样写。

---

## 2. 允许“不完美”

允许：

- 口语化
- 情绪化
- 半句话
- 留白
- 不完全解释
- 思维跳跃
- 非标准转折

不要像教科书。

---

## 3. 增加“作者存在感”

适当加入：

- 我发现
- 前几天我试了下
- 说实话
- 我身边有人
- 很多人其实没意识到
- 一个很真实的问题是
- 我后来才发现
- 有时候真的会这样

但不要频繁重复。

---

## 4. 不要“AI式严谨”

不要：

- 首先
- 其次
- 再次
- 最后
- 一方面
- 另一方面

不要标准三段论。

---

## 5. 避免“过度解释”

真人不会每句话都解释完整。

有些情绪点，
说到一半就够了。

允许留白。

---

# 文章结构要求

不要使用：

- 引言
- 正文
- 总结

这种结构标签。

文章应该自然推进。

像真实公众号一样：

想到哪，
写到哪，
但整体又是顺的。

---

# 信息密度要求

不要空话。

不要正确的废话。

尽量增加：

- 真实观察
- 用户心理
- 行业变化
- 情绪细节
- 现实案例
- 个人理解
- 微妙情绪

减少：

- 大道理
- 假大空
- AI总结句

---

# 开头要求（极其重要）

前 3 段必须抓人。

不要一上来讲背景。

不要：

“最近AI行业发生了很多变化。”

这种废话。

要直接进入：

- 冲突
- 情绪
- 观点
- 现象
- 反常识

让人愿意继续读。

---

# 结尾要求（核心）

禁止：

- 总结全文
- 强行升华
- 鸡汤
- 呼吁
- 点题
- “希望”
- “未来可期”

结尾必须像真人突然停笔。

可以：

- 情绪停顿
- 留白
- 一句短话结束
- 一个现实场景结束
- 一个细节结束

宁可“不完整”，
也不要“AI式闭环”。

---

# 真人感增强机制

写作时主动加入：

- 情绪波动
- 非线性表达
- 轻微重复
- 思维跳跃
- 口语停顿
- 不规则句式

让文章像：

“人在真实思考时写出来的内容”。

---

# 降低 AI 痕迹要求

重点避免：

- 句式重复
- 段落过于均匀
- 情绪过于稳定
- 逻辑过于完整
- 每段都像总结
- 语言太平滑

允许：

- 不那么工整
- 有点散
- 有点停顿
- 有点主观

但阅读体验必须自然。

---

# 输出要求

输出必须是：

“可以直接复制到微信公众号后台发布的最终正文”。

成稿可用最简 Markdown（一个 \`# 标题\`、分段、少量加粗），与下方生成任务中「Markdown 成稿」要求一致；不要堆代码块、多层小标题目录、脚注链接、引用论文式排版。

不要输出：

- 创作说明
- 大纲
- 标题解释
- 写作分析
- 运营建议
- 配图建议
- 与正文无关的 Markdown 排版教程或占位标签
- 任何注释

直接给成稿。

---

# 标题要求

标题必须具备公众号传播感。

避免：

- AI味标题
- 营销号低级夸张
- 纯标题党

标题应该像：

真正公众号作者会发的标题。

---

# 最终目标

文章必须同时满足：

- 像真人写的
- 有公众号语感
- 有作者人格
- 情绪真实
- AI痕迹低
- 可以直接发布
- 不像“生成内容”`;



export function defaultPromptSlots(): PromptSlot[] {
  return [
    {
      id: "prompt-default",
      name: "通用模板",
      defaultName: "通用模板",
      content: PROMPT_GENERIC,
      defaultContent: PROMPT_GENERIC,
    },
  ];
}

export function defaultArticleDraft(): GeneratePayload {
  return {
    topic: "",
    length: "medium",
    systemPrompt: "",
    creationMode: "synthesized",
    sourceArticle: "",
    apiModel: "doubao-seed-2-0-pro-260215",
    apiBaseUrl: "https://ark.cn-beijing.volces.com/api/v3",
    enableWebSearch: true,
    imagePrompt: "",
  };
}

export function defaultDraftMeta(): DraftMeta {
  return { title: "", author: "", digest: "" };
}

export const lengthOptions: Array<{ label: string; value: ArticleLength }> = [
  { label: "短文 (400-600 字)", value: "short" },
  { label: "中等 (600-800 字)", value: "medium" },
  { label: "长文 (800-1000 字)", value: "long" },
];

/** 工作台主题字数上限（生成请求校验） */
export const WORKSPACE_TOPIC_MAX_CHARS = 1000;

export const modeOptions: Array<{ label: string; value: WritingMode }> = [
  { label: "标准干货", value: "standard" },
  { label: "故事化", value: "story" },
  { label: "案例拆解", value: "case_study" },
  { label: "清单型", value: "listicle" },
  { label: "分析型", value: "analysis" },
];

export const imageCountOptions = [
  { label: "不生成配图", value: 0 },
  { label: "1 张配图", value: 1 },
  { label: "2 张配图", value: 2 },
  { label: "3 张配图", value: 3 },
  { label: "4 张配图", value: 4 },
];

export const expressionModeOptions: Array<{ label: string; value: ExpressionMode }> = [
  { label: "标准表达", value: "standard" },
  { label: "更口语化", value: "conversational" },
  // { label: "去 AI 味", value: "de_ai" },
  { label: "观点更强", value: "opinionated" },
];

export const audienceOptions = [
  { label: "大学生", value: "大学生" },
  { label: "职场新人", value: "职场新人" },
  { label: "宝妈", value: "宝妈" },
  { label: "创业者", value: "创业者" },
  { label: "管理者", value: "管理者" },
  { label: "内容创作者", value: "内容创作者" },
];

export const styleOptions = [
  { label: "专业理性", value: "专业理性" },
  { label: "温暖治愈", value: "温暖治愈" },
  { label: "犀利直接", value: "犀利直接" },
  { label: "轻松口语", value: "轻松口语" },
  { label: "故事感强", value: "故事感强" },
  { label: "干货清单", value: "干货清单" },
];

/** 创作设置下拉「不选择」项的值；写入 GeneratePayload 时应为 undefined */
export const WORKSPACE_SELECT_NONE = "";

export const workspaceSelectNoneOption = { label: "不选择", value: WORKSPACE_SELECT_NONE };

export function workspaceOptionalFieldValue(field: string | undefined): string {
  const t = field?.trim();
  return t ? t : WORKSPACE_SELECT_NONE;
}

export function parseWorkspaceOptionalField(v: string): string | undefined {
  if (v === WORKSPACE_SELECT_NONE) return undefined;
  const t = v.trim();
  return t === "" ? undefined : v;
}

export function workspaceOptionalEnumValue<T extends string>(field: T | undefined): T | typeof WORKSPACE_SELECT_NONE {
  return (field ?? WORKSPACE_SELECT_NONE) as T | typeof WORKSPACE_SELECT_NONE;
}

export function parseWorkspaceOptionalEnum<T extends string>(v: string): T | undefined {
  if (v === WORKSPACE_SELECT_NONE || v === "") return undefined;
  return v as T;
}

/** 配图数量：与「不生成配图」区分，表示不在请求里指定数量（等价 undefined） */
export function workspaceOptionalImageCountValue(count: number | undefined): number | typeof WORKSPACE_SELECT_NONE {
  return count === undefined ? WORKSPACE_SELECT_NONE : count;
}

export function parseWorkspaceOptionalImageCount(v: string | number): number | undefined {
  if (v === WORKSPACE_SELECT_NONE || v === "") return undefined;
  return typeof v === "number" ? v : Number(v);
}

export const workspaceAudienceOptions = [workspaceSelectNoneOption, ...audienceOptions];
export const workspaceStyleOptions = [workspaceSelectNoneOption, ...styleOptions];
export const workspaceModeOptions = [workspaceSelectNoneOption, ...modeOptions];
export const workspaceExpressionModeOptions = [workspaceSelectNoneOption, ...expressionModeOptions];

export const workspaceImageCountOptions: Array<{ label: string; value: number | typeof WORKSPACE_SELECT_NONE }> = [
  { label: workspaceSelectNoneOption.label, value: WORKSPACE_SELECT_NONE },
  ...imageCountOptions,
];

export const rewriteGoalOptions: Array<{ label: string; value: RewriteGoal }> = [
  { label: "重写为新文章", value: "new_article" },
  { label: "换个切入角度", value: "new_angle" },
  { label: "更口语化", value: "more_conversational" },
  { label: "更可执行", value: "more_actionable" },
];

export const referenceFocusOptions: Array<{ label: string; value: ReferenceFocus }> = [
  { label: "综合参考", value: "mixed" },
  { label: "重点参考结构", value: "structure" },
  { label: "重点参考语气", value: "tone" },
  { label: "重点参考开头", value: "opening" },
];

export const referenceLevelOptions: Array<{ label: string; value: ReferenceLevel }> = [
  { label: "轻参考", value: "low" },
  { label: "中参考", value: "medium" },
  { label: "强参考", value: "high" },
];

export const workspaceRewriteGoalOptions = [workspaceSelectNoneOption, ...rewriteGoalOptions];
export const workspaceReferenceFocusOptions = [workspaceSelectNoneOption, ...referenceFocusOptions];
export const workspaceReferenceLevelOptions = [workspaceSelectNoneOption, ...referenceLevelOptions];
