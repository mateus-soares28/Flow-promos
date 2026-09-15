import React from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "../_core/hooks/useAuth";
import {
  LayoutDashboard,
  PlaySquare,
  MessageSquare,
  Layers,
  Users,
  Tag,
  Activity,
  Send,
  Ticket,
  MessagesSquare,
  CreditCard,
  Plug,
  ShieldCheck,
  LogOut,
  Zap,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";

interface FlowLayoutProps {
  children: React.ReactNode;
  activeItem?: string;
  whatsappStatus?: "connected" | "connecting" | "disconnected";
  daysRemaining?: number;
}

export default function FlowLayout({
  children,
  activeItem = "Visão Geral",
  whatsappStatus = "disconnected",
  daysRemaining = 0,
}: FlowLayoutProps) {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    setLocation("/login");
  };

  const navSections = [
    {
      label: "PAINEL",
      items: [
        { name: "Visão Geral", path: "/", icon: LayoutDashboard },
        { name: "Tutorial", path: "/tutorial", icon: PlaySquare },
      ],
    },
    {
      label: "OPERAÇÃO",
      items: [
        { name: "WhatsApp", path: "/whatsapp", icon: MessageSquare },
        { name: "Segmentos", path: "/segmentos", icon: Layers },
        { name: "Grupos", path: "/grupos", icon: Users },
        { name: "Ofertas", path: "/ofertas", icon: Tag },
        { name: "Monitoramento", path: "/monitoramento", icon: Activity },
        { name: "Disparos", path: "/disparos", icon: Send },
        { name: "Cupons", path: "/cupons", icon: Ticket },
        { name: "Mensagens", path: "/mensagens", icon: MessagesSquare },
      ],
    },
    {
      label: "CONTA",
      items: [
        { name: "Faturamento", path: "/faturamento", icon: CreditCard },
        { name: "Integrações", path: "/integracoes", icon: Plug },
        { name: "Plano", path: "/planos", icon: Zap },
        { name: "Administração", path: "/admin", icon: ShieldCheck, adminOnly: true },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col antialiased">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/80 bg-white px-5 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-black text-white shadow-sm">
            <Zap className="h-5 w-5 fill-white text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900 font-sans">
            FlowPromos
          </span>
          <span className="ml-2 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
            v2.4 Pro
          </span>
        </div>

        {/* Right Header Status Bar */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {/* Status WhatsApp */}
          <Link href="/whatsapp">
            <button className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50 cursor-pointer shadow-xs">
              <span
                className={`h-2 w-2 rounded-full ${
                  whatsappStatus === "connected"
                    ? "bg-emerald-500 ring-4 ring-emerald-100"
                    : whatsappStatus === "connecting"
                    ? "bg-amber-500 animate-pulse"
                    : "bg-red-500"
                }`}
              />
              <span className={whatsappStatus === "disconnected" ? "text-red-600 font-semibold" : ""}>
                {whatsappStatus === "connected"
                  ? "Conectado"
                  : whatsappStatus === "connecting"
                  ? "Aguardando QR Code"
                  : "Desconectado"}
              </span>
            </button>
          </Link>

          {/* Dias Restantes */}
          <div className="flex items-center gap-1.5 rounded-full bg-slate-900 px-3.5 py-1 text-xs font-semibold text-white shadow-xs">
            <Activity className="h-3.5 w-3.5 text-emerald-400" />
            <span>{daysRemaining} dias restantes</span>
          </div>

          {/* Sair */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sair</span>
          </button>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex flex-1">
        {/* Left Sidebar */}
        <aside className="w-64 border-r border-slate-200/80 bg-white p-4 flex flex-col justify-between shrink-0">
          <div className="space-y-6">
            {navSections.map((section) => (
              <div key={section.label}>
                <div className="px-3 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                  {section.label}
                </div>
                <div className="mt-2 space-y-1">
                  {section.items.filter((item) => !item.adminOnly || user?.role === "admin").map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      location === item.path || (item.path === "/" && location === "");
                    return (
                      <Link key={item.path} href={item.path}>
                        <div
                          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition cursor-pointer ${
                            isActive
                              ? "bg-[#090D1A] text-white shadow-sm font-semibold"
                              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                          }`}
                        >
                          <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-slate-500"}`} />
                          <span>{item.name}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Card Pro Info */}
          <div className="mt-6 rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50/70 to-indigo-50/50 p-3.5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-600" />
              <span className="text-xs font-bold text-slate-900">Piloto Automático</span>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
              Shopee, Amazon e Mercado Livre sincronizando ofertas 24/7 com suas tags.
            </p>
            <Link href="/planos">
              <span className="mt-2 inline-flex items-center text-[11px] font-semibold text-indigo-700 hover:underline cursor-pointer">
                Ver planos e limites &rarr;
              </span>
            </Link>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}
