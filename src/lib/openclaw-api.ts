import type {
  AuthSession,
  AuthUser,
  DraftPayload,
  DraftResponse,
  GeneratePayload,
  GenerateResponse,
  HealthcheckResult,
  ImageGeneratePayload,
  ImageGenerateResponse,
  MembershipPlan,
  ModelConfig,
  UploadThumbResponse,
  UserQuotaSummary,
  UserMembership,
} from "./types";

const envBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const DOUBAO_BASE_URL = "https://ark.cn-beijing.volces.com/api/v3";

const DE_AI_TONE_INSTRUCTION = `【去 AI 味硬性规则，必须严格遵守，优先级高于其他风格设定。
1. 禁止使用典型 AI 套路表达，如“首先/其次/最后”“综上所述”“不难发现”“由此可见”。
2. 不要用模板化三段论，不要整篇都像列提纲。
3. 句子长短要有变化，允许出现非常短的句子。
4. 不要每个小标题都硬凑三点。
5. 观点要具体，少说空泛正确的话。
6. 结尾不要升华，不要喊口号，用一个具体画面或一句轻一点的话收住。
7. 小标题要具体，不要“核心逻辑/关键要点”这种空标题。
请把以上规则当作底线，在不违背主题要求的前提下，写出像真人自然写出来的公众号文章。}`;

export const defaultBackendBaseUrl = envBaseUrl || "";

export async function backendHealthcheck(baseUrl: string): Promise<HealthcheckResult> {
  const response = await fetch(`${baseUrl}/health`);

  if (!response.ok) {
    throw new Error(`Healthcheck failed with status ${response.status}`);
  }

  const data = (await response.json()) as { ok?: boolean };

  return {
    ok: data.ok === true,
    message: data.ok ? "Backend is reachable." : "Backend returned an unexpected payload.",
  };
}

export async function registerAccount(
  baseUrl: string,
  payload: { email: string; password: string; displayName: string },
): Promise<{ user: AuthUser }> {
  const response = await fetch(`${baseUrl}/v1/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    await parseError(response);
  }

  const data = (await response.json()) as { user: AuthUser };
  return { user: data.user };
}

export async function loginAccount(
  baseUrl: string,
  payload: { email: string; password: string },
): Promise<AuthSession> {
  const response = await fetch(`${baseUrl}/v1/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    await parseError(response);
  }

  return (await response.json()) as AuthSession;
}

export async function fetchCurrentUser(
  baseUrl: string,
  token: string,
): Promise<{
  user: AuthUser;
  membership: UserMembership | null;
  quota: UserQuotaSummary | null;
  session: { expiresAt: string };
}> {
  const response = await fetch(`${baseUrl}/v1/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    await parseError(response);
  }

  return (await response.json()) as {
    user: AuthUser;
    membership: UserMembership | null;
    quota: UserQuotaSummary | null;
    session: { expiresAt: string };
  };
}

export async function fetchMembershipPlans(baseUrl: string): Promise<MembershipPlan[]> {
  const response = await fetch(`${baseUrl}/v1/plans`);

  if (!response.ok) {
    await parseError(response);
  }

  const data = (await response.json()) as { plans: MembershipPlan[] };
  return data.plans;
}

export async function checkoutMembership(
  baseUrl: string,
  token: string,
  planCode: string,
): Promise<{ membership: UserMembership; order: { orderNo: string; amountLabel: string } }> {
  const response = await fetch(`${baseUrl}/v1/memberships/checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ planCode }),
  });

  if (!response.ok) {
    await parseError(response);
  }

  return (await response.json()) as {
    membership: UserMembership;
    order: { orderNo: string; amountLabel: string };
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
    listicle: "清单型内容，条理清晰。",
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
    const data = (await response.json()) as { detail?: string; error?: string; message?: string };
    if (data.detail) {
      message = data.detail;
    } else if (data.message) {
      message = data.message;
    } else if (data.error) {
      message = data.error;
    }
  } catch {
    // Ignore JSON parsing failures and keep the default message.
  }

  throw new Error(message);
}

export async function generateArticle(
  baseUrl: string,
  token: string,
  payload: GeneratePayload,
  onChunk?: (delta: string) => void,
): Promise<GenerateResponse> {
  const response = await fetch(`${baseUrl}/article/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(buildGeneratePayload(payload)),
  });

  if (!response.ok) {
    await parseError(response);
  }

  const data = (await response.json()) as {
    ok: boolean;
    article_md: string;
    meta: {
      model: string;
      length: GeneratePayload["length"];
      mode: GeneratePayload["mode"];
      creation_mode: GeneratePayload["creationMode"];
    };
    quota?: UserQuotaSummary;
  };

  if (onChunk && data.article_md) {
    onChunk(data.article_md);
  }

  return {
    ok: data.ok,
    articleMd: data.article_md,
    meta: {
      model: data.meta.model,
      length: data.meta.length,
      mode: data.meta.mode,
      creationMode: data.meta.creation_mode,
    },
    quota: data.quota,
  };
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

// ===== Image Generation =====

export function buildImagePayload(payload: ImageGeneratePayload) {
  return {
    prompt: payload.prompt,
    negative_prompt: payload.negativePrompt || undefined,
    size: payload.size,
    quality: payload.quality,
    n: payload.n,
  };
}

export async function generateImage(payload: ImageGeneratePayload): Promise<ImageGenerateResponse> {
  const response = await fetch(`${payload.baseUrl}/image/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${payload.authToken}`,
    },
    body: JSON.stringify({
      prompt: payload.prompt,
      negative_prompt: payload.negativePrompt || undefined,
      size: payload.size,
      quality: payload.quality,
      n: payload.n,
    }),
  });

  if (!response.ok) {
    await parseError(response);
  }

  const data = (await response.json()) as {
    images?: Array<{
      url?: string;
      b64_json?: string;
      revised_prompt?: string;
    }>;
    meta?: {
      model?: string;
    };
    quota?: UserQuotaSummary;
  };

  return {
    ok: true,
    images: data.images || [],
    meta: {
      model: data.meta?.model || "",
      size: payload.size,
      quality: payload.quality,
      n: payload.n,
    },
    quota: data.quota,
  };
}

// ===== Model Configuration =====

export async function fetchModelConfig(baseUrl: string, token: string): Promise<ModelConfig> {
  const response = await fetch(`${baseUrl}/v1/model-config`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    await parseError(response);
  }

  const data = (await response.json()) as { config: ModelConfig };
  return data.config;
}

export async function updateModelConfig(baseUrl: string, token: string, config: Partial<ModelConfig>): Promise<ModelConfig> {
  const response = await fetch(`${baseUrl}/v1/model-config`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(config),
  });

  if (!response.ok) {
    await parseError(response);
  }

  const data = (await response.json()) as { config: ModelConfig };
  return data.config;
}
