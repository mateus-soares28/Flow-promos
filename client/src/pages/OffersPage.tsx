import React, { useState } from "react";
import { trpc } from "../lib/trpc";
import FlowLayout from "../components/FlowLayout";
import {
  Tag,
  Send,
  Plus,
  ExternalLink,
  Percent,
  CheckCircle2,
  Sparkles,
  ShoppingBag,
  Eye,
} from "lucide-react";
import { toast } from "sonner";

export default function OffersPage() {
  const { data: offers, isLoading, refetch } = trpc.offers.list.useQuery();
  const dispatchMutation = trpc.offers.dispatchOfferNow.useMutation();
  const createOfferMutation = trpc.offers.createManualOffer.useMutation();
  const generateCopyMutation = trpc.offers.generateCopy.useMutation();
  const registerClickMutation = trpc.analytics.registerClick.useMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [originalUrl, setOriginalUrl] = useState("");
  const [marketplace, setMarketplace] = useState("shopee");
  const [originalPrice, setOriginalPrice] = useState(0);
  const [discountPrice, setDiscountPrice] = useState(0);
  const [coupon, setCoupon] = useState("");
  const [generatedCopy, setGeneratedCopy] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const discountPercent = originalPrice > 0 ? Math.max(0, Math.round(((originalPrice - discountPrice) / originalPrice) * 100)) : 0;
  const previewMessage = `🚨 *OFERTA IMPERDÍVEL:* ${title || "Título do produto"}\n💰 De R$ ${originalPrice.toFixed(2)} por *R$ ${discountPrice.toFixed(2)}* (${discountPercent}% OFF)\n${coupon ? `🏷️ Cupom: ${coupon}\n` : ""}🔗 Compre aqui: ${originalUrl || "https://seu-link-de-afiliado"}`;

  const handleGenerateCopy = async () => {
    if (!originalUrl) return toast.error("Informe o link do produto primeiro.");
    try {
      const result = await generateCopyMutation.mutateAsync({ productUrl: originalUrl, productTitle: title || undefined, marketplace });
      setGeneratedCopy(result.copy);
      toast.success("Texto persuasivo gerado pela IA.");
    } catch (e: any) {
      toast.error("Não foi possível gerar o texto: " + e.message);
    }
  };

  const handleDispatch = async (offerId: number) => {
    try {
      await dispatchMutation.mutateAsync({ offerId });
      await refetch();
      toast.success("Oferta enviada para os grupos de WhatsApp!");
    } catch (e: any) {
      toast.error("Erro ao enviar: " + e.message);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createOfferMutation.mutateAsync({
        title,
        originalUrl,
        marketplace,
        originalPriceCents: Math.round(originalPrice * 100),
        discountPriceCents: Math.round(discountPrice * 100),
        couponCode: coupon || undefined,
      });
      setIsModalOpen(false);
      setTitle("");
      setOriginalUrl("");
      setCoupon("");
      setGeneratedCopy("");
      await refetch();
      toast.success("Oferta cadastrada e pronta para disparo!");
    } catch (e: any) {
      toast.error("Erro ao cadastrar: " + e.message);
    }
  };

  return (
    <FlowLayout activeItem="Ofertas">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Ofertas Detectadas & Afiliados
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              O motor FlowPromos monitora as lojas e formata os links com suas tags de afiliado automaticamente.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Cadastrar Oferta Manual</span>
          </button>
        </div>

        {/* Modal de Nova Oferta */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">Cadastrar Nova Promoção</h2>
              <p className="text-xs text-slate-500 mt-1">
                Insira o link original do produto; a tag de afiliado será injetada automaticamente.
              </p>

              <form onSubmit={handleCreate} className="mt-4 space-y-3">
                <div>
                  <label className="text-xs font-medium text-slate-700">Título do Produto</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Fritadeira Elétrica Airfryer Philips Walita 4.1L"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:ring-2 focus:ring-black outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700">Link Original (URL)</label>
                  <input
                    type="url"
                    required
                    value={originalUrl}
                    onChange={(e) => setOriginalUrl(e.target.value)}
                    placeholder="https://shopee.com.br/product/..."
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:ring-2 focus:ring-black outline-hidden"
                  />
                </div>
                <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div><p className="text-xs font-bold text-indigo-900">Copiloto de vendas</p><p className="text-[11px] text-indigo-700">A IA analisa o link e cria uma mensagem sem inventar dados do produto.</p></div>
                    <button type="button" onClick={handleGenerateCopy} disabled={generateCopyMutation.isPending} className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-[11px] font-bold text-white hover:bg-indigo-700"><Sparkles className="h-3.5 w-3.5" />{generateCopyMutation.isPending ? "Gerando..." : "Gerar texto"}</button>
                  </div>
                  {generatedCopy && <textarea value={generatedCopy} onChange={(e) => setGeneratedCopy(e.target.value)} rows={5} className="mt-3 w-full rounded-lg border border-indigo-200 bg-white p-2.5 text-xs text-slate-700" placeholder="Texto gerado pela IA" />}
                </div>
                <button type="button" onClick={() => setShowPreview((value) => !value)} className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-bold text-emerald-800 hover:bg-emerald-100"><Eye className="h-3.5 w-3.5" />{showPreview ? "Ocultar prévia" : "Pré-visualizar no WhatsApp"}</button>
                {showPreview && <div className="rounded-2xl border border-emerald-100 bg-[#e5f7df] p-3 shadow-inner"><div className="mb-2 flex items-center gap-2 text-[10px] font-bold text-emerald-900"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white">W</span>Prévia da mensagem no WhatsApp</div><div className="ml-auto max-w-[92%] whitespace-pre-wrap rounded-xl rounded-tr-sm bg-[#dcf8c6] px-3 py-2.5 text-xs leading-5 text-slate-800 shadow-sm">{previewMessage}</div><p className="mt-2 text-[10px] text-emerald-700">A prévia usa exatamente o formato aplicado no disparo da oferta.</p></div>}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-700">Loja / Marketplace</label>
                    <select
                      value={marketplace}
                      onChange={(e) => setMarketplace(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                    >
                      <option value="shopee">Shopee</option>
                      <option value="amazon">Amazon</option>
                      <option value="mercadolivre">Mercado Livre</option>
                      <option value="magalu">Magalu</option>
                      <option value="aliexpress">AliExpress</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700">Cupom de Desconto (opcional)</label>
                    <input
                      type="text"
                      value={coupon}
                      onChange={(e) => setCoupon(e.target.value)}
                      placeholder="Ex: PROMO20"
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs uppercase"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-700">Preço De (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={originalPrice}
                      onChange={(e) => setOriginalPrice(Number(e.target.value))}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700">Preço Por (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={discountPrice}
                      onChange={(e) => setDiscountPrice(Number(e.target.value))}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-lg px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={createOfferMutation.isPending}
                    className="rounded-lg bg-black px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                  >
                    Salvar e Enfileirar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Cards de Ofertas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offers && offers.length > 0 ? (
            offers.map((offer: any) => (
              <div
                key={offer.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-slate-300 hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                      {offer.marketplace}
                    </span>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-bold text-emerald-700 text-[11px] border border-emerald-200">
                      Score {offer.qualityScore}/100
                    </span>
                  </div>

                  <h3 className="mt-3 text-sm font-bold text-slate-900 line-clamp-2">
                    {offer.title}
                  </h3>

                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-xs text-slate-400 line-through">
                      R$ {(offer.originalPriceCents / 100).toFixed(2)}
                    </span>
                    <span className="text-xl font-extrabold text-slate-900">
                      R$ {(offer.discountPriceCents / 100).toFixed(2)}
                    </span>
                    <span className="text-xs font-bold text-emerald-600">
                      -{offer.discountPercent}%
                    </span>
                  </div>

                  {offer.couponCode && (
                    <div className="mt-2 text-xs text-indigo-700 bg-indigo-50/50 p-2 rounded-lg font-mono font-semibold flex items-center justify-between">
                      <span>🏷️ Cupom:</span>
                      <span>{offer.couponCode}</span>
                    </div>
                  )}

                  <div className="mt-3 text-[11px] text-slate-500 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      <span>Tag de afiliado injetada</span>
                    </div>
                    {offer.isOfficialStore && (
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        <span>Loja Oficial Verificada</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <a
                    href={offer.affiliateUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => registerClickMutation.mutate({ offerId: offer.id })}
                    className="flex items-center gap-1 text-xs text-slate-500 hover:text-black font-medium"
                  >
                    <span>Ver Link</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>

                  <button
                    onClick={() => handleDispatch(offer.id)}
                    disabled={dispatchMutation.isPending}
                    className="flex items-center gap-1.5 rounded-xl bg-black px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition cursor-pointer"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Disparar Agora</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-400">
              Nenhuma oferta encontrada. Cadastre uma manualmente ou configure os segmentos.
            </div>
          )}
        </div>
      </div>
    </FlowLayout>
  );
}
