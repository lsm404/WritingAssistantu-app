import { Button, Popconfirm, Space } from "antd";
import { CloudUploadOutlined, DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import type { WechatAccount } from "../../lib/types";

type Props = {
  activeAccount?: WechatAccount;
  isUploadingCover: boolean;
  onAddAccount: () => void;
  onEditAccount: () => void;
  onRemoveAccount: () => void;
  onPickCover: () => void;
};

function readValue(value?: string) {
  return value?.trim() ? value : "未配置";
}

export function AccountPage({
  activeAccount,
  isUploadingCover,
  onAddAccount,
  onEditAccount,
  onRemoveAccount,
  onPickCover,
}: Props) {
  return (
    <div className="single-panel-wrap">
      <div className="ui-card single-panel-card">
        <div className="page-section-head">
          <div>
            <div className="card-title">公众号账号</div>
            <div className="helper-text">管理当前桌面端保存的公众号配置。</div>
          </div>
          <Space size={8}>
            <Button icon={<PlusOutlined />} onClick={onAddAccount}>
              新增账号
            </Button>
            <Button icon={<EditOutlined />} onClick={onEditAccount}>
              编辑账号
            </Button>
            <Popconfirm
              title="删除当前账号？"
              description="只会删除本地保存的数据。"
              onConfirm={onRemoveAccount}
              okText="删除"
              cancelText="取消"
            >
              <Button danger icon={<DeleteOutlined />}>
                删除账号
              </Button>
            </Popconfirm>
          </Space>
        </div>

        <div className="account-detail-grid">
          <div className="account-detail-item">
            <span className="account-detail-label">账号名称</span>
            <span className="account-detail-value">{readValue(activeAccount?.name)}</span>
          </div>
          <div className="account-detail-item">
            <span className="account-detail-label">公众号 AppID</span>
            <span className="account-detail-value account-mono">{readValue(activeAccount?.appId)}</span>
          </div>
          <div className="account-detail-item">
            <span className="account-detail-label">公众号 Secret</span>
            <span className="account-detail-value account-mono">{activeAccount?.appSecret ? "已填写" : "未配置"}</span>
          </div>
          <div className="account-detail-item">
            <div className="form-item-row">
              <span className="account-detail-label">封面图 thumb_media_id</span>
              <Button
                size="small"
                icon={<CloudUploadOutlined />}
                onClick={onPickCover}
                loading={isUploadingCover}
              >
                上传封面
              </Button>
            </div>
            <span className="account-detail-value account-mono">{readValue(activeAccount?.thumbMediaId)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
