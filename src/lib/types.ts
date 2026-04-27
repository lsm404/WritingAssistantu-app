export type ArticleLength = "short" | "medium" | "long";

export type WritingMode =
  | "standard"
  | "story"
  | "case_study"
  | "listicle"
  | "analysis";

export type CreationMode = "original" | "rewrite";

export type RewriteGoal =
  | "new_article"
  | "new_angle"
  | "more_conversational"
  | "more_actionable";

export type ReferenceFocus = "mixed" | "structure" | "tone" | "opening";

export type ReferenceLevel = "low" | "medium" | "high";

export type ExpressionMode =
  | "standard"
  | "conversational"
  | "de_ai"
  | "opinionated";

export interface RuntimeInfo {
  platform: string;
  arch: string;
  tauriVersion: string;
}

export interface GeneratePayload {
  topic: string;
  audience: string;
  style: string;
  length: ArticleLength;
  mode: WritingMode;
  systemPrompt: string;
  creationMode: CreationMode;
  sourceArticle?: string;
  rewriteGoal: RewriteGoal;
  referenceFocus: ReferenceFocus;
  referenceLevel: ReferenceLevel;
  expressionMode: ExpressionMode;
  apiKey?: string;
  apiModel?: string;
  apiBaseUrl?: string;
  enableWebSearch?: boolean;
}

export interface WechatAccount {
  id: string;
  name: string;
  appId: string;
  appSecret: string;
  thumbMediaId: string;
}

export interface DraftPayload {
  title: string;
  contentMd: string;
  digest?: string;
  author?: string;
  wechatAppId?: string;
  wechatAppSecret?: string;
  wechatThumbMediaId?: string;
  wechatBaseUrl?: string;
}

export interface HealthcheckResult {
  ok: boolean;
  message: string;
}

export interface GenerateResponse {
  ok: boolean;
  articleMd: string;
  meta: {
    model: string;
    length: ArticleLength;
    mode: WritingMode;
    creationMode: "original" | "rewrite";
  };
}

export interface DraftResponse {
  mediaId?: string;
}

export interface UploadThumbResponse {
  thumbMediaId: string;
  url?: string;
}
