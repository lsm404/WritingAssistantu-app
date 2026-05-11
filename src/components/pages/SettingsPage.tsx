import { Button, Typography, Space, Tag, Badge } from "antd";
import { 
  SyncOutlined,
} from "@ant-design/icons";
import type { RuntimeInfo } from "../../lib/types";
import { useState } from "react";

const { Title, Text } = Typography;

interface SettingsPageProps {
  runtimeInfo: RuntimeInfo | null;
  onCheckUpdate: () => Promise<void>;
}

export function SettingsPage({ runtimeInfo, onCheckUpdate }: SettingsPageProps) {
  const [checking, setChecking] = useState(false);

  const handleCheck = async () => {
    setChecking(true);
    try {
      await onCheckUpdate();
    } finally {
      setTimeout(() => setChecking(false), 800);
    }
  };

  return (
    <div className="page-container settings-page" style={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center',
      minHeight: '100%',
      backgroundColor: '#ffffff', // 纯白背景
      textAlign: 'center'
    }}>
      <div style={{ maxWidth: 500, width: '100%', padding: '40px 20px' }}>
        <Space direction="vertical" size={32} style={{ width: '100%', alignItems: 'center' }}>
          
          {/* Logo 部分 */}
          <div className="app-logo-container" style={{ 
            width: 100, 
            height: 100, 
            background: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)',
            borderRadius: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 16px 32px rgba(124, 58, 237, 0.2)'
          }}>
            <svg viewBox="0 0 32 32" width="56" height="56" fill="white">
              <path d="M16 2 C16 10 22 16 30 16 C22 16 16 22 16 30 C16 22 10 16 2 16 C10 16 16 10 16 2 Z" opacity="0.96" />
              <path d="M26 4 C26 7 28 9 31 9 C28 9 26 11 26 14 C26 11 24 9 21 9 C24 9 26 7 26 4 Z" opacity="0.75" />
              <path d="M7 23 C7 25 8.5 26.5 10.5 26.5 C8.5 26.5 7 28 7 30 C7 28 5.5 26.5 3.5 26.5 C5.5 26.5 7 25 7 23 Z" opacity="0.6" />
            </svg>
          </div>

          {/* 名称与简介 */}
          <div>
            <Title level={1} style={{ margin: '0 0 8px 0', fontSize: 32, fontWeight: 700 }}>写作助手</Title>
            <Text type="secondary" style={{ fontSize: 18, color: '#64748b' }}>让创作更简单，让灵感随处可见</Text>
          </div>

          {/* 版本展示 - 强制内容居中 */}
          <div style={{ 
            background: '#f8fafc', 
            padding: '12px 32px', 
            borderRadius: 16, 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px'
          }}>
            <Text type="secondary" style={{ fontSize: 15 }}>当前版本</Text>
            <Tag color="purple" style={{ borderRadius: 8, fontWeight: 800, padding: '2px 10px', fontSize: 15, margin: 0 }}>
              v{runtimeInfo?.version || '1.0.0'}
            </Tag>
            <Badge status="processing" text={<Text type="secondary" style={{ fontSize: 13, color: '#94a3b8' }}>Stable Build</Text>} />
          </div>

          {/* 检查更新按钮 */}
          <div style={{ marginTop: 8 }}>
            <Button 
              type="primary" 
              size="large"
              icon={<SyncOutlined spin={checking} />} 
              loading={checking}
              onClick={handleCheck}
              style={{ 
                borderRadius: 16, 
                height: 56, 
                padding: '0 40px',
                fontSize: 17,
                fontWeight: 700,
                background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                border: 'none',
                boxShadow: '0 12px 24px rgba(124, 58, 237, 0.3)',
                transition: 'all 0.3s ease'
              }}
            >
              立即检查更新
            </Button>
          </div>

        </Space>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .ant-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 16px 32px rgba(124, 58, 237, 0.4) !important;
        }
        .settings-page {
          animation: fadeIn 0.5s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
}
