import React, { useState } from "react";
import { trpc } from "../lib/trpc";
import FlowLayout from "../components/FlowLayout";
import { Save, ShieldCheck, KeyRound } from "lucide-react";
import { toast } from "sonner";

const platforms = [
  { id: "shopee", name: "Shopee Afiliados", description: "Tag de afiliado e credenciais do seu App Shopee Open Platform." },
  { id: "amazon", name: "Amazon Creators API", description: "Store ID/tag e credenciais emitidas pelo Associates Central." },
  { id: "mercadolivre", name: "Mercado Livre Afiliados", description: "Tag de rastreio do seu programa de afiliados." },
  { id: "magalu", name: "Parceiro Magalu", description: "ID da sua loja ou código oficial de rastreamento." },
];

export default function IntegrationsPage() {
  const { data: integrations, refetch } = trpc.integrations.list.useQuery();
  const saveMutation = trpc.integrations.saveCredentials.useMutation();
  const [form, setForm] = useState<Record<string, { tag: string; key: string; secret: string; appId: string }>>({});
  const value = (id: string) => form[id] || { tag: "", key: "", secret: "", appId: "" };
  const update = (id: string, field: string, val: string) => setForm(prev => ({ ...prev, [id]: { ...value(id), [field]: val } }));
  const save = async (id: any) => {
    const current = value(id);
    if (!current.tag) return toast.error("Informe a tag de afiliado.");
    try { await saveMutation.mutateAsync({ marketplace: id, affiliateTag: current.tag, apiKey: current.key || undefined, apiSecret: current.secret || undefined, appId: current.appId || undefined }); await refetch(); toast.success("Integração salva no servidor."); setForm(prev => ({ ...prev, [id]: { ...current, key: "", secret: "" } })); }
    catch (e: any) { toast.error(e.message); }
  };
  return <FlowLayout activeItem="Integrações"><div className="max-w-4xl mx-auto space-y-6"><div><h1 className="text-2xl font-bold tracking-tight text-slate-900">Integrações oficiais</h1><p className="mt-1 text-sm text-slate-500">Preencha somente as plataformas que você usa. Nada é criado automaticamente e nenhuma credencial é exibida de volta ao navegador.</p></div><div className="space-y-4">{platforms.map((plat) => { const saved = integrations?.find((i: any) => i.marketplace === plat.id); const current = value(plat.id); return <div key={plat.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4"><div className="flex items-center justify-between"><div><h2 className="font-bold text-sm text-slate-900">{plat.name}</h2><p className="text-xs text-slate-500">{plat.description}</p></div>{saved?.isConnected && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200"><ShieldCheck className="inline h-3 w-3" /> Conectado</span>}</div><div className="grid grid-cols-1 md:grid-cols-2 gap-3"><label className="text-xs font-semibold text-slate-700">Tag / tracking ID<input value={current.tag || saved?.affiliateTag || ""} onChange={e => update(plat.id, "tag", e.target.value)} placeholder="Informe sua tag" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono" /></label><label className="text-xs font-semibold text-slate-700">App ID / Partner ID<input value={current.appId} onChange={e => update(plat.id, "appId", e.target.value)} placeholder="Opcional conforme a plataforma" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs" /></label><label className="text-xs font-semibold text-slate-700">API Key<input type="password" value={current.key} onChange={e => update(plat.id, "key", e.target.value)} placeholder={saved?.apiKey ? "Credencial salva; informe só para substituir" : "Cole a API Key"} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs" /></label><label className="text-xs font-semibold text-slate-700">API Secret<input type="password" value={current.secret} onChange={e => update(plat.id, "secret", e.target.value)} placeholder={saved?.apiSecret ? "Credencial salva; informe só para substituir" : "Cole o API Secret"} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs" /></label></div><button onClick={() => save(plat.id)} disabled={saveMutation.isPending} className="inline-flex items-center gap-2 rounded-lg bg-black px-3 py-2 text-xs font-semibold text-white"><KeyRound className="h-3.5 w-3.5" />Salvar credenciais</button></div>; })}</div></div></FlowLayout>;
}
