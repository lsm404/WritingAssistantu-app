import { Button, Input, Radio, Select, Space, Spin } from "antd";
import { CopyOutlined, DeleteOutlined, EyeOutlined, FileTextOutlined, LoadingOutlined, PictureOutlined, ReloadOutlined } from "@ant-design/icons";
import type { GeneratePayload } from "../../lib/types";

const { TextArea } = Input;

type Props = {
  articleDraft: GeneratePayload;
  resultMarkdown: string;
  settingsCollapsed: boolean;
  isGenerating?: boolean;
  isGeneratingImages?: boolean;
  isSendingDraft?: boolean;
  imageCountOptions: Array<{ label: string; value: number }>;
  lengthOptions: Array<{ label: string; value: GeneratePayload["length"] }>;
  modeOptions: Array<{ label: string; value: GeneratePayload["mode"] }>;
  expressionModeOptions: Array<{ label: string; value: GeneratePayload["expressionMode"] }>;
  audienceOptions: Array<{ label: string; value: string }>;
  styleOptions: Array<{ label: string; value: string }>;
  rewriteGoalOptions: Array<{ label: string; value: GeneratePayload["rewriteGoal"] }>;
  referenceFocusOptions: Array<{ label: string; value: GeneratePayload["referenceFocus"] }>;
  referenceLevelOptions: Array<{ label: string; value: GeneratePayload["referenceLevel"] }>;
  onToggleSettings: () => void;
  onArticleFieldChange: <K extends keyof GeneratePayload>(key: K, value: GeneratePayload[K]) => void;
  onResultMarkdownChange: (value: string) => void;
  onSourceFilePick: () => void;
  onCopyMarkdown: () => void;
  onClearResult: () => void;
  onPreview: () => void;
};

export function WorkspacePage({
  articleDraft,
  resultMarkdown,
  settingsCollapsed,
  isGenerating = false,
  isGeneratingImages = false,
  isSendingDraft = false,
  imageCountOptions,
  lengthOptions,
  modeOptions,
  expressionModeOptions,
  audienceOptions,
  styleOptions,
  rewriteGoalOptions,
  referenceFocusOptions,
  referenceLevelOptions,
  onToggleSettings,
  onArticleFieldChange,
  onResultMarkdownChange,
  onSourceFilePick,
  onCopyMarkdown,
  onClearResult,
  onPreview,
}: Props) {
  return (
    <div className="panels-row">
      <section className="settings-panel">
        <div className="ui-card">
          <div className="card-header">
            <span className="card-title">创作设置</span>
            <Button type="text" size="small" icon={<ReloadOutlined />} onClick={onToggleSettings}>
              {settingsCollapsed ? "展开" : "收起"}
            </Button>
          </div>

          {!settingsCollapsed ? (
            <div className="form-section">
              <div className="form-item">
                <div className="form-item-label">创作模式</div>
                <Radio.Group
                  className="mode-radio-group"
                  value={articleDraft.creationMode}
                  onChange={(event) => onArticleFieldChange("creationMode", event.target.value)}
                  buttonStyle="solid"
                >
                  <Radio.Button value="original">原创生成</Radio.Button>
                  <Radio.Button value="rewrite">参考改写</Radio.Button>
                </Radio.Group>
              </div>

              <div className="form-item">
                <div className="form-item-label">
                  主题
                  <span className="required-star">*</span>
                </div>
                <Input
                  placeholder="输入文章主题或核心观点"
                  value={articleDraft.topic}
                  onChange={(event) => onArticleFieldChange("topic", event.target.value)}
                  suffix={<span className="input-counter">{articleDraft.topic.length}/60</span>}
                  maxLength={60}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div className="form-item">
                  <div className="form-item-label">目标读者</div>
                  <Select
                    placeholder="选择目标读者"
                    value={articleDraft.audience}
                    onChange={(value) => onArticleFieldChange("audience", value)}
                    options={audienceOptions}
                    allowClear
                  />
                </div>

                <div className="form-item">
                  <div className="form-item-label">风格偏好</div>
                  <Select
                    placeholder="选择风格偏好"
                    value={articleDraft.style}
                    onChange={(value) => onArticleFieldChange("style", value)}
                    options={styleOptions}
                    allowClear
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginTop: "4px" }}>
                <div className="form-item">
                  <div className="form-item-label">长度</div>
                  <Select value={articleDraft.length} onChange={(value) => onArticleFieldChange("length", value)} options={lengthOptions} />
                </div>
                <div className="form-item">
                  <div className="form-item-label">配图数量</div>
                  <Select
                    value={articleDraft.imageCount ?? 0}
                    onChange={(value) => onArticleFieldChange("imageCount", value)}
                    options={imageCountOptions}
                  />
                </div>
                <div className="form-item">
                  <div className="form-item-label">模式</div>
                  <Select value={articleDraft.mode} onChange={(value) => onArticleFieldChange("mode", value)} options={modeOptions} />
                </div>
                <div className="form-item">
                  <div className="form-item-label">表达处理</div>
                  <Select
                    value={articleDraft.expressionMode}
                    onChange={(value) => onArticleFieldChange("expressionMode", value)}
                    options={expressionModeOptions}
                  />
                </div>
              </div>

              {articleDraft.creationMode === "rewrite" ? (
                <>
                  <div className="form-row">
                    <div className="form-item">
                      <div className="form-item-label">改写目标</div>
                      <Select value={articleDraft.rewriteGoal} onChange={(value) => onArticleFieldChange("rewriteGoal", value)} options={rewriteGoalOptions} />
                    </div>
                    <div className="form-item">
                      <div className="form-item-label">参考重点</div>
                      <Select value={articleDraft.referenceFocus} onChange={(value) => onArticleFieldChange("referenceFocus", value)} options={referenceFocusOptions} />
                    </div>
                    <div className="form-item">
                      <div className="form-item-label">参考强度</div>
                      <Select value={articleDraft.referenceLevel} onChange={(value) => onArticleFieldChange("referenceLevel", value)} options={referenceLevelOptions} />
                    </div>
                  </div>

                  <div className="form-item">
                    <div className="form-item-label">参考文章</div>
                    <TextArea
                      value={articleDraft.sourceArticle}
                      onChange={(event) => onArticleFieldChange("sourceArticle", event.target.value.slice(0, 5000))}
                      autoSize={{ minRows: 8, maxRows: 12 }}
                      placeholder="粘贴参考文章、链接摘要，或导入文本文件"
                      maxLength={5000}
                    />
                    <div className="helper-row">
                      <span className="helper-text">{(articleDraft.sourceArticle ?? "").length}/5000</span>
                      <Button onClick={onSourceFilePick} icon={<FileTextOutlined />}>
                        导入文件
                      </Button>
                    </div>
                  </div>
                </>
              ) : null}

            </div>
          ) : null}
        </div>
      </section>

      <section className="results-panel">
        <div className="ui-card results-card">
          <div className="card-title-plain">生成结果</div>

          <div className="article-content-area" style={{ position: "relative" }}>
            {isGenerating && (
              <div className="image-gen-overlay">
                <Spin
                  indicator={<LoadingOutlined style={{ fontSize: 38, color: "rgba(255,255,255,0.92)" }} spin />}
                />
                <span className="image-gen-overlay-text">正在生成文章...</span>
              </div>
            )}
            <TextArea
              className="editor-textarea"
              placeholder={isGenerating ? "" : "文章内容会在这里生成..."}
              value={resultMarkdown}
              onChange={(event) => onResultMarkdownChange(event.target.value)}
              autoSize={false}
              readOnly={isGenerating}
              disabled={isSendingDraft}
            />
            {isGeneratingImages && (
              <div className="image-gen-overlay">
                <Spin
                  indicator={<LoadingOutlined style={{ fontSize: 38, color: "rgba(255,255,255,0.92)" }} spin />}
                />
                <span className="image-gen-overlay-text">
                  <PictureOutlined style={{ marginRight: 6 }} />
                  正在生成配图...
                </span>
              </div>
            )}
            {isSendingDraft && (
              <div className="result-loading-overlay">
                <div className="result-loading-inner">
                  <Spin
                    indicator={<LoadingOutlined style={{ fontSize: 32, color: "#6366f1" }} spin />}
                  />
                  <span className="result-loading-text">正在发送到草稿箱...</span>
                </div>
              </div>
            )}
          </div>

          <div className="results-footer">
            <Space className="results-footer-left">
              <Button
                icon={<EyeOutlined />}
                onClick={onPreview}
                disabled={isGenerating || isSendingDraft || !resultMarkdown.trim()}
              >
                预览
              </Button>
              <Button icon={<CopyOutlined />} onClick={onCopyMarkdown} disabled={isGenerating || isSendingDraft}>
                复制 Markdown
              </Button>
              <Button icon={<DeleteOutlined />} danger onClick={onClearResult} disabled={isGenerating || isSendingDraft}>
                清空
              </Button>
            </Space>
          </div>
        </div>
      </section>
    </div>
  );
}
