import React, { useState } from "react";
import { trpc } from "../lib/trpc";
import FlowLayout from "../components/FlowLayout";
import { Ticket, Plus, Tag, Copy } from "lucide-react";
import { toast } from "sonner";

export default function CouponsPage() {
  const { data: coupons, isLoading, refetch } = trpc.coupons.list.useQuery();
  const createCouponMutation = trpc.coupons.create.useMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [code, setCode] = useState("");
  const [marketplace, setMarketplace] = useState("shopee");
  const [description, setDescription] = useState("");
  const [discountLabel, setDiscountLabel] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCouponMutation.mutateAsync({
        code,
        marketplace,
        description,
        discountLabel,
      });
      setIsModalOpen(false);
      setCode("");
      setDescription("");
      setDiscountLabel("");
      await refetch();
      toast.success("Cupom adicionado ao banco de ofertas!");
    } catch (e: any) {
      toast.error("Erro ao salvar cupom: " + e.message);
    }
  };

  const handleCopy = (couponCode: string) => {
    navigator.clipboard.writeText(couponCode);
    toast.success(`Cupom ${couponCode} copiado!`);
  };

  return (
    <FlowLayout activeItem="Cupons">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Cupons Detectados & Cadastrados
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Cupons são incluídos automaticamente nas mensagens enviadas para os grupos de WhatsApp para aumentar a taxa de conversão.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Cadastrar Cupom</span>
          </button>
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">Novo Cupom de Desconto</h2>
              <form onSubmit={handleCreate} className="mt-4 space-y-3">
                <div>
                  <label className="text-xs font-medium text-slate-700">Código do Cupom</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="Ex: SHOPEE20OFF"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs uppercase font-mono"
                  />
                </div>
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
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700">Etiqueta de Desconto</label>
                  <input
                    type="text"
                    value={discountLabel}
                    onChange={(e) => setDiscountLabel(e.target.value)}
                    placeholder="Ex: R$ 20 OFF ou 15% OFF"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700">Regras / Descrição</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ex: Válido para compras acima de R$ 99"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-lg px-3 py-2 text-xs text-slate-600 hover:bg-slate-100"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-black px-4 py-2 text-xs font-semibold text-white"
                  >
                    Salvar Cupom
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {coupons?.map((cp: any) => (
            <div
              key={cp.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                    {cp.marketplace}
                  </span>
                  <span className="text-xs font-bold text-emerald-600">{cp.discountLabel}</span>
                </div>
                <div className="mt-3 flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="font-mono text-sm font-extrabold text-slate-900 tracking-wider">
                    {cp.code}
                  </span>
                  <button
                    onClick={() => handleCopy(cp.code)}
                    className="text-slate-400 hover:text-black cursor-pointer"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-3 text-xs text-slate-500">{cp.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </FlowLayout>
  );
}
