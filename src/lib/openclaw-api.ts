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
  ReferenceFocus,
  ReferenceLevel,
  RewriteGoal,
  UploadThumbResponse,
  UserMembership,
  UserQuotaSummary,
  WechatAccount,
} from "./types";

import { getOrCreateDeviceId } from "./device-id";
import { encryptWechatAppSecretForTransport } from "./wechat-account-transport-crypto";

const envBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const DOUBAO_BASE_URL = "https://ark.cn-beijing.volces.com/api/v3";

const REWRITE_GOAL_LABELS: Record<RewriteGoal, string> = {
  new_article: "重写为新文章",
  new_angle: "换个切入角度",
  more_conversational: "更口语化",
  more_actionable: "更可执行",
};

const REFERENCE_FOCUS_LABELS: Record<ReferenceFocus, string> = {
  mixed: "综合参考",
  structure: "重点参考结构",
  tone: "重点参考语气",
  opening: "重点参考开头",
};

const REFERENCE_LEVEL_LABELS: Record<ReferenceLevel, string> = {
  low: "轻参考",
  medium: "中参考",
  high: "强参考",
};

const DE_AI_TONE_INSTRUCTION = `我希望文本略有点生涩和稚嫩，用那种中文并不是很精通的人的语气撰写这个文本，稍微学术一点，态度端正一点，更多体现在语言上的大白话`;

/** 发往模型的「规则/系统指令」类文本字符上限（UTF-16 码元，与 String.length 一致），所有组装入口在此处截断且不可跳过。 */
const AI_RULE_INSTRUCTIONS_MAX_CHARS = 5000;

const AI_RULE_TRUNCATION_MARKER = "…[已按平台规则截断]";

function clampAiInstructionString(text: string, maxChars: number): string {
  if (maxChars <= 0) {
    return "";
  }
  const t = text.trim();
  if (t.length <= maxChars) {
    return t;
  }
  const marker = AI_RULE_TRUNCATION_MARKER;
  if (maxChars <= marker.length) {
    return t.slice(0, maxChars);
  }
  const budget = maxChars - marker.length;
  return t.slice(0, budget) + marker;
}

/** 两段规则（如：系统提示 + 去 AI 味）总长不超过 maxChars；优先保留后段，前段可截断。 */
function enforceTwoPartAiRules(partA: string, partB: string, maxChars: number): [string, string] {
  if (partA.length + partB.length <= maxChars) {
    return [partA, partB];
  }
  if (partB.length >= maxChars) {
    return ["", clampAiInstructionString(partB, maxChars)];
  }
  const maxA = maxChars - partB.length;
  return [clampAiInstructionString(partA, maxA), partB];
}

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
  payload: { email: string; password: string; displayName: string; inviteCode: string },
): Promise<{ user: AuthUser }> {
  const deviceId = getOrCreateDeviceId();
  const response = await fetch(`${baseUrl}/v1/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Device-Id": deviceId,
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
  const response = await fetch(`${baseUrl}/v1/plans`, {
    cache: "no-store",
    headers: {
      "Cache-Control": "no-cache",
      "Pragma": "no-cache",
    },
  });

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

function buildPrompts(payload: GeneratePayload) {
  const defaultRole = "";
  const primaryRule = (payload.systemPrompt?.trim() || defaultRole).trim() || defaultRole;
  const [ruleBlockSystem, ruleBlockDeAi] = enforceTwoPartAiRules(
    primaryRule,
    DE_AI_TONE_INSTRUCTION,
    AI_RULE_INSTRUCTIONS_MAX_CHARS,
  );

  const systemPromptParts = [ruleBlockSystem, ruleBlockDeAi].filter((s) => s.length > 0);
  const systemPromptRaw = systemPromptParts.join("\n\n");
  const systemPrompt = clampAiInstructionString(systemPromptRaw, AI_RULE_INSTRUCTIONS_MAX_CHARS);
  const userPrompt = buildDirectUserPrompt(payload);

  return { systemPrompt, userPrompt };
}

export function buildGeneratePayload(payload: GeneratePayload) {
  const { systemPrompt, userPrompt } = buildPrompts(payload);
  return {
    system_prompt: systemPrompt,
    user_prompt: userPrompt,
    length: payload.length,
    mode: payload.mode || undefined,
    creation_mode: payload.creationMode,
    enable_web_search: payload.enableWebSearch ?? undefined,
  };
}

function buildExpressionRequirement(expressionMode: NonNullable<GeneratePayload["expressionMode"]>) {
  const mapping: Record<NonNullable<GeneratePayload["expressionMode"]>, string> = {
    standard: "通俗易懂，大白话，不装文化人。",
    conversational: "就像咱们现在面对面聊天一样，极度口语化，多用短促的句子。",
    de_ai: "彻底抛弃AI腔调，要有血有肉有情绪，多写具体的真实生活场景。",
    opinionated: "情绪极度饱满，爱憎分明，该激动就激动，带入强烈的个人主观色彩。",
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

function buildModeDescription(mode: NonNullable<GeneratePayload["mode"]>) {
  const mapping: Record<NonNullable<GeneratePayload["mode"]>, string> = {
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
      payload.rewriteGoal ? `改写目标：${REWRITE_GOAL_LABELS[payload.rewriteGoal]}` : "",
      payload.referenceFocus ? `参考重点：${REFERENCE_FOCUS_LABELS[payload.referenceFocus]}` : "",
      payload.referenceLevel ? `参考强度：${REFERENCE_LEVEL_LABELS[payload.referenceLevel]}` : "",
      `文章长度：${buildLengthDescription(payload.length)}`,
      payload.mode ? `写作模式：${buildModeDescription(payload.mode)}` : "",
      payload.topic ? `主题：${payload.topic}` : "",
      payload.audience ? `目标读者：${payload.audience}` : "",
      payload.style ? `风格偏好：${payload.style}` : "",
      payload.expressionMode ? `表达处理：${buildExpressionRequirement(payload.expressionMode)}` : "",
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
    "请根据下面的信息，生成一篇微信公众号文章。",
    `主题：${payload.topic}`,
    payload.audience ? `目标读者：${payload.audience}` : "",
    payload.style ? `风格偏好：${payload.style}` : "",
    `文章长度：${buildLengthDescription(payload.length)}`,
    payload.mode ? `写作模式：${buildModeDescription(payload.mode)}` : "",
    payload.expressionMode ? `表达处理：${buildExpressionRequirement(payload.expressionMode)}` : "",
    "",
    "请直接输出最终 Markdown 成稿，不要输出分析过程。",
  ]
    .filter(Boolean)
    .join("\n");
}

function buildRequestBody(payload: GeneratePayload, stream: boolean) {
  const { systemPrompt, userPrompt } = buildPrompts(payload);

  return {
    model: payload.apiModel,
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: systemPrompt,
          },
          {
            type: "input_text",
            text: userPrompt,
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
    content_html: payload.contentHtml || undefined,
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
      mode?: GeneratePayload["mode"];
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
      watermark: payload.watermark,
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

export async function fetchUserPrompts(baseUrl: string, token: string): Promise<{ prompts: any[] }> {
  const response = await fetch(`${baseUrl}/v1/prompts`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) await parseError(response);
  return response.json();
}

export async function createUserPrompt(baseUrl: string, token: string, payload: { name: string; content: string }): Promise<{ prompt: any }> {
  const response = await fetch(`${baseUrl}/v1/prompts`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  if (!response.ok) await parseError(response);
  return response.json();
}

export async function updateUserPrompt(baseUrl: string, token: string, promptId: string, payload: { name: string; content: string }): Promise<{ prompt: any }> {
  const response = await fetch(`${baseUrl}/v1/prompts/${promptId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  if (!response.ok) await parseError(response);
  return response.json();
}

export async function deleteUserPrompt(baseUrl: string, token: string, promptId: string): Promise<{ ok: boolean }> {
  const response = await fetch(`${baseUrl}/v1/prompts/${promptId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) await parseError(response);
  return response.json();
}

export async function fetchUserWechatAccounts(
  baseUrl: string,
  token: string,
): Promise<{ accounts: WechatAccount[]; activeAccountId: string }> {
  const response = await fetch(`${baseUrl}/v1/wechat-accounts`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) await parseError(response);
  return response.json();
}

export async function fetchWechatAccountsEncryptionKey(
  baseUrl: string,
  token: string,
): Promise<{ publicKeyPem: string }> {
  const response = await fetch(`${baseUrl}/v1/wechat-accounts/encryption-key`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) await parseError(response);
  return response.json();
}

export async function saveUserWechatAccounts(
  baseUrl: string,
  token: string,
  payload: { accounts: WechatAccount[]; activeAccountId: string },
): Promise<{ accounts: WechatAccount[]; activeAccountId: string }> {
  const { publicKeyPem } = await fetchWechatAccountsEncryptionKey(baseUrl, token);

  const accountsPayload = await Promise.all(
    payload.accounts.map(async (a) => ({
      id: a.id,
      name: a.name,
      appId: a.appId,
      thumbMediaId: a.thumbMediaId,
      appSecretEncrypted: a.appSecret.trim()
        ? await encryptWechatAppSecretForTransport(a.appSecret, publicKeyPem)
        : "",
    })),
  );

  const response = await fetch(`${baseUrl}/v1/wechat-accounts`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      accounts: accountsPayload,
      activeAccountId: payload.activeAccountId,
    }),
  });
  if (!response.ok) await parseError(response);
  return response.json();
}
