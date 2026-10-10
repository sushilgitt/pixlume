import { useNavigate, useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { getBillingStateCached } from "../billing.server";
import { getUsage } from "../usage.server";
import { entitled } from "../plans.server";
import db from "../db.server";
import { Page, Button, Badge, Icon } from "@shopify/polaris";
import {
  ImageMagicIcon,
  MagicIcon,
  AutomationIcon,
  GaugeIcon,
  ProductListIcon,
} from "@shopify/polaris-icons";
import { Facets, LogoMark, Ring } from "../components/Brand";

export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);

  let plan = null;
  try {
    plan = (await getBillingStateCached(admin, session.shop)).plan;
  } catch (e) {
    if (e instanceof Response) throw e; // let re-auth propagate
  }

  let usage = { imagesUsed: 0 };
  let autoOptimize = false;
  try {
    usage = await getUsage(session.shop);
    const settings = await db.shopSettings.findUnique({ where: { shop: session.shop } });
    autoOptimize = settings?.autoOptimize ?? false;
  } catch { /* usage/settings tables not ready — defaults */ }

  return {
    plan: {
      name: plan?.name || "Free",
      tier: plan?.tier || "free",
      monthlyImages: plan?.monthlyImages ?? 100,
      altText: entitled(plan, "altText"),
      pageSpeed: entitled(plan, "pageSpeed"),
      autoOptimizeAllowed: entitled(plan, "autoOptimize"),
    },
    usage,
    autoOptimize,
  };
};

const STEPS = [
  { icon: ProductListIcon, title: "Pick your products", desc: "Choose one product, a few, or your whole catalog." },
  { icon: ImageMagicIcon, title: "Click Compress", desc: "Photos become lean WebP files and are swapped in place." },
  { icon: GaugeIcon, title: "Enjoy a faster store", desc: "Lighter pages load quicker for every shopper." },
];

export default function Index() {
  const navigate = useNavigate();
  const { plan, usage, autoOptimize } = useLoaderData();

  const quota = plan.monthlyImages || 0;
  const used = usage?.imagesUsed || 0;
  const remaining = Math.max(0, quota - used);
  const pct = quota > 0 ? Math.min(100, Math.round((used / quota) * 100)) : 0;
  const fmt = (n) => Number(n).toLocaleString();

  const autoStatus = !plan.autoOptimizeAllowed
    ? { label: "Growth+", tone: "attention" }
    : autoOptimize
      ? { label: "On", tone: "success" }
      : { label: "Off", tone: undefined };

  const tools = [
    {
      icon: ImageMagicIcon,
      title: "Compress",
      desc: "Re-encode product photos as WebP and swap them in place. Same look, a fraction of the weight.",
      cta: "Start compressing",
      onClick: () => navigate("/app/optimize"),
      available: true,
    },
    {
      icon: MagicIcon,
      title: "Alt Writer",
      desc: "AI looks at each product photo and writes descriptive, search-friendly alt text.",
      cta: plan.altText ? "Write alt text" : "Unlock with Starter",
      onClick: () => navigate(plan.altText ? "/app/alt-text" : "/app/plan"),
      available: plan.altText,
      badge: plan.altText ? undefined : { label: "Starter+", tone: "attention" },
    },
    {
      icon: AutomationIcon,
      title: "Autopilot",
      desc: "New products are compressed automatically the moment they're created.",
      cta: plan.autoOptimizeAllowed ? "Configure" : "Unlock with Growth",
      onClick: () => navigate(plan.autoOptimizeAllowed ? "/app/optimize" : "/app/plan"),
      available: plan.autoOptimizeAllowed,
      badge: autoStatus,
    },
    {
      icon: GaugeIcon,
      title: "Speed Lab",
      desc: "Run live Lighthouse tests on product pages and see how much weight you've shed.",
      cta: plan.pageSpeed ? "Open Speed Lab" : "Unlock with Growth",
      onClick: () => navigate(plan.pageSpeed ? "/app/speed" : "/app/plan"),
      available: plan.pageSpeed,
      badge: plan.pageSpeed ? undefined : { label: "Growth+", tone: "attention" },
    },
  ];

  return (
    <Page>
      <section className="lm-hero">
        <Facets />
        <div className="lm-hero-copy">
          <p className="lm-hero-brand"><LogoMark size={30} bare />Pixlume</p>
          <h1>Lighter photos.<br />Faster store.</h1>
          <p className="lm-hero-sub">
            Compress product photos to WebP, add meaningful alt text, and measure how much
            quicker your storefront gets.
          </p>
          <div className="lm-actions">
            <button type="button" className="lm-btn lm-btn-white" onClick={() => navigate("/app/optimize")}>
              Compress images
            </button>
            <button type="button" className="lm-btn lm-btn-glass" onClick={() => navigate("/app/plan")}>
              View plan
            </button>
          </div>
        </div>

        <div className="lm-hero-card">
          <div className="lm-hero-card-head">
            <span>Credits this month</span>
            <Badge tone={plan.tier === "free" ? undefined : "success"}>{`${plan.name} plan`}</Badge>
          </div>
          <div className="lm-hero-card-body">
            <Ring pct={pct} size={124} label={`${pct}% of monthly credits used`}>
              <strong>{fmt(remaining)}</strong>
              <span>left</span>
            </Ring>
            <dl className="lm-facts">
              <div><dt>Used</dt><dd>{fmt(used)}</dd></div>
              <div><dt>Monthly credits</dt><dd>{fmt(quota)}</dd></div>
              <div><dt>Autopilot</dt><dd>{autoStatus.label}</dd></div>
            </dl>
          </div>
          <p className="lm-hero-card-foot">Credits reset on the 1st of every month</p>
        </div>
      </section>

      <h2 className="lm-section-title">How it works</h2>
      <ol className="lm-steps">
        {STEPS.map((s, i) => (
          <li key={s.title} className="lm-step">
            <span className="lm-step-num">{i + 1}</span>
            <span className="lm-step-icon"><Icon source={s.icon} /></span>
            <p className="lm-step-title">{s.title}</p>
            <p className="lm-step-desc">{s.desc}</p>
          </li>
        ))}
      </ol>

      <h2 className="lm-section-title">Your tools</h2>
      <div className="lm-tools">
        {tools.map((t) => (
          <div key={t.title} className={`lm-tool${t.available ? "" : " is-locked"}`}>
            <div className="lm-tool-head">
              <span className="lm-tool-icon"><Icon source={t.icon} /></span>
              {t.badge && <Badge tone={t.badge.tone}>{t.badge.label}</Badge>}
            </div>
            <p className="lm-tool-title">{t.title}</p>
            <p className="lm-tool-desc">{t.desc}</p>
            <Button variant={t.available ? "primary" : "secondary"} onClick={t.onClick} fullWidth>
              {t.cta}
            </Button>
          </div>
        ))}
      </div>
      <div style={{ height: 24 }} />
    </Page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
