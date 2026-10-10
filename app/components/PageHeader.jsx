import { Icon } from "@shopify/polaris";
import { Facets } from "./Brand";

// Gradient banner shown at the top of each feature page. `aside` renders on the
// right (e.g. a credits pill or a primary action).
export default function PageHeader({ icon, eyebrow, title, subtitle, aside }) {
  return (
    <div className="lm-banner">
      <Facets />
      <span className="lm-banner-icon">
        <Icon source={icon} />
      </span>
      <div className="lm-banner-text">
        {eyebrow && <p className="lm-banner-eyebrow">{eyebrow}</p>}
        <h1 className="lm-banner-title">{title}</h1>
        {subtitle && <p className="lm-banner-sub">{subtitle}</p>}
      </div>
      {aside && <div className="lm-banner-aside">{aside}</div>}
    </div>
  );
}
