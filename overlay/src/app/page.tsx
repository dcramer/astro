import OverlayDisplay from "./overlay-display";

import { getNinaBaseUrl } from "@nina/config";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function Page() {
  const baseUrl = getNinaBaseUrl();

  return (
    <OverlayDisplay baseUrl={baseUrl} />
  );
}
