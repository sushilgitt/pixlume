import { PLAN_TIERS } from "../planCatalog";
import { Facets, LogoMark } from "./Brand";

// Plan comparison for the standalone pricing page. Presentational only: every
// plan CTA is a real top-frame link (`target="_top"`) to Shopify's hosted
// managed-pricing page, where the actual price/cycle live and are picked. A
// direct anchor is used (rather than a form POST + reauthorize-header redirect)
// because a user click is a reliable user activation that can navigate the top
// frame out of the embedded iframe.
//
// Prices come from planCatalog.js and are display-only: the amount actually
// charged is set on the Partner Dashboard plans, so keep the two in sync.
export default function PricingTiers({ pricingUrl }) {
  return (
    <div className="lm-pricing">
      <Facets />
      <header className="lm-pricing-head">
        <p className="lm-hero-brand"><LogoMark size={30} bare />Pixlume</p>
        <h1>Pick the plan that fits your catalog</h1>
        <p>
          Lighter product photos, descriptive alt text and quicker pages. Start on Free and move up
          whenever you need more credits.
        </p>
      </header>

      <div className="lm-pricing-grid">
        {PLAN_TIERS.map((tier) => (
          <div key={tier.name} className={`lm-price${tier.popular ? " is-popular" : ""}`}>
            {tier.popular && <span className="lm-price-flag">Most popular</span>}
            <p className="lm-price-name">{tier.name}</p>
            <p className="lm-price-tag">{tier.tagline}</p>
            <p className="lm-price-amount">
              {`$${tier.price}`}<span>/month</span>
            </p>
            <p className="lm-price-annual">
              {tier.price === 0 ? "No card needed" : `or $${tier.priceAnnual} billed yearly`}
            </p>
            <a href={pricingUrl} target="_top" className="lm-btn lm-btn-primary lm-price-cta">
              {tier.price === 0 ? "Start on Free" : `Get ${tier.name}`}
            </a>
            <ul className="lm-price-features">
              {tier.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <p className="lm-pricing-foot">Charged through your Shopify bill · switch or cancel any time</p>
    </div>
  );
}
