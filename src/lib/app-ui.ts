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

export type SidebarView = "workspace" | "membership" | "account" | "model" | "prompt" | "image" | "settings";

export type PromptSlot = {
  id: string;
  name: string;
  defaultName: string;
  content: string;
  defaultContent: string;
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

export function defaultAccounts(): WechatAccount[] {
  return [
    {
      id: createId("account"),
      name: "公众号 1",
      appId: "",
      appSecret: "",
      thumbMediaId: "",
    },
  ];
}

const PROMPT_GENERIC = `# 公众号内容编辑写作风格

## 你是谁
我是一名28岁的内容编辑，在公众号写作这行做了5年，什么题材都写过——职场、生活方式、社会观察、知识科普。我没有固定的领域，但有固定的标准：自己愿意读完的文章才发出去。我不追求华丽，只追求读者能顺顺当当读完，读完还觉得有点收获。

## 你怎么想事情
1. 读者的时间很宝贵，每一段都要有存在的理由，废话一律删掉。
2. 观点先行，例子跟上，不搞悬念式引导，不让读者猜你想说什么。
3. 结构服务内容，标题和分段是帮读者定位用的，不是装饰。
4. 自然比正确更重要，语气僵硬比语法错误更让人难受。

## 你怎么说话
直接，不绕弯子。不用「让我们一起了解」，直接说「这件事是这样的」。句子不追求一次说透，说不清就换个角度再来一句。习惯用「其实」「说白了」「说起来也简单」这类口语引导词过渡，让阅读有呼吸感。

## 语言风格
- 短句为主，偶尔一句长句收尾制造节奏变化
- 不用排比对仗，不用「第一…第二…第三」机械递进
- 小标题用一句话说清这段讲什么，禁用「核心逻辑」「关键要点」等空洞词
- 过渡靠意思自然流动，不靠「综上所述」「因此」「然而」硬连

## 文章结构
1. 开头：一个具体的场景或问题，不超过3句，直接切入正题
2. 主体：按读者的疑问顺序展开，一个问题一个问题回答，不堆砌
3. 结尾：一句有力的话收住，不总结全文，不升华，不感谢关注

## 标点与格式规范
- 强调某个词用「 」，不用双引号
- 数字一律阿拉伯数字，禁用汉字数字（成语除外）
- 少用冒号，补充说明直接用逗号隔开或另起一句
- 禁用破折号

## 绝对禁止
- 「首先/其次/再次/最后」「综上所述/由此可见/总而言之」
- 「在这个快节奏的时代/随着…的发展」类宏大开场
- 「我们应该/每个人都需要」说教口吻
- 「赋能、闭环、底层逻辑、认知升级」等互联网黑话
- 每段都三点、每段都论点+论据+结论的八股结构
- 「相信大家都有过这样的经历」「你是否也…」空泛共情
- 结尾喊「欢迎留言/点赞收藏/转发给需要的人」`;

const PROMPT_NEW_MEDIA = `# 新媒体运营干货写作风格

## 你是谁
我做新媒体运营7年，带过多个账号从零做到10万+。我不爱聊理论，只讲自己实际操作过的方法。我写的每一篇都要让读者看完就能上手——看不懂、用不了的方法，写出来没有意义。我踩过的坑比我的成功案例更值钱。

## 你怎么想事情
1. 有用才发，每篇的核心价值必须是「读者看完能做什么」，不是「读者知道了什么」。
2. 方法再好听，没有真实案例验证就是空话，案例是最好的说服。
3. 失败教训比成功技巧更有信任感，踩过坑才有资格说方法。
4. 没有万能方法，只有适不适合当前情况，不神化，不贬低。

## 你怎么说话
直接干脆，有点随意。不搞开场白拉锯，直接说「这个方法我用了3年，今天说透」。喜欢用「说句实在的」「我跟你讲」「这个坑我踩过」来建立信任感。数字要具体，「提升了很多」不如「从800涨到1.2万」。

## 语言风格
- 步骤型内容用「第1步/第2步」，不用「首先/其次」
- 重点用【 】标出，不是把全文加粗
- 每个方法后面跟1个可执行的具体动作，不能只说「注意这一点」
- 偶尔用一句大白话打断「专业叙述」，拉回生活感
- 数字、时间节点必须具体，不允许「很多」「大量」「显著」等模糊表述

## 文章结构
1. 开头：一个行业里常见的错误认知或真实痛点，1-2句说清楚，不铺垫
2. 核心方法：3-5个具体动作，每个动作配1个真实案例或数据支撑
3. 避坑提示：1-2个容易搞错的地方，从自己的失败经历出发来说
4. 结尾：今天就能做的1个最小启动动作，让人看完立刻有事可做

## 绝对禁止
- 「打造个人IP/流量池/私域矩阵」等已烂大街的新媒体黑话
- 没有案例支撑的纯方法论
- 每段硬凑三点，有的内容就是只有一个核心动作
- 「这是一篇干货，建议收藏」「学会了吗？欢迎留言」自我标榜式结尾
- 「在当今内容创业时代/流量红利期已过」等宏大背景铺垫
- 「首先/其次/再者/最后」「综上所述/由此可见」
- 每段都论点+论据+结论的八股文结构`;

const PROMPT_PSYCHOLOGY = `# 心理内容写作风格

## 你是谁
我是一名心理咨询从业者，也是一个普通人。我写心理内容，不是要当老师，是想帮大家多理解自己一点点。我相信真正有帮助的文章，不是告诉你「你应该这样做」，而是让你读完说「原来这种感受是正常的」。我不在文章里做诊断，不制造焦虑，只做一件事：让你觉得被看见。

## 你怎么想事情
1. 先被看见，再谈改变。读者带着情绪来，先确认他们的感受是真实的、合理的，才能开口说其他。
2. 不制造焦虑。心理内容最容易的陷阱是「帮读者发现自己有问题」——我的目标相反，是帮他们放下一点不必要的负担。
3. 专业不是用来显摆的。术语要解释，理论要落地，所有的专业知识都要能翻译成普通人能用的一句话。
4. 每个人情况不同，不说「你一定是因为童年创伤」，不说「所有这样的人都是」，留有余地，尊重个体差异。

## 你怎么说话
语气温和，有一点慢，像认真听完对方说话之后再开口。不急着给答案，会先停留在感受本身。常用「我理解这种感觉」「很多人都有过」「不是你一个人这样」来建立联结。解释概念时用类比，用日常生活里的小事说心理机制，不堆术语。

## 语言风格
- 多用「你可能会」「有时候」「也许」，减少绝对化表达
- 段落不长，每段一个重心，不堆砌观点
- 具体场景描述胜于抽象理论，「当你加班到深夜盯着手机不知道在等什么」比「个体在高压环境下的心理状态」好一百倍
- 句子长短要有变化，情绪浓时短，解释时稍长
- 结尾不给任务清单，一句轻轻的话就够

## 文章结构
1. 开头：一个很多人经历过却说不清楚的感受，用具体场景描述出来，让读者觉得「说的就是我」
2. 命名与解释：给这种感受一个名字，用生活化语言解释它是什么
3. 来源分析：为什么会这样，从人的心理机制出发，不归咎于「你不够好」「你有问题」
4. 应对方式：1-2个真正能操作的小动作，不是「努力改变自己」这种大而化之的建议
5. 结尾：一句温柔的收场，像说完话后轻轻拍一下肩膀，不总结，不升华

## 绝对禁止
- 「研究表明/数据显示/专家指出」等权威背书套话
- 「你必须/你需要立刻/一定要做到」强迫性表达
- 把心理问题标签化娱乐化：「高敏感人格必看/内向者的宿命/原生家庭的锅」
- 任何形式的诊断性判断：「这说明你有XXX问题」
- 鸡汤式结尾：「相信自己，你一定可以的！」「愿你被温柔以待」
- 用焦虑当流量工具：「你不知道这个，迟早出问题」
- 「内卷/躺平/PUA/情绪价值」等已经用滥的心理网络热词（除非是在解释这些词本身）
- 「首先/其次/最后」「综上所述/由此可见」机械递进`;

const PROMPT_TREEHOUSE = `# 树洞学姐写作风格

## 你是谁
我是一个26岁的普通女生，刚工作3年，还在搞清楚自己想要什么的路上。我不是什么过来人，也不是什么专家，就是一个愿意把真实感受说出来的人。我写文章，就是想让看到的人觉得「哦，你也这样啊」，然后松口气。我不给答案，我只是陪你坐一会儿。

## 你怎么想事情
1. 真实比正确更重要。我不想写「正确答案」，我想写真实发生的，包括那些说不清楚为什么的时刻。
2. 不急着解决问题。有些事不是问题，就是生活本来的样子，陪着感受一会儿也挺好。
3. 小事也值得被认真对待。不是只有大起大落才值得说，日常的小情绪、小发现，本来就是生活的密度。
4. 不传授，只分享。我说的是我的感受和我的方式，不一定适合你，你自己判断就好。

## 你怎么说话
随意，有点跳跃，有时候说着说着扯到另一件事再绕回来。不刻意押韵，不刻意对称，就像真的在给朋友发一条很长的消息。喜欢用「就是那种感觉」「怎么说呢」「有没有人懂我说的」寻求共鸣。自嘲是真的，不是为了显得谦虚。偶尔说着说着会说「扯远了」再拉回来。

## 语言风格
- 句子长短随意，情绪浓时一句话，平静叙述时可以长一些，不追求统一
- 不用小标题强行切割，靠空行和语气变化来分层
- 说具体的事，不说抽象的道理——「那天我对着电脑屏幕发了20分钟呆」比「有时候我们会感到茫然」好一百倍
- 允许没结论，文章可以在一种感受里结束，不用强行给出答案
- 偶尔括号里加一句补充，像说话时顺嘴加的那种

## 文章结构（灵活，不强制）
1. 一个极具体的瞬间切入——越小越好，越日常越好，像「今天早上我在地铁上突然想哭」这种
2. 顺着这个瞬间展开，讲和它有关的感受、想法，允许中途跑题再回来
3. 分享一个小发现或一点点心得，不要求普适，说清楚「这只是我自己的体会」
4. 结尾留一个开放的问题或一句轻描淡写的话，不总结，不升华，像说完话后突然安静了

## 绝对禁止
- 「人生就是这样/生活就是这样」假装看透的虚无感
- 「姐妹们/宝子们/家人们」网红称谓
- 用「共鸣感」「治愈」「emo」「破防了」「绷不住」描述情绪，直接说清楚是什么感受
- 假装所有事都有意义，不是每件事都需要升华
- 「希望每个人都能找到自己的答案/愿你被这个世界温柔以待」鸡汤结尾
- 「我们」——说的是我自己，不代表所有人
- 「首先/其次/最后」「综上所述/由此可见」任何机械递进
- 每段都论点+论据+结论，绝对禁止八股文结构`;

export function defaultPromptSlots(): PromptSlot[] {
  return [
    // {
    //   id: createId("prompt"),
    //   name: "系统提示词",
    //   defaultName: "系统提示词",
    //   content: PROMPT_GENERIC,
    //   defaultContent: PROMPT_GENERIC,
    // },
    {
      id: createId("prompt"),
      name: "新媒体运营",
      defaultName: "新媒体运营",
      content: PROMPT_NEW_MEDIA,
      defaultContent: PROMPT_NEW_MEDIA,
    },
    {
      id: createId("prompt"),
      name: "心理医生",
      defaultName: "心理医生",
      content: PROMPT_PSYCHOLOGY,
      defaultContent: PROMPT_PSYCHOLOGY,
    },
    {
      id: createId("prompt"),
      name: "树洞学姐",
      defaultName: "树洞学姐",
      content: PROMPT_TREEHOUSE,
      defaultContent: PROMPT_TREEHOUSE,
    },
  ];
}

export function defaultArticleDraft(): GeneratePayload {
  return {
    topic: "",
    audience: "大学生",
    style: "专业理性",
    length: "medium",
    imageCount: 0,
    mode: "standard",
    systemPrompt: "",
    creationMode: "original",
    sourceArticle: "",
    rewriteGoal: "new_article",
    referenceFocus: "mixed",
    referenceLevel: "medium",
    expressionMode: "standard",
    apiModel: "doubao-seed-2-0-pro-260215",
    apiBaseUrl: "https://ark.cn-beijing.volces.com/api/v3",
    enableWebSearch: true,
  };
}

export function defaultDraftMeta(): DraftMeta {
  return { title: "", author: "", digest: "" };
}

export const lengthOptions: Array<{ label: string; value: ArticleLength }> = [
  { label: "短文 (500-800 字)", value: "short" },
  { label: "中等 (800-1500 字)", value: "medium" },
  { label: "长文 (1500+ 字)", value: "long" },
];

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
