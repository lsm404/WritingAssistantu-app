"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { App as AntApp, Button, ConfigProvider, Input, Modal, Space, Tag } from "antd";
import { CheckCircleFilled, CloudUploadOutlined, RocketOutlined, SendOutlined } from "@ant-design/icons";
import {
  backendHealthcheck,
  checkoutMembership,
  fetchCurrentUser,
  fetchMembershipPlans,
  generateArticle,
  generateImage,
  loginAccount,
  registerAccount,
  sendWechatDraft,
  uploadWechatThumb,
} from "./lib/openclaw-api";
import { getRuntimeInfo } from "./lib/tauri";
import type {
  AuthSession,
  AuthUser,
  GeneratePayload,
  MembershipPlan,
  RuntimeInfo,
  UserMembership,
  WechatAccount,
} from "./lib/types";
import {
  audienceOptions,
  defaultAccounts,
  defaultArticleDraft,
  defaultDraftMeta,
  defaultPromptSlots,
  expressionModeOptions,
  extractTitleFromMarkdown,
  type DraftMeta,
  imageCountOptions,
  lengthOptions,
  modeOptions,
  parseStoredValue,
  type PromptSlot,
  referenceFocusOptions,
  referenceLevelOptions,
  rewriteGoalOptions,
  type SidebarView,
  styleOptions,
  summarizeMarkdown,
} from "./lib/app-ui";
import { Sidebar } from "./components/Sidebar";
import { TopTemplateTabs } from "./components/TopTemplateTabs";
import { WorkspacePage } from "./components/pages/WorkspacePage";
import { PromptPage } from "./components/pages/PromptPage";
import { AccountPage } from "./components/pages/AccountPage";
import { ModelPage } from "./components/pages/ModelPage";
import { PlaceholderPage } from "./components/pages/PlaceholderPage";
import { ImagePage } from "./components/pages/ImagePage";
import { LoginPage } from "./components/pages/LoginPage";
import { MembershipPage } from "./components/pages/MembershipPage";
import { WechatPreviewModal } from "./components/WechatPreviewModal";

const MEMBER_BACKEND_BASE_URL = import.meta.env.VITE_MEMBER_API_BASE_URL?.trim() || "/member-api";
const CONTENT_BACKEND_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim() || MEMBER_BACKEND_BASE_URL;

const storageKeys = {
  authToken: "openclaw.authToken",
  accounts: "openclaw.wechatAccounts",
  activeAccountId: "openclaw.activeAccountId",
  promptSlots: "openclaw.promptSlots",
  activePromptId: "openclaw.activePromptId",
  articleDraft: "openclaw.articleDraft",
  resultMarkdown: "openclaw.resultMarkdown",
  draftMeta: "openclaw.draftMeta",
} as const;

function InnerApp() {
  const { message } = AntApp.useApp();
  const sourceFileInputRef = useRef<HTMLInputElement | null>(null);
  const coverFileInputRef = useRef<HTMLInputElement | null>(null);

  const [, setRuntimeInfo] = useState<RuntimeInfo | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authLoading, setAuthLoading] = useState(false);
  const [authToken, setAuthToken] = useState(() => window.localStorage.getItem(storageKeys.authToken) || "");
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [membership, setMembership] = useState<UserMembership | null>(null);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [checkoutLoading, setCheckoutLoading] = useState("");
  const [activeView, setActiveView] = useState<SidebarView>("workspace");
  const [authForm, setAuthForm] = useState({
    email: "",
    password: "",
    displayName: "",
  });
  const [accounts, setAccounts] = useState<WechatAccount[]>(() =>
    parseStoredValue(storageKeys.accounts, defaultAccounts()),
  );
  const [activeAccountId, setActiveAccountId] = useState(
    () => window.localStorage.getItem(storageKeys.activeAccountId) || "",
  );
  const [promptSlots, setPromptSlots] = useState<PromptSlot[]>(() =>
    parseStoredValue(storageKeys.promptSlots, defaultPromptSlots()),
  );
  const [activePromptId, setActivePromptId] = useState(
    () => window.localStorage.getItem(storageKeys.activePromptId) || "",
  );
  const [articleDraft, setArticleDraft] = useState<GeneratePayload>(() =>
    parseStoredValue(storageKeys.articleDraft, defaultArticleDraft()),
  );
  const [draftMeta, setDraftMeta] = useState<DraftMeta>(() =>
    parseStoredValue(storageKeys.draftMeta, defaultDraftMeta()),
  );
  const [resultMarkdown, setResultMarkdown] = useState(
    () => window.localStorage.getItem(storageKeys.resultMarkdown) || "",
  );
  const [serviceStatus, setServiceStatus] = useState("连接中");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [isSendingDraft, setIsSendingDraft] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [settingsCollapsed, setSettingsCollapsed] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [accountDialogMode, setAccountDialogMode] = useState<"create" | "edit">("create");
  const [accountForm, setAccountForm] = useState<WechatAccount>(defaultAccounts()[0]);
  const [lastSaveTime, setLastSaveTime] = useState("");

  useEffect(() => {
    getRuntimeInfo().then(setRuntimeInfo);
    backendHealthcheck(MEMBER_BACKEND_BASE_URL)
      .then((result) => setServiceStatus(result.ok ? "服务正常" : "服务异常"))
      .catch(() => setServiceStatus("连接失败"));
  }, []);

  useEffect(() => {
    fetchMembershipPlans(MEMBER_BACKEND_BASE_URL).then(setPlans).catch(() => undefined);
  }, []);

  useEffect(() => {
    const token = window.localStorage.getItem(storageKeys.authToken) || "";
    if (!token) {
      setAuthReady(true);
      return;
    }

    fetchCurrentUser(MEMBER_BACKEND_BASE_URL, token)
      .then((result) => {
        setAuthToken(token);
        setCurrentUser(result.user);
        setMembership(result.membership);
      })
      .catch(() => {
        window.localStorage.removeItem(storageKeys.authToken);
        setAuthToken("");
        setCurrentUser(null);
        setMembership(null);
      })
      .finally(() => setAuthReady(true));
  }, []);

  useEffect(() => {
    if (!accounts.length) {
      const fallback = defaultAccounts();
      setAccounts(fallback);
      setActiveAccountId(fallback[0].id);
      return;
    }
    if (!accounts.some((account) => account.id === activeAccountId)) {
      setActiveAccountId(accounts[0].id);
    }
  }, [accounts, activeAccountId]);

  useEffect(() => {
    if (!promptSlots.length) {
      const fallback = defaultPromptSlots();
      setPromptSlots(fallback);
      setActivePromptId(fallback[0].id);
      return;
    }
    if (!promptSlots.some((slot) => slot.id === activePromptId)) {
      setActivePromptId(promptSlots[0].id);
    }
  }, [promptSlots, activePromptId]);

  useEffect(() => {
    window.localStorage.setItem(storageKeys.accounts, JSON.stringify(accounts));
    window.localStorage.setItem(storageKeys.activeAccountId, activeAccountId);
    window.localStorage.setItem(storageKeys.promptSlots, JSON.stringify(promptSlots));
    window.localStorage.setItem(storageKeys.activePromptId, activePromptId);
    const { apiKey: _k, apiModel: _m, apiBaseUrl: _b, ...draftToSave } = articleDraft;
    window.localStorage.setItem(storageKeys.articleDraft, JSON.stringify(draftToSave));
    window.localStorage.setItem(storageKeys.draftMeta, JSON.stringify(draftMeta));
    window.localStorage.setItem(storageKeys.resultMarkdown, resultMarkdown);
    setLastSaveTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
  }, [accounts, activeAccountId, promptSlots, activePromptId, articleDraft, draftMeta, resultMarkdown]);

  useEffect(() => {
    if (authToken) {
      window.localStorage.setItem(storageKeys.authToken, authToken);
    } else {
      window.localStorage.removeItem(storageKeys.authToken);
    }
  }, [authToken]);

  const activeAccount = useMemo(
    () => accounts.find((account) => account.id === activeAccountId) ?? accounts[0],
    [accounts, activeAccountId],
  );

  const activePrompt = useMemo(
    () => promptSlots.find((slot) => slot.id === activePromptId) ?? promptSlots[0],
    [promptSlots, activePromptId],
  );

  useEffect(() => {
    if (!activePrompt) return;
    setArticleDraft((current) => {
      if (current.systemPrompt.trim() && current.systemPrompt !== activePrompt.content) {
        return current;
      }
      return { ...current, systemPrompt: activePrompt.content };
    });
  }, [activePrompt]);

  useEffect(() => {
    setArticleDraft((current) => ({
      ...current,
      audience: current.audience || "大学生",
      style: current.style || "专业理性",
    }));
  }, []);

  const setArticleField = <K extends keyof GeneratePayload>(key: K, value: GeneratePayload[K]) => {
    setArticleDraft((current) => ({ ...current, [key]: value }));
  };

  const updateActiveAccount = (patch: Partial<WechatAccount>) => {
    if (!activeAccount) return;
    setAccounts((current) =>
      current.map((account) => (account.id === activeAccount.id ? { ...account, ...patch } : account)),
    );
  };

  const updateActivePrompt = (patch: Partial<PromptSlot>) => {
    if (!activePrompt) return;
    setPromptSlots((current) =>
      current.map((slot) => (slot.id === activePrompt.id ? { ...slot, ...patch } : slot)),
    );
  };

  const switchPrompt = (id: string) => {
    setActivePromptId(id);
    const target = promptSlots.find((slot) => slot.id === id);
    if (target) setArticleField("systemPrompt", target.content);
  };

  const refreshCurrentUser = async (token: string) => {
    const result = await fetchCurrentUser(MEMBER_BACKEND_BASE_URL, token);
    setCurrentUser(result.user);
    setMembership(result.membership);
  };

  const buildIllustrationPrompts = (articleMd: string, title: string, count: number) => {
    const sections = articleMd
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("![]("));
    const chunks = sections.filter((line) => !line.startsWith("# ")).slice(0, Math.max(count * 2, count));

    return Array.from({ length: count }, (_, index) => {
      const chunk = chunks[index] || chunks[chunks.length - 1] || title;
      return [
        "微信公众号文章配图，中文内容理解后生成画面。",
        "风格要求：简洁、质感、高级、适合公众号排版配图。",
        `文章标题：${title}`,
        `配图重点：${chunk.replace(/^#+\s*/, "").slice(0, 120)}`,
      ].join(" ");
    });
  };

  const mergeArticleWithImages = (articleMd: string, imageUrls: string[]) => {
    if (!imageUrls.length) {
      return articleMd;
    }

    const lines = articleMd.split("\n");
    const headingIndexes = lines
      .map((line, index) => ({ line: line.trim(), index }))
      .filter((item) => item.line.startsWith("## "))
      .map((item) => item.index);

    if (!headingIndexes.length) {
      return [articleMd, ...imageUrls.map((url) => `\n![](${url})\n`)].join("\n");
    }

    const insertIndexes = headingIndexes.slice(0, imageUrls.length).reverse();
    insertIndexes.forEach((lineIndex, reverseIndex) => {
      const imageUrl = imageUrls[imageUrls.length - 1 - reverseIndex];
      lines.splice(lineIndex + 1, 0, "", `![](${imageUrl})`, "");
    });

    return lines.join("\n");
  };

  const generateArticleIllustrations = async ({
    articleMd,
    title,
    count,
    authToken: currentToken,
  }: {
    articleMd: string;
    title: string;
    count: number;
    authToken: string;
  }) => {
    const prompts = buildIllustrationPrompts(articleMd, title, count);
    const results = await Promise.all(
      prompts.map((prompt) =>
        generateImage({
          prompt,
          size: "1024x1024",
          quality: "standard",
          n: 1,
          authToken: currentToken,
          baseUrl: CONTENT_BACKEND_BASE_URL,
        }),
      ),
    );

    return results
      .flatMap((result) => result.images)
      .map((item) => item.url || (item.b64_json ? `data:image/png;base64,${item.b64_json}` : ""))
      .filter(Boolean);
  };

  const handleAuthSubmit = async () => {
    if (!authForm.email.trim() || !authForm.password.trim()) {
      message.warning("请输入邮箱和密码");
      return;
    }

    if (authMode === "register" && !authForm.displayName.trim()) {
      message.warning("请输入昵称");
      return;
    }

    setAuthLoading(true);
    try {
      if (authMode === "register") {
        await registerAccount(MEMBER_BACKEND_BASE_URL, {
          email: authForm.email.trim(),
          password: authForm.password,
          displayName: authForm.displayName.trim(),
        });
        message.success("注册成功，请直接登录");
        setAuthMode("login");
        return;
      }

      const result: AuthSession = await loginAccount(MEMBER_BACKEND_BASE_URL, {
        email: authForm.email.trim(),
        password: authForm.password,
      });

      setAuthToken(result.token);
      setCurrentUser(result.user);
      await refreshCurrentUser(result.token);
      message.success("登录成功");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "登录失败");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setAuthToken("");
    setCurrentUser(null);
    setMembership(null);
    setAuthForm((current) => ({ ...current, password: "" }));
    message.success("已退出登录");
  };

  const handleCheckout = async (planCode: string) => {
    if (!authToken) {
      message.warning("请先登录");
      return;
    }

    setCheckoutLoading(planCode);
    try {
      const result = await checkoutMembership(MEMBER_BACKEND_BASE_URL, authToken, planCode);
      setMembership(result.membership);
      message.success(`开通成功，订单号 ${result.order.orderNo}`);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "开通失败");
    } finally {
      setCheckoutLoading("");
    }
  };

  const openCreateAccountDialog = () => {
    setAccountDialogMode("create");
    setAccountForm({
      id: `account-${Math.random().toString(36).slice(2, 10)}`,
      name: `公众号 ${accounts.length + 1}`,
      appId: "",
      appSecret: "",
      thumbMediaId: "",
    });
    setAccountDialogOpen(true);
  };

  const openEditAccountDialog = () => {
    if (!activeAccount) {
      message.warning("请先选择公众号账号");
      return;
    }
    setAccountDialogMode("edit");
    setAccountForm({ ...activeAccount });
    setAccountDialogOpen(true);
  };

  const submitAccountDialog = () => {
    const trimmedName = accountForm.name.trim();
    if (!trimmedName) {
      message.warning("请填写账号名称");
      return;
    }

    const payload: WechatAccount = {
      ...accountForm,
      name: trimmedName,
      appId: accountForm.appId.trim(),
      appSecret: accountForm.appSecret.trim(),
      thumbMediaId: accountForm.thumbMediaId.trim(),
    };

    if (accountDialogMode === "create") {
      setAccounts((current) => [...current, payload]);
      setActiveAccountId(payload.id);
      message.success("已新增公众号账号");
    } else {
      setAccounts((current) => current.map((account) => (account.id === payload.id ? payload : account)));
      setActiveAccountId(payload.id);
      message.success("已更新公众号账号");
    }

    setAccountDialogOpen(false);
  };

  const removeAccount = () => {
    if (!activeAccount) return;
    if (accounts.length === 1) {
      message.warning("至少保留一个公众号账号");
      return;
    }
    const nextAccounts = accounts.filter((account) => account.id !== activeAccount.id);
    setAccounts(nextAccounts);
    setActiveAccountId(nextAccounts[0]?.id ?? "");
    message.success("已删除当前账号");
  };

  const resetPromptTemplate = () => {
    if (!activePrompt) return;
    const freshDefaults = defaultPromptSlots();
    const matched = freshDefaults.find((slot) => slot.defaultName === activePrompt.defaultName) ?? freshDefaults[0];
    updateActivePrompt({
      name: matched.defaultName,
      content: matched.defaultContent,
      defaultContent: matched.defaultContent,
    });
    setArticleField("systemPrompt", matched.defaultContent);
    message.success("已恢复默认提示词");
  };

  const handleSourceFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const text = await file.text();
      setArticleField("sourceArticle", text.slice(0, 5000));
      message.success(`已导入参考内容：${file.name}`);
    } catch {
      message.error("参考文件读取失败");
    }
  };

  const handleCoverUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const uploadTarget = accountDialogOpen ? accountForm : activeAccount;
    if (!uploadTarget) return;

    if (!uploadTarget.appId.trim() || !uploadTarget.appSecret.trim()) {
      message.warning("请先填写公众号的 AppID 和 Secret");
      return;
    }
    if (!["image/png", "image/jpeg", "image/jpg"].includes(file.type)) {
      message.warning("封面图只支持 PNG 或 JPG");
      return;
    }
    if (file.size > 1024 * 1024) {
      message.warning("封面图大小不能超过 1MB");
      return;
    }

    setIsUploadingCover(true);
    try {
      const result = await uploadWechatThumb(CONTENT_BACKEND_BASE_URL, file, {
        appId: uploadTarget.appId,
        appSecret: uploadTarget.appSecret,
      });
      if (accountDialogOpen) {
        setAccountForm((current) => ({ ...current, thumbMediaId: result.thumbMediaId }));
      } else {
        updateActiveAccount({ thumbMediaId: result.thumbMediaId });
      }
      message.success("封面图上传成功");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "封面图上传失败");
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleGenerateArticle = async () => {
    if (articleDraft.creationMode === "original" && !articleDraft.topic.trim()) {
      message.warning("请先填写文章主题");
      return;
    }
    if (articleDraft.creationMode === "rewrite") {
      if (!articleDraft.sourceArticle?.trim()) {
        message.warning("参考改写模式下，请先填写参考文章");
        return;
      }
      if (articleDraft.sourceArticle.trim().length < 300) {
        message.warning("参考文章内容偏短，建议至少提供 300 字以上");
        return;
      }
    }

    if ((articleDraft.imageCount ?? 0) > 0 && !membership?.isActive) {
      message.warning("当前账号未开通会员，本次只生成文章内容，不生成配图");
    }

    setIsGenerating(true);
    setResultMarkdown("");
    setDraftMeta((current) => ({ ...current, title: "", digest: "" }));
    try {
      const result = await generateArticle(
        CONTENT_BACKEND_BASE_URL,
        {
          ...articleDraft,
          systemPrompt: articleDraft.systemPrompt.trim() || activePrompt?.content || "",
        },
        (delta) => {
          setResultMarkdown((prev) => prev + delta);
        },
      );
      const title = extractTitleFromMarkdown(result.articleMd, articleDraft.topic);
      const digest = summarizeMarkdown(result.articleMd);
      let finalMarkdown = result.articleMd;

      if ((articleDraft.imageCount ?? 0) > 0 && membership?.isActive) {
        setIsGeneratingImages(true);
        try {
          const imageUrls = await generateArticleIllustrations({
            articleMd: result.articleMd,
            title,
            count: articleDraft.imageCount ?? 0,
            authToken,
          });
          finalMarkdown = mergeArticleWithImages(result.articleMd, imageUrls);
          setResultMarkdown(finalMarkdown);
        } finally {
          setIsGeneratingImages(false);
        }
      }

      setDraftMeta((current) => ({
        title: current.title || title,
        author: current.author || activeAccount?.name || "",
        digest: current.digest || digest,
      }));
      message.success(
        (articleDraft.imageCount ?? 0) > 0 && membership?.isActive
          ? "文章和配图生成完成"
          : "文章生成完成",
      );
    } catch (error) {
      message.error(error instanceof Error ? error.message : "文章生成失败");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendDraft = async () => {
    if (!activeAccount) {
      message.warning("请先选择公众号账号");
      return;
    }
    if (!resultMarkdown.trim()) {
      message.warning("请先生成文章内容");
      return;
    }
    if (!activeAccount.appId.trim() || !activeAccount.appSecret.trim()) {
      message.warning("请先补全当前公众号的 AppID 和 Secret");
      return;
    }
    if (!activeAccount.thumbMediaId.trim()) {
      message.warning("请先上传封面图或填写 thumb_media_id");
      return;
    }

    const title = draftMeta.title.trim() || extractTitleFromMarkdown(resultMarkdown, articleDraft.topic);
    if (!title) {
      message.warning("请先补充文章标题");
      return;
    }

    setIsSendingDraft(true);
    try {
      const result = await sendWechatDraft(CONTENT_BACKEND_BASE_URL, {
        title,
        author: draftMeta.author.trim() || activeAccount.name,
        digest: draftMeta.digest.trim(),
        contentMd: resultMarkdown,
        wechatAppId: activeAccount.appId,
        wechatAppSecret: activeAccount.appSecret,
        wechatThumbMediaId: activeAccount.thumbMediaId,
      });
      message.success(result.mediaId ? `已发送到草稿箱：${result.mediaId}` : "已发送到草稿箱");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "发送到草稿箱失败");
    } finally {
      setIsSendingDraft(false);
    }
  };

  const handleCopyMarkdown = async () => {
    if (!resultMarkdown.trim()) {
      message.warning("当前没有可复制的内容");
      return;
    }
    await navigator.clipboard.writeText(resultMarkdown);
    message.success("Markdown 已复制");
  };

  const handleClearResult = () => {
    setResultMarkdown("");
    setDraftMeta((current) => ({ ...current, title: "", digest: "" }));
    message.success("已清空生成结果");
  };

  const renderHeaderTitle = () => {
    switch (activeView) {
      case "membership":
        return "会员中心";
      case "account":
        return "账号配置";
      case "prompt":
        return "提示词模板";
      case "model":
        return "模型设置";
      case "image":
        return "AI 图片生成";
      case "settings":
        return "应用设置";
      default:
        return "文章创作";
    }
  };

  if (!authReady) {
    return <div className="auth-loading-screen">正在加载账号状态...</div>;
  }

  if (!currentUser) {
    return (
      <LoginPage
        mode={authMode}
        loading={authLoading}
        form={authForm}
        onModeChange={setAuthMode}
        onFieldChange={(key, value) => setAuthForm((current) => ({ ...current, [key]: value }))}
        onSubmit={() => void handleAuthSubmit()}
      />
    );
  }

  return (
    <div className="app-container">
      <Sidebar
        activeView={activeView}
        serviceStatus={serviceStatus}
        currentUser={currentUser}
        membership={membership}
        accounts={accounts}
        activeAccountId={activeAccountId}
        activeAccount={activeAccount}
        onViewChange={setActiveView}
        onAccountChange={setActiveAccountId}
        onAddAccount={openCreateAccountDialog}
        onEditAccount={openEditAccountDialog}
        onLogout={handleLogout}
      />

      <div className="main-wrapper">
        <header className="header">
          <div className="header-title">{renderHeaderTitle()}</div>
          <Space>
            <Tag color={membership?.isActive ? "success" : "default"} className="header-membership-tag">
              {membership?.isActive ? (membership.plan.isLifetime ? "终生会员" : "月付会员") : "未开通会员"}
            </Tag>
            <span className="header-user-pill">{currentUser.displayName}</span>
            {activeView === "workspace" ? (
              <>
                <Button
                  icon={<SendOutlined />}
                  onClick={handleSendDraft}
                  loading={isSendingDraft}
                  disabled={isGenerating}
                >
                  {isSendingDraft ? "发送中..." : "发送到草稿箱"}
                </Button>
                <Button
                  type="primary"
                  icon={<RocketOutlined />}
                  onClick={handleGenerateArticle}
                  loading={isGenerating}
                  disabled={isSendingDraft}
                >
                  {isGenerating ? "生成中..." : "生成文章"}
                </Button>
              </>
            ) : null}
          </Space>
        </header>

        {activeView === "workspace" ? (
          <TopTemplateTabs promptSlots={promptSlots} activePromptId={activePromptId} onChange={switchPrompt} />
        ) : null}

        {activeView === "workspace" ? (
          <WorkspacePage
            articleDraft={articleDraft}
            resultMarkdown={resultMarkdown}
            settingsCollapsed={settingsCollapsed}
            isGenerating={isGenerating}
            isGeneratingImages={isGeneratingImages}
            isSendingDraft={isSendingDraft}
            imageCountOptions={imageCountOptions}
            lengthOptions={lengthOptions}
            modeOptions={modeOptions}
            expressionModeOptions={expressionModeOptions}
            audienceOptions={audienceOptions}
            styleOptions={styleOptions}
            rewriteGoalOptions={rewriteGoalOptions}
            referenceFocusOptions={referenceFocusOptions}
            referenceLevelOptions={referenceLevelOptions}
            onToggleSettings={() => setSettingsCollapsed((value) => !value)}
            onArticleFieldChange={setArticleField}
            onResultMarkdownChange={setResultMarkdown}
            onSourceFilePick={() => sourceFileInputRef.current?.click()}
            onCopyMarkdown={handleCopyMarkdown}
            onClearResult={handleClearResult}
            onPreview={() => setPreviewOpen(true)}
          />
        ) : null}

        {activeView === "membership" ? (
          <MembershipPage
            plans={plans}
            membership={membership}
            loading={!!checkoutLoading}
            activePlanCode={checkoutLoading}
            onCheckout={(planCode) => void handleCheckout(planCode)}
          />
        ) : null}

        {activeView === "prompt" ? (
          <PromptPage
            promptSlots={promptSlots}
            activePromptId={activePromptId}
            activePrompt={activePrompt}
            systemPrompt={articleDraft.systemPrompt}
            onPromptChange={switchPrompt}
            onReset={resetPromptTemplate}
            onPromptNameChange={(value) => updateActivePrompt({ name: value })}
            onPromptContentChange={(value) => {
              setArticleField("systemPrompt", value);
              updateActivePrompt({ content: value });
            }}
          />
        ) : null}

        {activeView === "account" ? (
          <AccountPage
            activeAccount={activeAccount}
            isUploadingCover={isUploadingCover}
            onAddAccount={openCreateAccountDialog}
            onEditAccount={openEditAccountDialog}
            onRemoveAccount={removeAccount}
            onPickCover={() => coverFileInputRef.current?.click()}
          />
        ) : null}

        {activeView === "model" ? (
          <ModelPage
            authToken={authToken || ""}
            baseUrl={MEMBER_BACKEND_BASE_URL}
            membership={membership}
          />
        ) : null}

        {activeView === "image" ? (
          <ImagePage
            membership={membership}
            authToken={authToken || ""}
            baseUrl={MEMBER_BACKEND_BASE_URL}
          />
        ) : null}

        {activeView === "settings" ? (
          <PlaceholderPage
            title="应用设置"
            description="当前版本先聚焦创作与会员能力，后续可以继续补充更多个人偏好设置。"
          />
        ) : null}

        <footer className="footer">
          <div className="footer-left">
            <span className="footer-saved">
              <CheckCircleFilled style={{ color: "#22c55e" }} />
              已自动保存
            </span>
            <span>最近保存：{lastSaveTime || "刚刚"}</span>
          </div>
          <div className="footer-right">
            <span className="footer-tip-dot">•</span>
            支持直接发送到公众号草稿箱，减少来回复制粘贴
          </div>
        </footer>
      </div>

      <input
        ref={sourceFileInputRef}
        type="file"
        accept=".txt,.md,text/plain"
        style={{ display: "none" }}
        onChange={handleSourceFileChange}
      />
      <input
        ref={coverFileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg"
        style={{ display: "none" }}
        onChange={handleCoverUpload}
      />

      <WechatPreviewModal
        open={previewOpen}
        title={draftMeta.title || extractTitleFromMarkdown(resultMarkdown, articleDraft.topic)}
        accountName={activeAccount?.name || ""}
        markdown={resultMarkdown}
        onClose={() => setPreviewOpen(false)}
      />

      <Modal
        title={accountDialogMode === "create" ? "新增公众号账号" : "编辑公众号账号"}
        open={accountDialogOpen}
        onCancel={() => setAccountDialogOpen(false)}
        onOk={submitAccountDialog}
        okText={accountDialogMode === "create" ? "创建" : "保存"}
        cancelText="取消"
        width={460}
      >
        <div className="account-form-grid">
          <div className="form-item">
            <div className="form-item-label">账号名称</div>
            <Input
              value={accountForm.name}
              onChange={(event) => setAccountForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="例如：公众号主号"
            />
          </div>
          <div className="form-item">
            <div className="form-item-label">公众号 AppID</div>
            <Input
              value={accountForm.appId}
              onChange={(event) => setAccountForm((current) => ({ ...current, appId: event.target.value }))}
              placeholder="填写公众号 AppID"
            />
          </div>
          <div className="form-item">
            <div className="form-item-label">公众号 Secret</div>
            <Input.Password
              value={accountForm.appSecret}
              onChange={(event) => setAccountForm((current) => ({ ...current, appSecret: event.target.value }))}
              placeholder="填写公众号 Secret"
            />
          </div>
          <div className="form-item">
            <div className="form-item-row">
              <div className="form-item-label">封面图 thumb_media_id</div>
              <Button
                size="small"
                icon={<CloudUploadOutlined />}
                onClick={() => coverFileInputRef.current?.click()}
                loading={isUploadingCover}
              >
                上传封面
              </Button>
            </div>
            <Input
              value={accountForm.thumbMediaId}
              onChange={(event) => setAccountForm((current) => ({ ...current, thumbMediaId: event.target.value }))}
              placeholder="也可以上传后自动回填"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#6366f1",
          borderRadius: 8,
          fontSize: 13,
          controlHeight: 34,
        },
      }}
    >
      <AntApp>
        <InnerApp />
      </AntApp>
    </ConfigProvider>
  );
}
