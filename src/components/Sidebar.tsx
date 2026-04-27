import { Button, Select, Space } from "antd";
import {
  AppstoreOutlined,
  BulbOutlined,
  CheckCircleFilled,
  EditOutlined,
  PlusOutlined,
  RobotOutlined,
  SettingOutlined,
  UserOutlined,
} from "@ant-design/icons";
import type { SidebarView } from "../lib/app-ui";
import { maskValue } from "../lib/app-ui";
import type { WechatAccount } from "../lib/types";

type Props = {
  activeView: SidebarView;
  serviceStatus: string;
  accounts: WechatAccount[];
  activeAccountId: string;
  activeAccount?: WechatAccount;
  onViewChange: (view: SidebarView) => void;
  onAccountChange: (id: string) => void;
  onAddAccount: () => void;
  onEditAccount: () => void;
};

export function Sidebar({
  activeView,
  serviceStatus,
  accounts,
  activeAccountId,
  activeAccount,
  onViewChange,
  onAccountChange,
  onAddAccount,
  onEditAccount,
}: Props) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-logo">
          <svg viewBox="0 0 32 32" width="38" height="38" fill="none">
            <g transform="translate(1.6 0)">
              <path d="M16 5.5 L9 13.4 L16 13.4 Z" fill="white" opacity="0.96" />
              <path d="M16.8 7.4 L16.8 13.4 L23 13.4 Z" fill="white" opacity="0.72" />
              <path d="M16 5.2 L16 16" stroke="white" strokeWidth="1.6" strokeLinecap="round" opacity="0.9" />
              <path d="M8.5 15.4 C11.5 16.5 20.5 16.5 23.6 15.4 C21.5 18 10.7 18 8.5 15.4 Z" fill="white" opacity="0.96" />
              <path d="M7.2 19.2 C10.2 20.3 13 20.2 16 19.2" stroke="white" strokeWidth="1.7" strokeLinecap="round" opacity="0.88" />
              <path d="M14.8 20.2 C17.5 21 20.2 20.9 24 19.3" stroke="white" strokeWidth="1.7" strokeLinecap="round" opacity="0.62" />
            </g>
          </svg>
        </div>
        <div className="brand-name">
          <span className="main">文栈</span>
          <span className="sub">公众号创作台</span>
        </div>
      </div>

      <div className={`service-status ${serviceStatus === "服务正常" ? "ok" : "warn"}`}>
        <div className="status-dot" />
        <span>{serviceStatus}</span>
      </div>

      <div className="account-section">
        <div className="nav-section-title">
          <span>我的公众号</span>
          <Space size={4}>
            <Button type="text" size="small" icon={<PlusOutlined />} onClick={onAddAccount} />
            <Button type="text" size="small" icon={<EditOutlined />} onClick={onEditAccount} />
          </Space>
        </div>
        <Select
          style={{ width: "100%" }}
          value={activeAccountId}
          onChange={onAccountChange}
          options={accounts.map((account) => ({ label: account.name, value: account.id }))}
          labelRender={({ label }) => (
            <div className="account-select-label">
              <div className="account-avatar-icon">号</div>
              <span className="account-select-name">{label}</span>
              <CheckCircleFilled style={{ color: "#22c55e", fontSize: 13 }} />
            </div>
          )}
        />
      </div>

      <nav className="nav-list">
        <button className={`nav-item${activeView === "workspace" ? " active" : ""}`} onClick={() => onViewChange("workspace")}>
          <AppstoreOutlined />
          <span>工作台</span>
        </button>
        <button className={`nav-item${activeView === "account" ? " active" : ""}`} onClick={() => onViewChange("account")}>
          <UserOutlined />
          <span>账号</span>
        </button>
        <button className={`nav-item${activeView === "model" ? " active" : ""}`} onClick={() => onViewChange("model")}>
          <RobotOutlined />
          <span>模型</span>
        </button>
        <button className={`nav-item${activeView === "prompt" ? " active" : ""}`} onClick={() => onViewChange("prompt")}>
          <BulbOutlined />
          <span>提示词</span>
        </button>
        <button className={`nav-item${activeView === "settings" ? " active" : ""}`} onClick={() => onViewChange("settings")}>
          <SettingOutlined />
          <span>设置</span>
        </button>
      </nav>

      <div className="sidebar-footer-card">
        <div className="footer-account-name">
          {activeAccount?.name || "未命名账号"}
          <CheckCircleFilled style={{ color: "#22c55e", fontSize: 12, marginLeft: 4 }} />
        </div>
        <div className="footer-detail-row">
          <span className="footer-detail-key">AppID</span>
          <span className="footer-detail-val">{maskValue(activeAccount?.appId ?? "")}</span>
        </div>
        <div className="footer-detail-row">
          <span className="footer-detail-key">封面 ID</span>
          <span className="footer-detail-val">{maskValue(activeAccount?.thumbMediaId ?? "")}</span>
        </div>
        <div className="footer-thumb-status">
          <div className={`footer-thumb-dot${activeAccount?.thumbMediaId ? " ok" : ""}`} />
          <span>{activeAccount?.thumbMediaId ? "封面图已就绪" : "等待上传封面图"}</span>
        </div>
      </div>
    </aside>
  );
}
