import {
  BarChartOutlined,
  BulbOutlined,
  FileTextOutlined,
  HeartFilled,
} from "@ant-design/icons";
import type { PromptSlot } from "../lib/app-ui";

function getTabIcon(name: string, isActive: boolean) {
  const activeStyle = { color: "white" };
  switch (name) {
    case "新媒体运营":
      return <BarChartOutlined style={isActive ? activeStyle : { color: "#3b82f6" }} />;
    case "心理医生":
      return <HeartFilled style={isActive ? activeStyle : { color: "#8b5cf6" }} />;
    case "树洞学姐":
      return <BulbOutlined style={isActive ? activeStyle : { color: "#10b981" }} />;
    default:
      return <FileTextOutlined style={isActive ? activeStyle : { color: "#9ca3af" }} />;
  }
}

type Props = {
  promptSlots: PromptSlot[];
  activePromptId: string;
  onChange: (id: string) => void;
};

export function TopTemplateTabs({ promptSlots, activePromptId, onChange }: Props) {
  return (
    <div className="template-tab-bar">
      <span className="tab-bar-label">提示词</span>
      {promptSlots.map((slot) => {
        const isActive = slot.id === activePromptId;
        return (
          <button
            key={slot.id}
            className={`tab-bar-btn${isActive ? " active" : ""}`}
            onClick={() => onChange(slot.id)}
          >
            {getTabIcon(slot.name, isActive)}
            <span>{slot.name}</span>
          </button>
        );
      })}
    </div>
  );
}
