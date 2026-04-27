import { Button, Input } from "antd";
import { BarChartOutlined, BulbOutlined, FileTextOutlined, HeartFilled, ReloadOutlined } from "@ant-design/icons";
import type { PromptSlot } from "../../lib/app-ui";

const { TextArea } = Input;

function getTabIcon(name: string) {
  switch (name) {
    case "新媒体运营":
      return <BarChartOutlined style={{ color: "#3b82f6" }} />;
    case "心理医生":
      return <HeartFilled style={{ color: "#8b5cf6" }} />;
    case "树洞学姐":
      return <BulbOutlined style={{ color: "#10b981" }} />;
    default:
      return <FileTextOutlined style={{ color: "#9ca3af" }} />;
  }
}

type Props = {
  promptSlots: PromptSlot[];
  activePromptId: string;
  activePrompt?: PromptSlot;
  systemPrompt: string;
  onPromptChange: (id: string) => void;
  onReset: () => void;
  onPromptNameChange: (value: string) => void;
  onPromptContentChange: (value: string) => void;
};

export function PromptPage({
  promptSlots,
  activePromptId,
  activePrompt,
  systemPrompt,
  onPromptChange,
  onReset,
  onPromptNameChange,
  onPromptContentChange,
}: Props) {
  return (
    <div className="single-panel-wrap">
      <div className="ui-card single-panel-card">
        <div className="page-section-head">
          <div>
            <div className="card-title">编辑模板</div>
            <div className="helper-text">点击下方 Tab 切换，修改后自动保存；「恢复默认」还原当前模板。</div>
          </div>
          <Button onClick={onReset} icon={<ReloadOutlined />}>
            恢复默认
          </Button>
        </div>

        <div className="prompt-tab-switcher">
          {promptSlots.map((slot) => {
            const isActive = slot.id === activePromptId;
            return (
              <button
                key={slot.id}
                className={`prompt-tab-btn${isActive ? " active" : ""}`}
                onClick={() => onPromptChange(slot.id)}
              >
                {getTabIcon(slot.name)}
                <span>{slot.name}</span>
              </button>
            );
          })}
        </div>

        <div className="prompt-editor-grid">
          <div className="form-item">
            <div className="form-item-label">模板名称</div>
            <Input
              value={activePrompt?.name}
              onChange={(event) => onPromptNameChange(event.target.value)}
              maxLength={16}
              placeholder="例如：心理医生"
            />
          </div>
          <div className="form-item">
            <div className="form-item-label">提示词内容</div>
            <TextArea
              value={systemPrompt}
              onChange={(event) => onPromptContentChange(event.target.value)}
              autoSize={{ minRows: 14, maxRows: 20 }}
              placeholder="在这里编辑当前模板的系统提示词"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
