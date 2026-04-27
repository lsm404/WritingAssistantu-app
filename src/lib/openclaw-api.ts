import type {
  DraftPayload,
  DraftResponse,
  GeneratePayload,
  GenerateResponse,
  HealthcheckResult,
  UploadThumbResponse,
} from "./types";

const envBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const DOUBAO_BASE_URL = "https://ark.cn-beijing.volces.com/api/v3";
const DOUBAO_PROXY_BASE_URL = "/doubao";

// 强制去 AI 味指令：无论用户选哪个提示词模板，都会拼接在 system prompt 之后
const DE_AI_TONE_INSTRUCTION = `【去 AI 味硬性规则，必须严格遵守，优先级高于其他风格设定】
1. 禁止使用以下典型 AI 腔套路词汇与句式：
   - "首先/其次/再者/最后" 这种机械罗列；
   - "总而言之/综上所述/总的来说/值得一提的是/不难发现/由此可见"；
   - "在当今/在这个…的时代/随着…的发展/在快节奏的生活中" 等宏大开场；
   - "相信很多人都有过这样的经历" "你是否也…" 这种空泛共情；
   - "让我们一起…" "希望本文能给你带来启发" "共勉"；
   - "赋能、闭环、底层逻辑、认知升级、降维打击、破圈、心智、抓手" 等互联网黑话（除非主题强相关）；
   - 过多 emoji、过多感叹号、过多反问句堆叠。
2. 禁止"总-分-总"式的模板化结构。段落之间要有自然的思路推进，而不是条目清单感。
3. 句子长短要交错，不要每段都 3-4 句、每句都差不多长。允许出现很短的句子，甚至单独一句成段。
4. 不要在每个小标题下都强行凑三点。真实写作中，有的部分要展开，有的部分只需一两句带过。
5. 观点要具体、带细节、带一点作者自己的语气，不要只做"正确的废话"的堆叠。
6. 结尾不要总结全文、不要升华、不要喊口号，用一个具体画面、一句留白、或一个具体的建议收住即可。
7. 小标题用具体描述，不要用"一、核心要点" "二、实践方法" 这种目录式表达。

请把以上规则当作底线，在不违背主题要求的前提下，写出让人看起来像真人随手写出来的公众号文章。`;

export const defaultBackendBaseUrl = envBaseUrl || "";

export async function backendHealthcheck(baseUrl: string): Promise<HealthcheckResult> {
  const response = await fetch(`${baseUrl}/health`);

  if (!response.ok) {
    throw new Error(`Healthcheck failed with status ${response.status}`);
  }

  const data = (await response.json()) as { status?: string };

  return {
    ok: data.status === "ok",
    message:
      data.status === "ok"
        ? "Python backend is reachable."
        : "Backend returned a success response with an unexpected payload.",
  };
}

export function buildGeneratePayload(payload: GeneratePayload) {
  return {
    topic: payload.topic,
    audience: payload.audience || undefined,
    style: payload.style || undefined,
    length: payload.length,
    mode: payload.mode,
    system_prompt: payload.systemPrompt || undefined,
    creation_mode: payload.creationMode,
    source_article: payload.sourceArticle || undefined,
    rewrite_goal: payload.rewriteGoal,
    reference_focus: payload.referenceFocus,
    reference_level: payload.referenceLevel,
    expression_mode: payload.expressionMode,
    api_key: payload.apiKey || undefined,
    model: payload.apiModel || undefined,
    api_base_url: payload.apiKey || payload.apiModel ? DOUBAO_BASE_URL : undefined,
    enable_web_search: payload.enableWebSearch ?? undefined,
  };
}

function buildExpressionRequirement(expressionMode: GeneratePayload["expressionMode"]) {
  const mapping: Record<GeneratePayload["expressionMode"], string> = {
    standard: "保持自然、清晰、直接的公众号表达。",
    conversational: "整体更口语化，像在和读者聊天。",
    de_ai: "明显降低 AI 腔，避免模板化总结口吻。",
    opinionated: "观点更鲜明，但保持克制，不要夸张。",
  };
  return mapping[expressionMode];
}

function buildLengthDescription(length: GeneratePayload["length"]) {
  const mapping: Record<GeneratePayload["length"], string> = {
    short: "偏短，约 500-800 字。",
    medium: "中等长度，约 800-1500 字。",
    long: "偏长，约 1500 字以上。",
  };
  return mapping[length];
}

function buildModeDescription(mode: GeneratePayload["mode"]) {
  const mapping: Record<GeneratePayload["mode"], string> = {
    standard: "标准公众号干货文章。",
    story: "故事化表达，增强代入感。",
    case_study: "案例拆解风格，强调具体案例。",
    listicle: "清单型内容，条理清楚。",
    analysis: "分析型文章，强调背景、问题和判断。",
  };
  return mapping[mode];
}

function buildDirectUserPrompt(payload: GeneratePayload) {
  if (payload.creationMode === "rewrite") {
    return [
      "请基于下面的参考文章，写一篇新的微信公众号文章。",
      `改写目标：${payload.rewriteGoal}`,
      `参考重点：${payload.referenceFocus}`,
      `参考强度：${payload.referenceLevel}`,
      `文章长度：${buildLengthDescription(payload.length)}`,
      `写作模式：${buildModeDescription(payload.mode)}`,
      payload.topic ? `主题：${payload.topic}` : "",
      payload.audience ? `目标读者：${payload.audience}` : "",
      payload.style ? `风格偏好：${payload.style}` : "",
      `表达处理：${buildExpressionRequirement(payload.expressionMode)}`,
      "",
      "参考文章如下：",
      payload.sourceArticle || "",
      "",
      "请直接输出最终 Markdown 成稿，不要输出分析过程。",
    ]
      .filter(Boolean)
      .join("\n");
  }

  return [
    "请根据下面的信息，生成一篇微信公众号文章初稿。",
    `主题：${payload.topic}`,
    payload.audience ? `目标读者：${payload.audience}` : "",
    payload.style ? `风格偏好：${payload.style}` : "",
    `文章长度：${buildLengthDescription(payload.length)}`,
    `写作模式：${buildModeDescription(payload.mode)}`,
    `表达处理：${buildExpressionRequirement(payload.expressionMode)}`,
    "",
    "请直接输出最终 Markdown 成稿，不要输出分析过程。",
  ]
    .filter(Boolean)
    .join("\n");
}

function buildRequestBody(payload: GeneratePayload, stream: boolean) {
  return {
    model: payload.apiModel,
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: payload.systemPrompt || "你是一名擅长微信公众号写作的内容编辑，请输出适合直接发布或继续润色的 Markdown。",
          },
          {
            type: "input_text",
            text: DE_AI_TONE_INSTRUCTION,
          },
          {
            type: "input_text",
            text: buildDirectUserPrompt(payload),
          },
        ],
      },
    ],
    stream,
    ...(payload.enableWebSearch ? { tools: [{ type: "web_search" }] } : {}),
  };
}

async function readSseStream(
  body: ReadableStream<Uint8Array>,
  onChunk: (delta: string) => void,
): Promise<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const raw = line.slice(6).trim();
      if (raw === "[DONE]") continue;

      try {
        const event = JSON.parse(raw) as { type?: string; delta?: string };
        if (event.type === "response.output_text.delta" && event.delta) {
          fullText += event.delta;
          onChunk(event.delta);
        }
      } catch {
        // ignore malformed SSE frames
      }
    }
  }

  return fullText;
}

async function generateArticleDirectly(
  payload: GeneratePayload,
  onChunk?: (delta: string) => void,
): Promise<GenerateResponse> {
  const baseUrl = DOUBAO_BASE_URL;
  const streaming = !!onChunk;

  const response = await fetch(`${baseUrl}/responses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${payload.apiKey}`,
    },
    body: JSON.stringify(buildRequestBody(payload, streaming)),
  });

  if (!response.ok) {
    await parseError(response);
  }

  if (streaming && response.body) {
    const articleMd = await readSseStream(response.body, onChunk!);
    return {
      ok: true,
      articleMd,
      meta: {
        model: payload.apiModel || "",
        length: payload.length,
        mode: payload.mode,
        creationMode: payload.creationMode,
      },
    };
  }

  const data = (await response.json()) as {
    output?: Array<{
      type?: string;
      content?: Array<{ type?: string; text?: string }>;
    }>;
    output_text?: string;
    model?: string;
  };

  const messageOutput = data.output?.find((item) => item.type === "message") ?? data.output?.[0];
  const articleMd =
    messageOutput?.content
      ?.filter((item) => ["output_text", "text"].includes(item.type || ""))
      .map((item) => item.text || "")
      .join("") ||
    data.output_text ||
    "";

  return {
    ok: true,
    articleMd,
    meta: {
      model: data.model || payload.apiModel || "",
      length: payload.length,
      mode: payload.mode,
      creationMode: payload.creationMode,
    },
  };
}

export function buildDraftPayload(payload: DraftPayload) {
  return {
    title: payload.title,
    content_md: payload.contentMd,
    digest: payload.digest || undefined,
    author: payload.author || undefined,
    wechat_appid: payload.wechatAppId || undefined,
    wechat_appsecret: payload.wechatAppSecret || undefined,
    wechat_thumb_media_id: payload.wechatThumbMediaId || undefined,
    wechat_base_url: payload.wechatBaseUrl || undefined,
  };
}

async function parseError(response: Response): Promise<never> {
  let message = `Request failed with status ${response.status}`;

  try {
    const data = (await response.json()) as { detail?: string };
    if (data.detail) {
      message = data.detail;
    }
  } catch {
    // Ignore JSON parsing failures and keep the default message.
  }

  throw new Error(message);
}

export async function generateArticle(
  baseUrl: string,
  payload: GeneratePayload,
  onChunk?: (delta: string) => void,
): Promise<GenerateResponse> {
  return generateArticleDirectly(payload, onChunk);
}

export async function sendWechatDraft(
  baseUrl: string,
  payload: DraftPayload,
): Promise<DraftResponse> {
  const response = await fetch(`${baseUrl}/wechat/draft`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(buildDraftPayload(payload)),
  });

  if (!response.ok) {
    await parseError(response);
  }

  const data = (await response.json()) as { media_id?: string };
  return {
    mediaId: data.media_id,
  };
}

export async function uploadWechatThumb(
  baseUrl: string,
  file: File,
  account?: {
    appId?: string;
    appSecret?: string;
  },
): Promise<UploadThumbResponse> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    if (account?.appId) {
      formData.append("wechat_appid", account.appId);
    }
    if (account?.appSecret) {
      formData.append("wechat_appsecret", account.appSecret);
    }

    const response = await fetch(`${baseUrl}/wechat/upload_thumb`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      await parseError(response);
    }

    const data = (await response.json()) as { thumb_media_id: string; url?: string };
    return {
      thumbMediaId: data.thumb_media_id,
      url: data.url,
    };
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error("上传请求未成功到达服务，请检查代理配置、线上服务连通性，以及服务器是否开放上传接口。");
    }
    throw error;
  }
}
