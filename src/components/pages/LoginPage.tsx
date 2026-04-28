import { LockOutlined, MailOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import { Button, Input, Segmented } from "antd";

type AuthMode = "login" | "register";

type Props = {
  mode: AuthMode;
  loading: boolean;
  form: {
    email: string;
    password: string;
    displayName: string;
  };
  onModeChange: (mode: AuthMode) => void;
  onFieldChange: (key: "email" | "password" | "displayName", value: string) => void;
  onSubmit: () => void;
};

export function LoginPage({ mode, loading, form, onModeChange, onFieldChange, onSubmit }: Props) {
  return (
    <div className="auth-shell">
      <div className="auth-hero">
        <div className="auth-hero-badge">OpenClaw Workspace</div>
        <h1>把创作、会员和桌面工作流放在同一个入口里。</h1>
        <p>
          登录后即可在客户端里直接查看会员状态，继续使用创作台、发送草稿和维护你的公众号配置。
        </p>

        <div className="auth-feature-grid">
          <div className="auth-feature-card">
            <SafetyCertificateOutlined />
            <div>
              <strong>统一账号</strong>
              <span>登录后自动识别会员状态与身份</span>
            </div>
          </div>
          <div className="auth-feature-card">
            <LockOutlined />
            <div>
              <strong>会员直达</strong>
              <span>会员套餐可直接在客户端内开通和管理</span>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-panel">
        <div className="auth-card">
          <div className="auth-card-top">
            <div className="auth-title-block">
              <span className="auth-kicker">Secure Access</span>
              <h2>{mode === "login" ? "欢迎回来" : "创建你的账号"}</h2>
              <p>{mode === "login" ? "继续进入你的创作工作台。" : "先注册，再按自己的创作频率选择套餐。"}</p>
            </div>
            <Segmented
              value={mode}
              options={[
                { label: "登录", value: "login" },
                { label: "注册", value: "register" },
              ]}
              onChange={(value) => onModeChange(value as AuthMode)}
            />
          </div>

          <div className="auth-form">
            {mode === "register" ? (
              <label className="auth-field">
                <span>昵称</span>
                <Input
                  value={form.displayName}
                  onChange={(event) => onFieldChange("displayName", event.target.value)}
                  placeholder="例如：小林"
                />
              </label>
            ) : null}

            <label className="auth-field">
              <span>邮箱</span>
              <Input
                prefix={<MailOutlined />}
                value={form.email}
                onChange={(event) => onFieldChange("email", event.target.value)}
                placeholder="name@example.com"
              />
            </label>

            <label className="auth-field">
              <span>密码</span>
              <Input.Password
                prefix={<LockOutlined />}
                value={form.password}
                onChange={(event) => onFieldChange("password", event.target.value)}
                placeholder="至少 6 位"
                onPressEnter={onSubmit}
              />
            </label>

            <Button type="primary" size="large" block loading={loading} onClick={onSubmit}>
              {mode === "login" ? "登录并进入工作台" : "注册并继续"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
