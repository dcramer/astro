import OverlayDisplay from "./overlay-display";

import {
  getNinaBaseUrl,
  getTelescopeStreamOverlayConfig,
} from "@nina/config";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function Page() {
  const baseUrl = getNinaBaseUrl();
  const telescopeStream = getTelescopeStreamOverlayConfig();

  return (
    <OverlayDisplay
      baseUrl={baseUrl}
      pollMs={5000}
      telescopeStream={telescopeStream}
    />
  );
}
