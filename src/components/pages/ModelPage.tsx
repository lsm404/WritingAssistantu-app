import { Input, Switch } from "antd";
import type { GeneratePayload } from "../../lib/types";

type Props = {
  articleDraft: GeneratePayload;
  onArticleFieldChange: <K extends keyof GeneratePayload>(key: K, value: GeneratePayload[K]) => void;
};

export function ModelPage({ articleDraft, onArticleFieldChange }: Props) {
  return (
    <div className="single-panel-wrap">
      <div className="ui-card single-panel-card">
        <div className="page-section-head">
          <div>
            <div className="card-title">模型设置</div>
            <div className="helper-text">客户端直接连接豆包 API，需填写你自己的 API Key。</div>
          </div>
        </div>

        <div className="account-page-grid">
          <div className="form-item">
            <div className="form-item-label">API Key</div>
            <Input.Password
              value={articleDraft.apiKey}
              onChange={(event) => onArticleFieldChange("apiKey", event.target.value)}
              placeholder="必填，在火山引擎控制台获取"
            />
          </div>

          <div className="form-item">
            <div className="form-item-label">模型 ID</div>
            <Input
              value={articleDraft.apiModel}
              onChange={(event) => onArticleFieldChange("apiModel", event.target.value)}
              placeholder="例如：doubao-seed-2-0-pro-260215"
            />
          </div>

          <div className="model-switch-row">
            <div>
              <div className="form-item-label">默认开启联网生成</div>
              <div className="helper-text">工作台中的联网生成会按这里的默认值初始化。</div>
            </div>
            <Switch
              checked={Boolean(articleDraft.enableWebSearch)}
              onChange={(checked) => onArticleFieldChange("enableWebSearch", checked)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
