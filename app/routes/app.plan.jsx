import PageHeader from "../components/PageHeader";
import { CreditCardIcon } from "@shopify/polaris-icons";
import { useLoaderData, useSubmit, useNavigation, useActionData } from "react-router";
import { authenticate } from "../shopify.server";
import {
  getBillingState,
  managedPricingUrl,
  appBridgeRedirect,
  cancelSubscription,
} from "../billing.server";
import { getUsage } from "../usage.server";
import { PLAN_TIERS } from "../planCatalog";
import { Page, Layout, BlockStack, Banner } from "@shopify/polaris";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { Facets, Ring } from "../components/Brand";

// Human labels for the entitlement flags, shown as the current plan's inclusions.
const FEATURE_LABELS = {
  optimize: "WebP compression",
  altText: "Alt Writer (AI alt text)",
  autoOptimize: "Autopilot for new products",
  pageSpeed: "Speed Lab reports",
};

export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);

  let state = { hasActivePlan: false, plan: null, appHandle: undefined };
  try {
    state = await getBillingState(admin, session.shop);
  } catch (e) {
    if (e instanceof Response) throw e;
  }

  let usage = { imagesUsed: 0 };
  try { usage = await getUsage(session.shop); } catch { /* table not ready */ }

  const plan = state.plan || { name: "Free", tier: "free", monthlyImages: 100, features: {} };
  const included = Object.keys(FEATURE_LABELS).filter((k) => plan.features?.[k]);

  return {
    hasActivePlan: state.hasActivePlan,
    planName: plan.name,
    tier: plan.tier,
    monthlyImages: plan.monthlyImages,
    included,
    imagesUsed: usage.imagesUsed || 0,
    // Direct top-frame link target for the Change/Choose-plan CTA.
    pricingUrl: managedPricingUrl(session.shop, state.appHandle),
  };
};

export const action = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const formData = await request.formData();
  const actionType = formData.get("actionType");

  const state = await getBillingState(admin);
  const pricingUrl = managedPricingUrl(session.shop, state.appHandle);

  // Cancel: try the in-app cancel mutation first; if managed pricing blocks it,
  // fall back to the hosted page to cancel manually.
  if (actionType === "cancel") {
    const sub = state.activeSubscription;
    if (!sub) return { cancelled: true };
    try {
      await cancelSubscription(admin, sub.id);
      return { cancelled: true };
    } catch (e) {
      console.error("[BILLING] in-app cancel failed, redirecting:", e?.message);
      throw appBridgeRedirect(pricingUrl);
    }
  }

  return null;
};

export default function PlanPage() {
  const { hasActivePlan, planName, monthlyImages, included, imagesUsed, pricingUrl } = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();
  const submit = useSubmit();
  const isBusy = navigation.state !== "idle";

  const post = (actionType) => {
    const fd = new FormData();
    fd.append("actionType", actionType);
    submit(fd, { method: "post" });
  };

  const quota = monthlyImages || 0;
  const used = imagesUsed || 0;
  const pct = quota > 0 ? Math.min(100, Math.round((used / quota) * 100)) : 0;
  const fmt = (n) => Number(n).toLocaleString();
  const currentIdx = PLAN_TIERS.findIndex((t) => t.name === planName);

  return (
    <Page>
      <Layout>
        <Layout.Section>
          <PageHeader icon={CreditCardIcon} eyebrow="Your account" title="Plan & credits" subtitle="What you're on, how many credits you've used, and what's unlocked" />
        </Layout.Section>

        {actionData?.cancelled && !hasActivePlan && (
          <Layout.Section>
            <Banner title="Plan cancelled" tone="info">
              Your subscription has ended. Pick a plan whenever you&apos;re ready for more credits.
            </Banner>
          </Layout.Section>
        )}

        <Layout.Section>
          <BlockStack gap="400">
            <div className="lm-plan">
              <div className="lm-plan-hero">
                <Facets />
                <p className="lm-plan-label">{hasActivePlan ? "Active plan" : "Current plan"}</p>
                <p className="lm-plan-name">{planName}</p>
                <p className="lm-plan-sub">{`${fmt(quota)} compression credits every month`}</p>
                <div className="lm-actions">
                  <a className="lm-btn lm-btn-white" href={pricingUrl} target="_top">
                    {hasActivePlan ? "Switch plan" : "Pick a plan"}
                  </a>
                  {hasActivePlan && (
                    <button type="button" className="lm-btn lm-btn-glass" disabled={isBusy} onClick={() => post("cancel")}>
                      {isBusy ? "Cancelling…" : "Cancel plan"}
                    </button>
                  )}
                </div>
              </div>
              <div className="lm-plan-usage">
                <Ring pct={pct} size={132} label={`${pct}% of monthly credits used`}>
                  <strong>{`${pct}%`}</strong>
                  <span>used</span>
                </Ring>
                <div>
                  <p className="lm-plan-usage-big">{fmt(used)}<span>{` / ${fmt(quota)}`}</span></p>
                  <p className="lm-plan-usage-note">credits used this month · resets on the 1st</p>
                </div>
              </div>
            </div>

            <div className="lm-card">
              <h2 className="lm-card-title">Unlocked on your plan</h2>
              <div className="lm-features">
                {Object.entries(FEATURE_LABELS).map(([k, label]) => {
                  const on = included.includes(k);
                  return (
                    <div key={k} className={`lm-feature${on ? "" : " is-locked"}`}>
                      <span className="lm-feature-mark" aria-hidden="true">{on ? "✓" : "–"}</span>
                      <span>{label}</span>
                      {!on && <span className="lm-feature-tag">Locked</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="lm-card">
              <h2 className="lm-card-title">Compare plans</h2>
              <div className="lm-tiers">
                {PLAN_TIERS.map((t, i) => (
                  <div key={t.name} className={`lm-tier${i === currentIdx ? " is-current" : ""}`}>
                    {i === currentIdx && <span className="lm-tier-flag">Current</span>}
                    <p className="lm-tier-name">{t.name}</p>
                    <p className="lm-tier-price">{`$${t.price}`}<span>/mo</span></p>
                    <p className="lm-tier-meta">{`${t.images} credits / month`}</p>
                  </div>
                ))}
              </div>
              <p className="lm-note">
                Billing is handled by Shopify and appears on your Shopify invoice. Plan changes show up
                here automatically.
              </p>
            </div>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
