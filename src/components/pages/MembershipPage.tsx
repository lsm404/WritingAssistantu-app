import { CheckCircleFilled, CrownFilled, ThunderboltFilled } from "@ant-design/icons";
import { Button, Tag } from "antd";
import type { MembershipPlan, UserMembership } from "../../lib/types";

type Props = {
  plans: MembershipPlan[];
  membership: UserMembership | null;
  loading: boolean;
  activePlanCode: string;
  onCheckout: (planCode: string) => void;
};

function formatDate(value: string | null) {
  if (!value) {
    return "长期有效";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function MembershipPage({ plans, membership, loading, activePlanCode, onCheckout }: Props) {
  return (
    <div className="single-panel-wrap">
      <div className="membership-layout">
        <section className="membership-hero">
          <div className="membership-hero-copy">
            <span className="membership-kicker">Membership Center</span>
            <h2>只保留两档会员，把选择做简单一点。</h2>
            <p>月付适合先用起来，终生适合长期稳定创作。开通后会直接绑定到你当前登录的账号。</p>
            <div className="membership-points">
              <div><CheckCircleFilled /> 登录后自动识别会员身份</div>
              <div><CheckCircleFilled /> 客户端内查看当前有效期</div>
              <div><CheckCircleFilled /> 开通后即时生效</div>
            </div>
          </div>

          <div className="membership-status-card">
            <div className="membership-status-top">
              <span>当前状态</span>
              <Tag color={membership?.isActive ? "success" : "default"}>
                {membership?.isActive ? "已激活" : "未开通"}
              </Tag>
            </div>
            <div className="membership-status-name">
              {membership?.isActive ? membership.plan.name : "普通用户"}
            </div>
            <div className="membership-status-meta">
              {membership?.isActive
                ? membership.plan.isLifetime
                  ? "终生权益已生效"
                  : `有效期至 ${formatDate(membership.endAt)}`
                : "开通后即可在当前账号下生效"}
            </div>
            <div className="membership-status-strip" />
          </div>
        </section>

        <section className="membership-plan-grid">
          {plans.map((plan) => {
            const isCurrent = membership?.isActive && membership.plan.code === plan.code;
            const isLifetimeLocked = Boolean(membership?.isActive && membership.plan.isLifetime);

            return (
              <article
                key={plan.id}
                className={`membership-plan-card${plan.isLifetime ? " featured" : ""}${isCurrent ? " current" : ""}`}
              >
                <div className="membership-plan-head">
                  <div>
                    <div className="membership-plan-icon">
                      {plan.isLifetime ? <CrownFilled /> : <ThunderboltFilled />}
                    </div>
                    <h3>{plan.name}</h3>
                    <p>{plan.isLifetime ? "一次开通，长期使用" : "轻量上手，按月续期"}</p>
                  </div>
                  {plan.isLifetime ? <span className="membership-badge">推荐长期使用</span> : null}
                </div>

                <div className="membership-price-row">
                  <span className="membership-price">¥ {plan.priceLabel}</span>
                  <span className="membership-price-note">{plan.isLifetime ? "终生买断" : "/ 月"}</span>
                </div>

                <div className="membership-benefit-list">
                  <div>统一账号体系，会员状态自动同步</div>
                  <div>客户端里直接查看当前会员信息</div>
                  <div>{plan.isLifetime ? "适合长期固定使用" : "适合先低成本开始"}</div>
                </div>

                <Button
                  type={plan.isLifetime ? "primary" : "default"}
                  size="large"
                  block
                  loading={loading && activePlanCode === plan.code}
                  disabled={isCurrent || isLifetimeLocked}
                  onClick={() => onCheckout(plan.code)}
                >
                  {isCurrent ? "当前已开通" : isLifetimeLocked ? "终生会员已生效" : "立即开通"}
                </Button>
              </article>
            );
          })}
        </section>
      </div>
    </div>
  );
}
