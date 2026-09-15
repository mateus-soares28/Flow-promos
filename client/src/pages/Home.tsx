import React, { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line } from "recharts";
import { trpc } from "../lib/trpc";
import FlowLayout from "../components/FlowLayout";
import SalesPage from "./SalesPage";
import {
  MessageSquare,
  CreditCard,
  Activity,
  Layers,
  Users,
  Tag,
  CheckCircle2,
  Circle,
  ExternalLink,
  Zap,
  ArrowRight,
  ShieldCheck,
  Send,
  Sparkles,
  Wifi,
  Clock3,
} from "lucide-react";

export default function Home() {
  const [analyticsPeriod, setAnalyticsPeriod] = useState<"daily" | "weekly" | "monthly">("weekly");
  const { data: authUser, isLoading: authLoading } = trpc.auth.me.useQuery();
  const { data: stats, isLoading, refetch } = trpc.dashboard.getStats.useQuery(undefined, { enabled: Boolean(authUser) });
  const { data: analytics } = trpc.analytics.overview.useQuery({ period: analyticsPeriod }, { enabled: Boolean(authUser) });

  // Estados dos passos de onboarding (conforme layout de referência)
  const [completedSteps, setCompletedSteps] = useState<number[]>([0]);

  if (authLoading || authUser === undefined) {
    return <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]"><div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" aria-label="Carregando FlowPromos" /></div>;
  }
  if (!authUser) return <SalesPage />;

  const toggleStep = (stepIdx: number) => {
    setCompletedSteps((prev) =>
      prev.includes(stepIdx) ? prev.filter((i) => i !== stepIdx) : [...prev, stepIdx]
    );
  };

  const onboardingList = [
    {
      title: "Assista o tutorial completo",
      desc: "6 vídeos curtos sobre cada área do painel",
      link: "/tutorial",
    },
    {
      title: "Conecte seu WhatsApp",
      desc: "Leia o QR Code para ativar os disparos",
      link: "/whatsapp",
    },
    {
      title: "Conecte um marketplace",
      desc: "Mercado Livre, Amazon ou Shopee",
      link: "/integracoes",
    },
    {
      title: "Crie seu primeiro grupo de destino",
      desc: "Escolha o grupo que vai receber as ofertas",
      link: "/grupos",
    },
    {
      title: "Monte sua primeira busca por palavra-chave",
      desc: 'Ex: nicho "Ferramentas" + palavra "Furadeira"',
      link: "/segmentos",
    },
  ];

  const whatsappStatus = (stats?.whatsappStatus as "connected" | "connecting" | "disconnected") || "disconnected";
  const daysRemaining = stats?.daysRemaining ?? 0;
  const userName = authUser?.name || "seu painel";
  const whatsappStatusMeta = whatsappStatus === "connected"
    ? { label: "Conectado", helper: `Número: ${stats?.connectedPhone || "Número não informado"}`, color: "text-emerald-600", dot: "bg-emerald-500", icon: Wifi }
    : whatsappStatus === "connecting"
    ? { label: "Aguardando leitura do QR Code", helper: "Abra o WhatsApp e leia o código exibido", color: "text-amber-600", dot: "bg-amber-500 animate-pulse", icon: Clock3 }
    : { label: "Desconectado", helper: "Clique para abrir a conexão", color: "text-red-600", dot: "bg-red-500", icon: Circle };
  const WhatsappStatusIcon = whatsappStatusMeta.icon;

  return (
    <FlowLayout
      activeItem="Visão Geral"
      whatsappStatus={whatsappStatus}
      daysRemaining={daysRemaining}
    >
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Greeting */}
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Olá, {userName}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Aqui está o resumo da sua conta FlowPromos.
          </p>
        </div>

        {/* Top 3 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card WhatsApp */}
          <Link href="/whatsapp">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs hover:border-slate-300 hover:shadow-md transition cursor-pointer">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <MessageSquare className="h-4 w-4" />
                <span>WHATSAPP</span>
              </div>
              <div className="mt-3">
                <div className="flex items-center gap-2"><span className={`h-3 w-3 rounded-full ${whatsappStatusMeta.dot}`} /><span className={`text-xl font-extrabold tracking-tight ${whatsappStatusMeta.color}`}>{whatsappStatusMeta.label}</span><WhatsappStatusIcon className={`h-5 w-5 ${whatsappStatusMeta.color}`} /></div>
                <p className="mt-2 text-xs text-slate-400">{whatsappStatusMeta.helper}</p>
              </div>
            </div>
          </Link>

          {/* Card Plano Atual */}
          <Link href="/planos">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs hover:border-slate-300 hover:shadow-md transition cursor-pointer">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <CreditCard className="h-4 w-4" />
                <span>PLANO ATUAL</span>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-extrabold tracking-tight text-slate-900">
                  {stats?.planName || "Nenhum plano"}
                </span>
                <p className="mt-2 text-xs text-slate-500">
                  Status: <span className="text-slate-500 font-semibold">{stats?.planStatus || "Sem assinatura"}</span>
                </p>
              </div>
            </div>
          </Link>

          {/* Card Dias Restantes */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <Activity className="h-4 w-4" />
              <span>DIAS RESTANTES</span>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-extrabold tracking-tight text-slate-900">
                {daysRemaining}
              </span>
              <p className="mt-2 text-xs text-slate-500">
                {stats?.planExpiresAtFormatted ? `Vence em ${stats.planExpiresAtFormatted}` : "Nenhuma assinatura ativa"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-sm font-bold text-slate-900">Desempenho por marketplace</h2><p className="mt-1 text-xs text-slate-400">Cliques e conversões registrados pelas suas ofertas.</p></div><div className="flex items-center gap-3"><select value={analyticsPeriod} onChange={(e) => setAnalyticsPeriod(e.target.value as typeof analyticsPeriod)} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600"><option value="daily">Diário</option><option value="weekly">Semanal</option><option value="monthly">Mensal</option></select><Link href="/ofertas"><span className="text-xs font-semibold text-indigo-600">Ver ofertas →</span></Link></div></div>
            <div className="mt-5 h-56">{analytics?.marketplaces?.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={analytics.marketplaces}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" /><XAxis dataKey="marketplace" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis allowDecimals={false} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} /><Tooltip /><Bar dataKey="clicks" name="Cliques" fill="#111827" radius={[4, 4, 0, 0]} /><Bar dataKey="conversions" name="Conversões" fill="#10B981" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer> : <div className="h-full flex items-center justify-center rounded-xl bg-slate-50 text-xs text-slate-400">Os gráficos serão preenchidos após os primeiros cliques.</div>}</div>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs"><h2 className="text-sm font-bold text-slate-900">Comissões geradas</h2><p className="mt-1 text-xs text-slate-400">Por marketplace, conforme conversões confirmadas.</p><div className="mt-5 h-56">{analytics?.marketplaces?.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={analytics.marketplaces} layout="vertical"><CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" /><XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis type="category" dataKey="marketplace" width={72} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} /><Tooltip formatter={(value: number) => [`R$ ${(value / 100).toFixed(2)}`, "Comissão"]} /><Bar dataKey="commissionCents" name="Comissão" fill="#6366F1" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer> : <div className="h-full flex items-center justify-center rounded-xl bg-slate-50 text-xs text-slate-400">Nenhuma comissão confirmada.</div>}</div></div>
        </div>

        {/* Second Row 3 Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card Ofertas Detectadas */}
          <Link href="/ofertas">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs hover:border-slate-300 transition cursor-pointer">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <Tag className="h-4 w-4" />
                <span>OFERTAS DETECTADAS</span>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-extrabold tracking-tight text-slate-900">
                  {stats?.offersDetectedCount ?? 0}
                </span>
                <p className="mt-2 text-xs text-slate-400">Total no período</p>
              </div>
            </div>
          </Link>

          {/* Card Segmentos */}
          <Link href="/segmentos">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs hover:border-slate-300 transition cursor-pointer">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <Layers className="h-4 w-4" />
                <span>SEGMENTOS</span>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-extrabold tracking-tight text-slate-900">
                  {stats?.segmentsCount ?? 0}
                </span>
                <p className="mt-2 text-xs text-slate-400">Configurados</p>
              </div>
            </div>
          </Link>

          {/* Card Grupos */}
          <Link href="/grupos">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs hover:border-slate-300 transition cursor-pointer">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <Users className="h-4 w-4" />
                <span>GRUPOS</span>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-extrabold tracking-tight text-slate-900">
                  {stats?.groupsCount ?? 0}
                </span>
                <p className="mt-2 text-xs text-slate-400">Recebendo ofertas</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Bottom Two Columns: Primeiros Passos + Próximos Disparos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Box Primeiros Passos */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-7 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900">Primeiros passos</h2>
              <span className="text-xs font-semibold text-slate-400">
                {completedSteps.length} de {onboardingList.length} concluídos
              </span>
            </div>

            <div className="mt-5 space-y-4">
              {onboardingList.map((step, idx) => {
                const isDone = completedSteps.includes(idx);
                return (
                  <div
                    key={idx}
                    className="flex items-start gap-3.5 group p-2 rounded-xl hover:bg-slate-50 transition"
                  >
                    <button
                      onClick={() => toggleStep(idx)}
                      className="mt-0.5 text-slate-300 hover:text-emerald-500 cursor-pointer"
                    >
                      {isDone ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500 fill-emerald-50" />
                      ) : (
                        <Circle className="h-5 w-5 text-slate-300" />
                      )}
                    </button>
                    <div className="flex-1">
                      <Link href={step.link}>
                        <h3
                          className={`text-sm font-semibold cursor-pointer ${
                            isDone ? "text-slate-400 line-through" : "text-slate-800 hover:text-black"
                          }`}
                        >
                          {step.title}
                        </h3>
                      </Link>
                      <p className="text-xs text-slate-400 mt-0.5">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* CTA Conectar WhatsApp Button */}
            <div className="mt-6 pt-4 border-t border-slate-100">
              <Link href="/whatsapp">
                <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition cursor-pointer">
                  <MessageSquare className="h-4 w-4" />
                  <span>Conectar WhatsApp</span>
                </button>
              </Link>
            </div>
          </div>

          {/* Box Próximos Disparos */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-7 shadow-xs flex flex-col min-h-[380px]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900">Próximos disparos</h2>
              <Link href="/disparos">
                <span className="text-xs font-semibold text-slate-400 hover:text-slate-900 hover:underline cursor-pointer">
                  ver fila
                </span>
              </Link>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              {stats?.scheduledDispatches && stats.scheduledDispatches.length > 0 ? (
                <div className="w-full space-y-3 text-left">
                  {stats.scheduledDispatches.map((disp: any) => (
                    <div
                      key={disp.id}
                      className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs"
                    >
                      <div className="font-semibold text-slate-800 line-clamp-1">
                        {disp.formattedMessage}
                      </div>
                      <div className="mt-1 flex items-center justify-between text-slate-400 text-[11px]">
                        <span>Agendado para envio</span>
                        <span className="font-mono text-emerald-600">Fila ativa</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                    <Send className="h-5 w-5" />
                  </div>
                  <p className="text-sm text-slate-400">
                    Nenhum disparo agendado no momento.
                  </p>
                  <Link href="/ofertas">
                    <button className="text-xs font-semibold text-indigo-600 hover:underline">
                      Selecionar ofertas para disparar &rarr;
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </FlowLayout>
  );
}
