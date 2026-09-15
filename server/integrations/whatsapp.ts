import type { WhatsappSession } from "../../drizzle/schema";

function baseUrl(session: WhatsappSession) {
  return (session.apiBaseUrl || "").replace(/\/$/, "");
}

async function requestJson(url: string, token: string, init: RequestInit = {}) {
  const response = await fetch(url, {
    ...init,
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      apikey: token,
      token,
      ...(init.headers || {}),
    },
  });
  const body = await response.text();
  let parsed: any = body;
  try { parsed = body ? JSON.parse(body) : {}; } catch {}
  if (!response.ok) {
    throw new Error(`Gateway WhatsApp respondeu ${response.status}: ${typeof parsed === "string" ? parsed : JSON.stringify(parsed)}`);
  }
  return parsed;
}

export async function getWhatsAppQrCode(session: WhatsappSession): Promise<string> {
  if (!session.apiBaseUrl || !session.apiToken || !session.externalInstanceId) {
    throw new Error("Gateway WhatsApp incompleto: informe URL, token e instância.");
  }
  if (session.provider === "zapi") {
    const result = await requestJson(`${baseUrl(session)}/instances/${encodeURIComponent(session.externalInstanceId)}/token/${encodeURIComponent(session.apiToken)}/qr-code`, session.apiToken);
    return result.value || result.qrcode || result.base64 || result.image || result.url;
  }
  const result = await requestJson(`${baseUrl(session)}/instance/connect/${encodeURIComponent(session.externalInstanceId)}`, session.apiToken);
  return result.base64 || result.qrcode?.base64 || result.code || result.qr;
}

export async function getWhatsAppConnectionState(session: WhatsappSession): Promise<"connected" | "connecting" | "disconnected"> {
  if (!session.apiBaseUrl || !session.apiToken || !session.externalInstanceId) throw new Error("Gateway WhatsApp incompleto.");
  if (session.provider === "zapi") {
    const result = await requestJson(`${baseUrl(session)}/instances/${encodeURIComponent(session.externalInstanceId)}/token/${encodeURIComponent(session.apiToken)}/status`, session.apiToken);
    return result.connected === true || result.status === "connected" ? "connected" : "disconnected";
  }
  const result = await requestJson(`${baseUrl(session)}/instance/connectionState/${encodeURIComponent(session.externalInstanceId)}`, session.apiToken);
  const state = String(result.instance?.state || result.state || result.status || "").toLowerCase();
  if (["open", "connected", "online"].includes(state)) return "connected";
  if (["connecting", "pairing", "qr"].includes(state)) return "connecting";
  return "disconnected";
}

export async function sendWhatsAppText(session: WhatsappSession, phone: string, message: string) {
  if (!session.apiBaseUrl || !session.apiToken || !session.externalInstanceId) {
    throw new Error("Gateway WhatsApp incompleto: informe URL, token e instância.");
  }
  if (session.provider === "zapi") {
    return requestJson(`${baseUrl(session)}/instances/${encodeURIComponent(session.externalInstanceId)}/token/${encodeURIComponent(session.apiToken)}/send-text`, session.apiToken, {
      method: "POST",
      body: JSON.stringify({ phone: phone.replace(/\D/g, ""), message }),
    });
  }
  return requestJson(`${baseUrl(session)}/message/sendText/${encodeURIComponent(session.externalInstanceId)}`, session.apiToken, {
    method: "POST",
    body: JSON.stringify({ number: phone.replace(/\D/g, ""), text: message }),
  });
}

export async function disconnectWhatsApp(session: WhatsappSession) {
  if (!session.apiBaseUrl || !session.apiToken || !session.externalInstanceId) throw new Error("Gateway WhatsApp incompleto.");
  if (session.provider === "zapi") {
    return requestJson(`${baseUrl(session)}/instances/${encodeURIComponent(session.externalInstanceId)}/token/${encodeURIComponent(session.apiToken)}/disconnect`, session.apiToken, { method: "POST" });
  }
  return requestJson(`${baseUrl(session)}/instance/logout/${encodeURIComponent(session.externalInstanceId)}`, session.apiToken, { method: "DELETE" });
}

export function verifyWhatsAppWebhook(session: WhatsappSession, requestSecret?: string) {
  if (!session.webhookSecret) return true;
  return Boolean(requestSecret && requestSecret === session.webhookSecret);
}
