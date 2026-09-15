/**
 * Produtos e planos disponíveis no FlowPromos
 */
export interface FlowPlanDefinition {
  id: string;
  name: string;
  badge?: string;
  popular?: boolean;
  interval: "month" | "year";
  monthlyEquivalent: number;
  priceCents: number;
  savingsYear?: number;
  dailyLimitOffers: number;
  maxMarketplaces: number;
  marketplacesLabel: string;
  maxWhatsappGroups: number;
  maxTelegramChannels: number;
  qualityScoreMax: number;
  features: string[];
}

export const FLOW_PLANS: FlowPlanDefinition[] = [
  {
    id: "essential_annual",
    name: "Essencial",
    interval: "year",
    monthlyEquivalent: 19.90,
    priceCents: 23880,
    savingsYear: 205.20,
    dailyLimitOffers: 50,
    maxMarketplaces: 4,
    marketplacesLabel: "4 lojas (Amazon, Shopee, Magalu + 1)",
    maxWhatsappGroups: 1,
    maxTelegramChannels: 1,
    qualityScoreMax: 60,
    features: [
      "50 ofertas/dia",
      "4 lojas: Amazon, Shopee, Magalu + 1",
      "1 grupo WhatsApp com QR Code",
      "1 canal Telegram",
      "Score de qualidade até 60",
      "Formatação inteligente com links de afiliado",
      "Horários otimizados de envio",
      "Links curtos automáticos",
      "Garantia incondicional de 7 dias"
    ]
  },
  {
    id: "pro_annual",
    name: "Pro",
    badge: "MAIS POPULAR",
    popular: true,
    interval: "year",
    monthlyEquivalent: 49.90,
    priceCents: 59880,
    savingsYear: 565.20,
    dailyLimitOffers: 150,
    maxMarketplaces: 6,
    marketplacesLabel: "6 lojas (Amazon, Shopee, Magalu, Mercado Livre + 2)",
    maxWhatsappGroups: 5,
    maxTelegramChannels: 5,
    qualityScoreMax: 80,
    features: [
      "150 ofertas/dia",
      "6 lojas: Amazon, Shopee, Magalu, Mercado Livre + 2",
      "5 grupos WhatsApp com QR Code",
      "5 canais Telegram",
      "Score de qualidade até 80",
      "Priorizar lojas oficiais e vendedores verificados",
      "Filtros avançados por nicho e segmento",
      "Métricas de cliques e conversões",
      "Agendamento automático de disparos",
      "Templates customizados de alta conversão"
    ]
  },
  {
    id: "expert_annual",
    name: "Expert",
    badge: "MAIS COMPLETO",
    interval: "year",
    monthlyEquivalent: 99.90,
    priceCents: 119880,
    savingsYear: 1165.20,
    dailyLimitOffers: 9999,
    maxMarketplaces: 12,
    marketplacesLabel: "12 lojas (todas integradas)",
    maxWhatsappGroups: 10,
    maxTelegramChannels: 10,
    qualityScoreMax: 100,
    features: [
      "Sem limite fixo de ofertas diárias*",
      "12 lojas parceiras suportadas",
      "10 grupos WhatsApp com QR Code",
      "10 canais Telegram",
      "Score de qualidade até 100",
      "Todos os filtros de vendedor e anti-duplicação",
      "Disparos e ofertas manuais via painel",
      "Suporte VIP prioritário no WhatsApp",
      "Relatórios semanais de comissão"
    ]
  }
];
