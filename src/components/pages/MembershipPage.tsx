import {
  CheckCircleFilled,
  CrownFilled,
  FireFilled,
  RocketFilled,
  StarFilled,
} from "@ant-design/icons";
import { Button, Tag } from "antd";
import type { MembershipPlan, UserMembership, UserQuotaSummary } from "../../lib/types";

type Props = {
  plans: MembershipPlan[];
  membership: UserMembership | null;
  quota: UserQuotaSummary | null;
  loading: boolean;
  activePlanCode: string;
  onCheckout: (planCode: string) => void;
};

type PlanPreset = {
  code: string;
  fallbackName: string;
  fallbackPriceLabel: string;
  icon: JSX.Element;
  accentClass: string;
  badge?: string;
  tagline: string;
  features: string[];
};

const planPresets: PlanPreset[] = [
  {
    code: "monthly_199",
    fallbackName: "基础月卡",
    fallbackPriceLabel: "19.90",
    icon: <FireFilled />,
    accentClass: "sun",
    tagline: "轻量起步，适合先把日常创作跑起来",
    features: ["每天 5 次文字创作", "每月 15 张图片额度", "图片额度用完后，文字仍可继续使用"],
  },
  {
    code: "monthly_399",
    fallbackName: "进阶月卡",
    fallbackPriceLabel: "39.90",
    icon: <RocketFilled />,
    accentClass: "sky",
    badge: "日常主力",
    tagline: "覆盖稳定更新频率，适合日常持续输出",
    features: ["每天 10 次文字创作", "每月 35 张图片额度", "更适合公众号日更和多主题更新"],
  },
  {
    code: "monthly_599",
    fallbackName: "专业月卡",
    fallbackPriceLabel: "59.90",
    icon: <StarFilled />,
    accentClass: "orange",
    tagline: "中高频创作更从容，效率和成本更平衡",
    features: ["每天 15 次文字创作", "每月 50 张图片额度", "适合专题策划和批量内容创作"],
  },
  {
    code: "monthly_990",
    fallbackName: "尊享月卡",
    fallbackPriceLabel: "99.00",
    icon: <CrownFilled />,
    accentClass: "purple",
    badge: "最受欢迎",
    tagline: "高频深度使用场景，给重度创作留足空间",
    features: ["每天 25 次文字创作", "每月 90 张图片额度", "更从容覆盖高频创作和多方向内容"],
  },
];

function formatDate(value: string | null) {
  if (!value) {
    return "长期有效";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getStatusText(membership: UserMembership | null, quotaSummary: UserQuotaSummary | null) {
  if (!membership?.isActive) {
    const textCycle = quotaSummary?.text.resetEveryDays ?? 3;
    const imageCycle = quotaSummary?.image.resetEveryDays ?? 7;
    const textLim = quotaSummary?.text.limit ?? 3;
    const imageLim = quotaSummary?.image.limit ?? 3;
    return `您正在使用免费版：每 ${textCycle} 天可享受 ${textLim} 次文章生成额度，每 ${imageCycle} 天可享受 ${imageLim} 张 AI 配图额度；两个周期分别计算，到期自动恢复。开通会员可获得更高额度，并按自然日 / 自然月计费。`;
  }

  if (membership.plan.isLifetime) {
    return "当前账号已开通长期会员权益，可持续使用完整会员能力。";
  }

  return `有效期至 ${formatDate(membership.endAt)}`;
}

function getDisplayPlans(plans: MembershipPlan[]) {
  const activePlans = plans.filter((plan) => plan.isActive);
  const planMap = new Map(activePlans.map((plan) => [plan.code, plan]));

  return planPresets.map((preset, index) => ({
    preset,
    plan: planMap.get(preset.code) ?? activePlans[index] ?? null,
  }));
}

export function MembershipPage({ plans, membership, quota, loading, activePlanCode, onCheckout }: Props) {
  const displayPlans = getDisplayPlans(plans);
  const currentPlanCode = membership?.isActive ? membership.plan.code : "";

  return (
    <div className="single-panel-wrap">
      <div className="membership-layout membership-layout-rich">
        <section className="membership-status-wrap">
          <div className="membership-status-card membership-status-card-rich">
            <div className="membership-status-main">
              <div className="membership-status-top">
                <span>当前状态</span>
                <Tag color={membership?.isActive ? "success" : "default"}>
                  {membership?.isActive ? "已激活" : "未开通"}
                </Tag>
              </div>
              <div className="membership-status-name">
                {membership?.isActive ? membership.plan.name : "普通用户"}
              </div>
              <div className="membership-status-meta">{getStatusText(membership, quota)}</div>
            </div>
            <div className="membership-status-tags">
              {membership?.isActive ? (
                <>
                  <span>每日文章生成</span>
                  <span>每月配图额度</span>
                  <span>会员权益即时生效</span>
                </>
              ) : (
                <>
                  <span>文章 · 每 {quota?.text.resetEveryDays ?? 3} 天重置</span>
                  <span>配图 · 每 {quota?.image.resetEveryDays ?? 7} 天重置</span>
                  <span>开通会员 · 解锁更高额度</span>
                </>
              )}
            </div>
            <div className="membership-status-strip" />
          </div>
        </section>

        <section className="membership-plan-grid membership-plan-grid-rich">
          {displayPlans.map(({ preset, plan }) => {
            const isCurrent = Boolean(plan && currentPlanCode === plan.code);
            const buttonType = preset.code === "monthly_990" ? "primary" : "default";

            return (
              <article
                key={preset.code}
                className={[
                  "membership-plan-card",
                  "membership-plan-card-rich",
                  `membership-plan-${preset.accentClass}`,
                  preset.badge ? "featured" : "",
                  isCurrent ? "current" : "",
                ].join(" ")}
              >
                {preset.badge ? <span className="membership-card-hot">{preset.badge}</span> : null}

                <div className="membership-plan-top">
                  <div className="membership-plan-icon">{preset.icon}</div>
                  <div className="membership-plan-title-block">
                    <h3>{plan?.name ?? preset.fallbackName}</h3>
                    <p>{preset.tagline}</p>
                  </div>
                </div>

                <div className="membership-price-block">
                  <div className="membership-price-main">
                    <span className="membership-price-value">{plan?.priceLabel ?? preset.fallbackPriceLabel}</span>
                    <span className="membership-price-unit">元</span>
                    <span className="membership-price-cycle">/月</span>
                  </div>
                </div>

                <div className="membership-benefit-list membership-benefit-list-rich">
                  {preset.features.map((feature) => (
                    <div key={feature}>
                      <CheckCircleFilled />
                      <span>{feature}</span>
                    </div>
                  ))}
                  <div>
                    <CheckCircleFilled />
                    <span>登录后自动识别会员状态，无需重复配置</span>
                  </div>
                </div>

                <Button
                  type={buttonType}
                  size="large"
                  className="membership-plan-action"
                  loading={loading && activePlanCode === plan?.code}
                  disabled={isCurrent}
                  onClick={() => plan && onCheckout(plan.code)}
                >
                  {isCurrent ? "当前套餐" : "咨询开通"}
                </Button>
              </article>
            );
          })}
        </section>
      </div>
    </div>
  );
}
