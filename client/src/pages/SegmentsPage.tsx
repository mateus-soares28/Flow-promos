import React, { useState } from "react";
import { trpc } from "../lib/trpc";
import FlowLayout from "../components/FlowLayout";
import { Layers, Plus, Tag, Sliders, Check } from "lucide-react";
import { toast } from "sonner";

export default function SegmentsPage() {
  const { data: segments, isLoading, refetch } = trpc.segments.list.useQuery();
  const createSegmentMutation = trpc.segments.create.useMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [keywords, setKeywords] = useState("");
  const [minDiscount, setMinDiscount] = useState(15);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createSegmentMutation.mutateAsync({
        name,
        keywords,
        minDiscountPercent: Number(minDiscount),
      });
      setIsModalOpen(false);
      setName("");
      setKeywords("");
      await refetch();
      toast.success("Segmento de nicho configurado!");
    } catch (e: any) {
      toast.error("Erro ao criar segmento: " + e.message);
    }
  };

  return (
    <FlowLayout activeItem="Segmentos">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Segmentos & Nichos de Ofertas
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Defina palavras-chave e regras para o sistema filtrar as melhores promoções para seu público.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Novo Segmento</span>
          </button>
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">Novo Segmento / Nicho</h2>
              <form onSubmit={handleCreate} className="mt-4 space-y-3">
                <div>
                  <label className="text-xs font-medium text-slate-700">Nome do Segmento</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Ferramentas & Marcenaria"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700">Palavras-chave (separadas por vírgula)</label>
                  <textarea
                    required
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="furadeira, serra, parafusadeira, trena, bosch, makita"
                    rows={3}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700">Desconto Mínimo Aceito (%)</label>
                  <input
                    type="number"
                    value={minDiscount}
                    onChange={(e) => setMinDiscount(Number(e.target.value))}
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
                    Salvar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {segments?.map((seg: any) => (
            <div
              key={seg.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">{seg.name}</span>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                  Min {seg.minDiscountPercent}% OFF
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                {seg.keywords}
              </p>
            </div>
          ))}
        </div>
      </div>
    </FlowLayout>
  );
}
