import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { App as AntApp, Button, ConfigProvider, Input, Modal, Space } from "antd";
import { CheckCircleFilled, CloudUploadOutlined, RocketOutlined, SendOutlined } from "@ant-design/icons";
import { backendHealthcheck, generateArticle, sendWechatDraft, uploadWechatThumb } from "./lib/openclaw-api";
import { getRuntimeInfo } from "./lib/tauri";
import type { GeneratePayload, RuntimeInfo, WechatAccount } from "./lib/types";
import {
  audienceOptions,
  defaultAccounts,
  defaultArticleDraft,
  defaultDraftMeta,
  defaultPromptSlots,
  expressionModeOptions,
  extractTitleFromMarkdown,
  type DraftMeta,
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

const BACKEND_BASE_URL = import.meta.env.DEV ? "/api" : "http://49.235.172.63:8000";

const storageKeys = {
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
  const [activeView, setActiveView] = useState<SidebarView>("workspace");
  const [accounts, setAccounts] = useState<WechatAccount[]>(() =>
    parseStoredValue(storageKeys.accounts, defaultAccounts()),
  );
  const [activeAccountId, setActiveAccountId] = useState(() =>
    window.localStorage.getItem(storageKeys.activeAccountId) || "",
  );
  const [promptSlots, setPromptSlots] = useState<PromptSlot[]>(() =>
    parseStoredValue(storageKeys.promptSlots, defaultPromptSlots()),
  );
  const [activePromptId, setActivePromptId] = useState(() =>
    window.localStorage.getItem(storageKeys.activePromptId) || "",
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
  const [isSendingDraft, setIsSendingDraft] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [settingsCollapsed, setSettingsCollapsed] = useState(false);
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [accountDialogMode, setAccountDialogMode] = useState<"create" | "edit">("create");
  const [accountForm, setAccountForm] = useState<WechatAccount>(defaultAccounts()[0]);
  const [lastSaveTime, setLastSaveTime] = useState("");

  useEffect(() => {
    getRuntimeInfo().then(setRuntimeInfo);
    backendHealthcheck(BACKEND_BASE_URL)
      .then((result) => setServiceStatus(result.ok ? "服务正常" : "服务异常"))
      .catch(() => setServiceStatus("连接失败"));
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
    window.localStorage.setItem(storageKeys.articleDraft, JSON.stringify(articleDraft));
    window.localStorage.setItem(storageKeys.draftMeta, JSON.stringify(draftMeta));
    window.localStorage.setItem(storageKeys.resultMarkdown, resultMarkdown);
    setLastSaveTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
  }, [accounts, activeAccountId, promptSlots, activePromptId, articleDraft, draftMeta, resultMarkdown]);

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
      apiModel:
        !current.apiModel || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(current.apiModel)
          ? "doubao-seed-2-0-pro-260215"
          : current.apiModel,
      apiBaseUrl: current.apiBaseUrl || "https://ark.cn-beijing.volces.com/api/v3",
    }));
  }, []);

  const setArticleField = <K extends keyof GeneratePayload>(key: K, value: GeneratePayload[K]) => {
    setArticleDraft((current) => ({ ...current, [key]: value }));
  };

  const setDraftField = <K extends keyof DraftMeta>(key: K, value: DraftMeta[K]) => {
    setDraftMeta((current) => ({ ...current, [key]: value }));
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
      setAccounts((current) =>
        current.map((account) => (account.id === payload.id ? payload : account)),
      );
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
    // 从代码里取最新默认值，而不是用 localStorage 里可能已过时的 defaultContent
    const freshDefaults = defaultPromptSlots();
    const matched = freshDefaults.find((s) => s.defaultName === activePrompt.defaultName) ?? freshDefaults[0];
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
      const result = await uploadWechatThumb(BACKEND_BASE_URL, file, {
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
    setIsGenerating(true);
    setResultMarkdown("");
    setDraftMeta((current) => ({ ...current, title: "", digest: "" }));
    try {
      const result = await generateArticle(
        BACKEND_BASE_URL,
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
      setDraftMeta((current) => ({
        title: current.title || title,
        author: current.author || activeAccount?.name || "",
        digest: current.digest || digest,
      }));
      message.success("文章生成完成");
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
      const result = await sendWechatDraft(BACKEND_BASE_URL, {
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
      case "account":
        return "账号配置";
      case "prompt":
        return "提示词模板";
      case "model":
        return "模型设置";
      case "settings":
        return "应用设置";
      default:
        return "文章创作";
    }
  };

  return (
    <div className="app-container">
      <Sidebar
        activeView={activeView}
        serviceStatus={serviceStatus}
        accounts={accounts}
        activeAccountId={activeAccountId}
        activeAccount={activeAccount}
        onViewChange={setActiveView}
        onAccountChange={setActiveAccountId}
        onAddAccount={openCreateAccountDialog}
        onEditAccount={openEditAccountDialog}
      />

      <div className="main-wrapper">
        <header className="header">
          <div className="header-title">
            {renderHeaderTitle()}
          </div>
          {activeView === "workspace" ? (
            <Space>
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
            </Space>
          ) : null}
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
            isSendingDraft={isSendingDraft}
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
          <ModelPage articleDraft={articleDraft} onArticleFieldChange={setArticleField} />
        ) : null}

        {activeView === "settings" ? (
          <PlaceholderPage
            title="应用设置"
            description="当前版本服务地址已固定为线上服务，后续可以继续补充更多偏好设置。"
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
            <span className="footer-tip-dot">·</span>
            支持直接发送到公众号草稿箱，减少复制粘贴
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
