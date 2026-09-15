import crypto from "node:crypto";
import type { AffiliateIntegration } from "../../drizzle/schema";

export function convertAffiliateLink(originalUrl: string, integration: AffiliateIntegration) {
  const url = new URL(originalUrl);
  if (integration.marketplace === "amazon") { url.searchParams.set("tag", integration.affiliateTag); return url.toString(); }
  if (integration.marketplace === "shopee") { url.searchParams.set("utm_source", "affiliate"); url.searchParams.set("utm_campaign", integration.affiliateTag); return url.toString(); }
  url.searchParams.set("ref", integration.affiliateTag);
  return url.toString();
}

type MarketplacePromotion = { title: string; url: string; imageUrl?: string; priceCents?: number; originalPriceCents?: number; couponCode?: string };

async function amazonPromotions(integration: AffiliateIntegration, keyword: string): Promise<MarketplacePromotion[]> {
  if (!integration.apiKey || !integration.apiSecret || !integration.appId || !keyword.trim()) return [];
  const tokenResponse = await fetch("https://api.amazon.com/auth/o2/token", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ grant_type: "client_credentials", client_id: integration.appId, client_secret: integration.apiSecret, scope: "creatorsapi::default" }) });
  if (!tokenResponse.ok) throw new Error(`Amazon token request failed (${tokenResponse.status})`);
  const token = await tokenResponse.json() as { access_token?: string };
  if (!token.access_token) throw new Error("Amazon não retornou access_token.");
  const response = await fetch("https://creatorsapi.amazon/catalog/v1/searchItems", { method: "POST", headers: { Authorization: `Bearer ${token.access_token}`, "content-type": "application/json", "x-marketplace": "www.amazon.com.br" }, body: JSON.stringify({ keywords: keyword.trim(), marketplace: "www.amazon.com.br", partnerTag: integration.affiliateTag, itemCount: 10, resources: ["images.primary.large", "itemInfo.title", "offersV2.listings.price"] }) });
  if (!response.ok) throw new Error(`Amazon SearchItems failed (${response.status})`);
  const data = await response.json() as any;
  return (data?.searchResult?.items || []).flatMap((item: any) => {
    const title = item?.itemInfo?.title?.displayValue;
    const url = item?.detailPageURL;
    const price = item?.offersV2?.listings?.[0]?.price?.amount;
    if (!title || !url || typeof price !== "number") return [];
    return [{ title, url, imageUrl: item?.images?.primary?.large?.url, priceCents: Math.round(price * 100), originalPriceCents: Math.round(price * 100) }];
  });
}

async function shopeePromotions(integration: AffiliateIntegration, keyword: string): Promise<MarketplacePromotion[]> {
  if (!integration.apiKey || !integration.apiSecret || !integration.appId || !keyword.trim()) return [];
  const query = `query { productOfferV2(keyword: ${JSON.stringify(keyword.trim())}, limit: 20) { nodes { productName itemId shopId priceMin priceMax imageUrl productLink offerLink } } }`;
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = crypto.createHmac("sha256", integration.apiSecret).update(`${integration.appId}${timestamp}${query}`).digest("hex");
  const response = await fetch("https://open-api.affiliate.shopee.com.br/graphql", { method: "POST", headers: { "content-type": "application/json", Authorization: `SHA256 Credential=${integration.appId},Timestamp=${timestamp},Signature=${signature}` }, body: JSON.stringify({ query }) });
  if (!response.ok) throw new Error(`Shopee Affiliate API failed (${response.status})`);
  const data = await response.json() as any;
  if (data?.errors?.length) throw new Error(data.errors[0].message || "Shopee Affiliate API retornou erro.");
  return (data?.data?.productOfferV2?.nodes || []).flatMap((item: any) => {
    const title = item?.productName;
    const url = item?.offerLink || item?.productLink;
    const price = Number(item?.priceMin);
    if (!title || !url || !Number.isFinite(price)) return [];
    return [{ title, url, imageUrl: item?.imageUrl, priceCents: Math.round(price * 100), originalPriceCents: Math.round(price * 100) }];
  });
}

export async function fetchConfiguredPromotions(integration: AffiliateIntegration, keyword: string): Promise<MarketplacePromotion[]> {
  if (!integration.isConnected) return [];
  if (integration.marketplace === "amazon") return amazonPromotions(integration, keyword);
  if (integration.marketplace === "shopee") return shopeePromotions(integration, keyword);
  return [];
}
