import { Button, Select, Space } from "antd";
import {
  AppstoreOutlined,
  BulbOutlined,
  CheckCircleFilled,
  EditOutlined,
  LockOutlined,
  PlusOutlined,
  SettingOutlined,
  UserOutlined,
} from "@ant-design/icons";
import type { SidebarView } from "../lib/app-ui";
import { maskValue } from "../lib/app-ui";
import type { AuthUser, UserMembership, UserQuotaSummary, WechatAccount } from "../lib/types";

type Props = {
  activeView: SidebarView;
  serviceStatus: string;
  currentUser: AuthUser;
  membership: UserMembership | null;
  quota: UserQuotaSummary | null;
  accounts: WechatAccount[];
  activeAccountId: string;
  activeAccount?: WechatAccount;
  onViewChange: (view: SidebarView) => void;
  onAccountChange: (id: string) => void;
  onAddAccount: () => void;
  onEditAccount: () => void;
  onLogout: () => void;
};

const quotaMap: Record<string, { textDaily: number; imageMonthly: number }> = {
  monthly_199: { textDaily: 5, imageMonthly: 15 },
  monthly_399: { textDaily: 10, imageMonthly: 35 },
  monthly_599: { textDaily: 15, imageMonthly: 50 },
  monthly_990: { textDaily: 25, imageMonthly: 90 },
};

function getMembershipToneClass(planCode?: string | null) {
  switch (planCode) {
    case "monthly_199":
      return "plan-tone-sun";
    case "monthly_399":
      return "plan-tone-sky";
    case "monthly_599":
      return "plan-tone-orange";
    case "monthly_990":
      return "plan-tone-purple";
    default:
      return "plan-tone-default";
  }
}

export function Sidebar({
  activeView,
  serviceStatus,
  currentUser,
  membership,
  quota,
  accounts,
  activeAccountId,
  activeAccount,
  onViewChange,
  onAccountChange,
  onAddAccount,
  onEditAccount,
  onLogout,
}: Props) {
  const membershipLabel = membership?.isActive ? membership.plan.name : "未开通会员";
  const membershipToneClass = getMembershipToneClass(membership?.plan?.code);
  const defaultQuota = membership?.isActive
    ? membership.plan?.code
      ? quotaMap[membership.plan.code] ?? null
      : null
    : { textDaily: 3, imageMonthly: 3 };
  const textLimit = quota?.text.limit ?? defaultQuota?.textDaily ?? 0;
  const imageLimit = quota?.image.limit ?? defaultQuota?.imageMonthly ?? 0;
  const textUsed = quota?.text.used ?? 0;
  const imageUsed = quota?.image.used ?? 0;
  const textProgress = textLimit > 0 ? Math.min(100, (textUsed / textLimit) * 100) : 0;
  const imageProgress = imageLimit > 0
    ? Math.min(100, (imageUsed / imageLimit) * 100)
    : 0;

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
          <span className={`footer-detail-val footer-membership-pill ${membershipToneClass}`}>{membershipLabel}</span>
        </div>
        <div className="footer-thumb-status">
          <div className={`footer-thumb-dot${membership?.isActive ? " ok" : ""}`} />
          <span>{membership?.isActive ? "会员权益已激活" : "开通会员后可查看额度使用情况"}</span>
        </div>

        <div className="footer-quota-card">
          <div className="footer-quota-head">
            <span>额度消耗</span>
            <span className="footer-quota-note">{membership?.isActive ? "按当前套餐" : "免费体验"}</span>
          </div>

          <div className="footer-quota-item">
            <div className="footer-quota-row">
              <span>今日文字</span>
              <strong>{textLimit > 0 ? `${textUsed} / ${textLimit}` : "-- / --"}</strong>
            </div>
            <div className="footer-quota-bar">
              <div className="footer-quota-fill text" style={{ width: `${textProgress}%` }} />
            </div>
          </div>

          <div className="footer-quota-item">
            <div className="footer-quota-row">
              <span>本月图片</span>
              <strong>{imageLimit > 0 ? `${imageUsed} / ${imageLimit}` : "-- / --"}</strong>
            </div>
            <div className="footer-quota-bar">
              <div className="footer-quota-fill image" style={{ width: `${imageProgress}%` }} />
            </div>
          </div>
        </div>

        <button className="sidebar-logout-btn" onClick={onLogout}>
          退出登录
        </button>
        <div className="footer-mini-account">当前公众号：{activeAccount?.name || "未命名账号"}</div>
      </div>
    </aside>
  );
}
