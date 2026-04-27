import { Button, Select, Space } from "antd";
import {
  AppstoreOutlined,
  BulbOutlined,
  CheckCircleFilled,
  EditOutlined,
  LockOutlined,
  PictureOutlined,
  PlusOutlined,
  RobotOutlined,
  SettingOutlined,
  UserOutlined,
} from "@ant-design/icons";
import type { SidebarView } from "../lib/app-ui";
import { maskValue } from "../lib/app-ui";
import type { AuthUser, UserMembership, WechatAccount } from "../lib/types";

type Props = {
  activeView: SidebarView;
  serviceStatus: string;
  currentUser: AuthUser;
  membership: UserMembership | null;
  accounts: WechatAccount[];
  activeAccountId: string;
  activeAccount?: WechatAccount;
  onViewChange: (view: SidebarView) => void;
  onAccountChange: (id: string) => void;
  onAddAccount: () => void;
  onEditAccount: () => void;
  onLogout: () => void;
};

export function Sidebar({
  activeView,
  serviceStatus,
  currentUser,
  membership,
  accounts,
  activeAccountId,
  activeAccount,
  onViewChange,
  onAccountChange,
  onAddAccount,
  onEditAccount,
  onLogout,
}: Props) {
  const membershipLabel = membership?.isActive
    ? membership.plan.isLifetime
      ? "终生会员"
      : "月付会员"
    : "未开通会员";

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
          <span className="main">文爪</span>
          <span className="sub">桌面创作台</span>
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
        <button className={`nav-item${activeView === "membership" ? " active" : ""}`} onClick={() => onViewChange("membership")}>
          <LockOutlined />
          <span>会员中心</span>
        </button>
        <button className={`nav-item${activeView === "account" ? " active" : ""}`} onClick={() => onViewChange("account")}>
          <UserOutlined />
          <span>账号</span>
        </button>
        {/* <button className={`nav-item${activeView === "model" ? " active" : ""}`} onClick={() => onViewChange("model")}>
          <RobotOutlined />
          <span>模型</span>
        </button> */}
        {/* <button className={`nav-item${activeView === "image" ? " active" : ""}`} onClick={() => onViewChange("image")}>
          <PictureOutlined />
          <span>AI 图片</span>
          {membership?.isActive && <span className="nav-item-badge">会员</span>}
        </button> */}
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
          {currentUser.displayName || currentUser.email}
          <CheckCircleFilled style={{ color: "#22c55e", fontSize: 12, marginLeft: 4 }} />
        </div>
        <div className="footer-detail-row">
          <span className="footer-detail-key">账号</span>
          <span className="footer-detail-val">{maskValue(currentUser.email, 5, 8)}</span>
        </div>
        <div className="footer-detail-row">
          <span className="footer-detail-key">会员</span>
          <span className="footer-detail-val">{membershipLabel}</span>
        </div>
        <div className="footer-thumb-status">
          <div className={`footer-thumb-dot${membership?.isActive ? " ok" : ""}`} />
          <span>{membership?.isActive ? "会员权益已激活" : "可开通会员提升配额"}</span>
        </div>
        <button className="sidebar-logout-btn" onClick={onLogout}>
          退出登录
        </button>
        <div className="footer-mini-account">当前公众号：{activeAccount?.name || "未命名账号"}</div>
      </div>
    </aside>
  );
}
