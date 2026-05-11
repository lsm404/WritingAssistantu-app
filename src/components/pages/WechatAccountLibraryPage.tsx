import { useState, type MouseEvent } from "react";
import { Button, Modal, Popconfirm, Typography } from "antd";
import {
  CloudUploadOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  MessageOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import type { WechatAccount } from "../../lib/types";

const { Paragraph } = Typography;

type Props = {
  accounts: WechatAccount[];
  activeAccountId: string;
  isUploadingCover: boolean;
  onSelectAccount: (id: string) => void;
  onAddAccount: () => void;
  onEditAccount: (account: WechatAccount) => void;
  onRemoveAccount: (account: WechatAccount) => void;
  onPickCover: (accountId: string) => void;
  membership: any;
};

function maskAppId(appId: string) {
  const t = appId.trim();
  if (!t) return "未填写 AppID";
  if (t.length <= 12) return `${t.slice(0, 4)}…`;
  return `${t.slice(0, 8)}…${t.slice(-4)}`;
}

export function WechatAccountLibraryPage({
  accounts,
  activeAccountId,
  isUploadingCover,
  onSelectAccount,
  onAddAccount,
  onEditAccount,
  onRemoveAccount,
  onPickCover,
  membership,
}: Props) {
  const [viewAccount, setViewAccount] = useState<WechatAccount | null>(null);

  const openEdit = (account: WechatAccount, event?: MouseEvent) => {
    event?.stopPropagation();
    onEditAccount(account);
  };

  const handleCardClick = (account: WechatAccount) => {
    onSelectAccount(account.id);
  };

  return (
    <div className="prompt-library-wrap">
      <div className="ui-card prompt-library-toolbar">
        <div className="prompt-library-toolbar-text">
          <div className="card-title">
            公众号
            <span style={{ fontSize: 13, fontWeight: 500, color: "#64748b", marginLeft: 10, opacity: 0.8 }}>
              ({accounts.length} / {membership?.isActive && membership.plan.code === "monthly_990" ? "∞" : 
                (membership?.isActive ? (membership.plan.code === "monthly_599" ? 10 : (membership.plan.code === "monthly_399" ? 5 : 2)) : 1)})
            </span>
          </div>
          <div className="helper-text">管理发送草稿、上传封面使用的公众号；在工作台创作设置中可快速切换。</div>
        </div>
        <div className="prompt-library-toolbar-actions">
          <Button
            type="primary"
            onClick={() => {
              const planCode = membership?.isActive ? membership.plan.code : null;
              let limit = 1;
              if (planCode === "monthly_99") limit = 2;
              else if (planCode === "monthly_399") limit = 5;
              else if (planCode === "monthly_599") limit = 10;
              else if (planCode === "monthly_990") limit = Infinity;
              else if (planCode === "monthly_199") limit = 2;

              if (accounts.length >= limit) {
                Modal.warning({
                  title: "账号数量已达上限",
                  content: `您当前的套餐最多允许绑定 ${limit} 个公众号账号。如需添加更多，请前往「会员中心」升级套餐。`,
                  okText: "我知道了",
                });
                return;
              }
              onAddAccount();
            }}
            icon={<PlusOutlined />}
          >
            新增公众号
          </Button>
        </div>
      </div>

      {accounts.length === 0 ? (
        <div className="prompt-library-empty">
          <div className="prompt-library-empty-icon-wrap">
            <MessageOutlined className="prompt-library-empty-icon" aria-hidden />
          </div>
          <div className="prompt-library-empty-title">暂无公众号</div>
          <p className="prompt-library-empty-desc">点击「新增公众号」添加配置后，即可在工作台选择并发送到草稿箱。</p>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              const planCode = membership?.isActive ? membership.plan.code : null;
              let limit = 1;
              if (planCode === "monthly_99") limit = 2;
              else if (planCode === "monthly_399") limit = 5;
              else if (planCode === "monthly_599") limit = 10;
              else if (planCode === "monthly_990") limit = Infinity;
              else if (planCode === "monthly_199") limit = 2;

              if (accounts.length >= limit) {
                Modal.warning({
                  title: "账号数量已达上限",
                  content: `您当前的套餐最多允许绑定 ${limit} 个公众号账号。如需添加更多，请前往「会员中心」升级套餐。`,
                  okText: "我知道了",
                });
                return;
              }
              onAddAccount();
            }}
          >
            新增公众号
          </Button>
        </div>
      ) : (
        <div className="prompt-card-grid">
          {accounts.map((account) => (
            <div
              key={account.id}
              role="button"
              tabIndex={0}
              className={`prompt-library-card${account.id === activeAccountId ? " wechat-account-card-active" : ""}`}
              onClick={() => handleCardClick(account)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleCardClick(account);
                }
              }}
            >
              <div className="prompt-library-card-body">
                <div className="prompt-library-card-title">{account.name}</div>
                <div className="prompt-library-card-meta-row">
                  <span className="account-mono">{maskAppId(account.appId)}</span>
                  <span className="prompt-library-card-meta-dot" aria-hidden />
                  <span>{account.appSecret.trim() ? "Secret 已填" : "Secret 未填"}</span>
                  <span className="prompt-library-card-meta-dot" aria-hidden />
                  <span>{account.thumbMediaId.trim() ? "封面已配置" : "封面未配置"}</span>
                </div>
                {account.id === activeAccountId ? (
                  <div className="wechat-account-active-pill">当前使用</div>
                ) : null}
              </div>

              <div className="prompt-library-card-footer" onClick={(e) => e.stopPropagation()}>
                <button type="button" className="prompt-library-card-view" onClick={() => setViewAccount(account)}>
                  <EyeOutlined />
                  查看
                </button>
                <button
                  type="button"
                  className="prompt-library-card-view"
                  onClick={() => onPickCover(account.id)}
                  disabled={isUploadingCover}
                >
                  <CloudUploadOutlined />
                  {isUploadingCover ? "上传中…" : "封面"}
                </button>
                <div className="prompt-library-card-icon-actions">
                  <button
                    type="button"
                    className="prompt-library-card-icon-btn"
                    title="编辑"
                    aria-label="编辑"
                    onClick={(e) => openEdit(account, e)}
                  >
                    <EditOutlined />
                  </button>
                  <Popconfirm
                    title="删除公众号"
                    description="确定删除该公众号配置吗？"
                    onConfirm={() => onRemoveAccount(account)}
                    okText="删除"
                    cancelText="取消"
                  >
                    <button type="button" className="prompt-library-card-icon-btn danger" title="删除" aria-label="删除">
                      <DeleteOutlined />
                    </button>
                  </Popconfirm>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        title={viewAccount ? `查看：${viewAccount.name}` : "查看"}
        open={!!viewAccount}
        onCancel={() => setViewAccount(null)}
        footer={
          <Button type="primary" onClick={() => setViewAccount(null)}>
            关闭
          </Button>
        }
        width={560}
        destroyOnHidden
      >
        {viewAccount ? (
          <div className="wechat-account-view-modal">
            <Paragraph>
              <strong>账号名称</strong>
              <br />
              {viewAccount.name}
            </Paragraph>
            <Paragraph copyable={{ text: viewAccount.appId }}>
              <strong>AppID</strong>
              <br />
              <span className="account-mono">{viewAccount.appId || "—"}</span>
            </Paragraph>
            <Paragraph>
              <strong>Secret</strong>
              <br />
              {viewAccount.appSecret.trim() ? "已填写（出于安全不在此展示全文）" : "未填写"}
            </Paragraph>
            <Paragraph copyable={{ text: viewAccount.thumbMediaId }}>
              <strong>封面 thumb_media_id</strong>
              <br />
              <span className="account-mono">{viewAccount.thumbMediaId || "—"}</span>
            </Paragraph>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
