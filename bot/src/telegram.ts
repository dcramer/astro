const TELEGRAM_API = "https://api.telegram.org";

export interface TelegramResponse {
  ok: boolean;
  result?: unknown;
  description?: string;
}

export async function sendMessage(
  botToken: string,
  chatId: string,
  text: string,
  parseMode: "MarkdownV2" | "HTML" = "MarkdownV2"
): Promise<TelegramResponse> {
  const response = await fetch(
    `${TELEGRAM_API}/bot${botToken}/sendMessage`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: parseMode,
        disable_web_page_preview: true,
      }),
    }
  );

  return response.json();
}

export async function sendPhoto(
  botToken: string,
  chatId: string,
  photoUrl: string,
  caption?: string
): Promise<TelegramResponse> {
  const response = await fetch(
    `${TELEGRAM_API}/bot${botToken}/sendPhoto`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        photo: photoUrl,
        caption,
      }),
    }
  );

  return response.json();
}

export function getClearOutsideImageUrl(lat: number, lon: number): string {
  // Round to 2 decimal places as Clear Outside expects
  const latRounded = lat.toFixed(2);
  const lonRounded = lon.toFixed(2);
  return `https://clearoutside.com/forecast_image_large/${latRounded}/${lonRounded}/forecast.png`;
}

export function getClearOutsideUrl(lat: number, lon: number): string {
  const latRounded = lat.toFixed(2);
  const lonRounded = lon.toFixed(2);
  return `https://clearoutside.com/forecast/${latRounded}/${lonRounded}`;
}

export function getAstrosphericUrl(lat: number, lon: number): string {
  return `https://www.astrospheric.com/?Lat=${lat}&Lon=${lon}`;
}
