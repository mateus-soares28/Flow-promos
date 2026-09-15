import React from "react";
import FlowLayout from "../components/FlowLayout";
import { Radio, Play, Pause, ShieldCheck, Clock3 } from "lucide-react";
import { trpc } from "../lib/trpc";
import { toast } from "sonner";

export default function MonitoringPage() {
  const { data: job, refetch } = trpc.automation.get.useQuery();
  const { data: integrations } = trpc.integrations.list.useQuery();
  const enable = trpc.automation.enable.useMutation();
  const disable = trpc.automation.disable.useMutation();
  const { data: whatsapp } = trpc.whatsapp.getSession.useQuery();
  const run = async () => { try { await enable.mutateAsync({ cronExpression: "0 */15 * * * *" }); await refetch(); toast.success("Varredura periódica ativada após deploy público."); } catch (e: any) { toast.error(e.message); } };
  const stop = async () => { try { await disable.mutateAsync(); await refetch(); toast.success("Varredura periódica pausada."); } catch (e: any) { toast.error(e.message); } };
  const rows = [
    { name: "Gateway WhatsApp", status: whatsapp?.status === "connected" ? "Conectado" : "Não configurado", detail: whatsapp?.provider || "Configure em WhatsApp" },
    { name: "Integrações de afiliado", status: integrations?.filter((i: any) => i.isConnected).length ? "Configurado" : "Aguardando credenciais", detail: `${integrations?.filter((i: any) => i.isConnected).length || 0} plataforma(s)` },
    { name: "Varredura de promoções", status: job?.isEnabled ? "Ativa" : "Pausada", detail: job?.cronExpression || "Não agendada" },
  ];
  return <FlowLayout activeItem="Monitoramento"><div className="max-w-5xl mx-auto space-y-6"><div><h1 className="text-2xl font-bold tracking-tight text-slate-900">Monitoramento e automações</h1><p className="mt-1 text-sm text-slate-500">Acompanhe apenas conexões configuradas pelo usuário e controle a rotina periódica de busca.</p></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{rows.map((m) => <div key={m.name} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex items-center justify-between"><div className="flex items-center gap-3"><Radio className={`h-4 w-4 ${m.status === "Conectado" || m.status === "Ativa" || m.status === "Configurado" ? "text-emerald-500" : "text-slate-300"}`} /><div><span className="text-xs font-bold text-slate-800">{m.name}</span><p className="text-[11px] text-slate-400">{m.detail}</p></div></div><span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold border bg-slate-50 text-slate-600">{m.status}</span></div>)}</div><div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs"><div className="flex items-center justify-between"><div><h2 className="text-sm font-bold text-slate-900">Piloto automático</h2><p className="mt-1 text-xs text-slate-500">Executa a varredura a cada 15 minutos no Heartbeat. Não cria ofertas sem API oficial e credenciais válidas.</p></div>{job?.isEnabled ? <button onClick={stop} className="inline-flex items-center gap-2 rounded-xl border border-amber-200 px-4 py-2 text-xs font-semibold text-amber-700"><Pause className="h-4 w-4" />Pausar</button> : <button onClick={run} className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-xs font-semibold text-white"><Play className="h-4 w-4" />Ativar varredura</button>}</div><div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-500"><div className="rounded-xl bg-slate-50 p-3"><Clock3 className="h-4 w-4 mb-1" />Última execução: {job?.lastRunAt ? new Date(job.lastRunAt).toLocaleString("pt-BR") : "Ainda não executada"}</div><div className="rounded-xl bg-slate-50 p-3"><ShieldCheck className="h-4 w-4 mb-1" />Callback protegido pelo Heartbeat</div><div className="rounded-xl bg-slate-50 p-3">Próximo passo: faça o deploy para permitir callbacks públicos.</div></div></div></div></FlowLayout>;
}
