import React, { useState } from "react";
import { useLocation, Link } from "wouter";
import { trpc } from "../lib/trpc";
import { Zap, ShieldCheck, ArrowRight, Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import ThemeToggle from "../components/ThemeToggle";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const loginMutation = trpc.auth.loginWithCredentials.useMutation();
  const nextPath = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("next") || "/" : "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await loginMutation.mutateAsync({ email, password });
      if (res?.success) {
        toast.success("Login efetuado com sucesso!");
        setLocation(nextPath);
      }
    } catch (e: any) {
      toast.error(e.message || "Erro ao entrar");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-end"><ThemeToggle /></div>
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-white shadow-md">
            <Zap className="h-6 w-6 fill-white text-white" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            FlowPromos
          </h1>
          <p className="text-xs text-slate-500">
            Acesse seu painel de automação de promoções para afiliados.
          </p>
        </div>

        {/* Form Container */}
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm space-y-5">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700">E-mail Cadastrado</label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2 text-xs outline-hidden focus:ring-2 focus:ring-black"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Senha de Acesso</label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2 text-xs outline-hidden focus:ring-2 focus:ring-black"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                * Senha gerada após a confirmação de compra no Stripe.
              </p>
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-black py-3 text-xs font-bold text-white hover:bg-slate-800 transition cursor-pointer shadow-sm"
            >
              <span>Entrar com E-mail e Senha</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

        </div>

        {/* Footer Link Planos */}
        <div className="text-center text-xs text-slate-500">
          Ainda não tem uma assinatura ativa?{" "}
          <Link href="/planos">
            <span className="font-semibold text-black hover:underline cursor-pointer">
              Conheça os planos e assine &rarr;
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
