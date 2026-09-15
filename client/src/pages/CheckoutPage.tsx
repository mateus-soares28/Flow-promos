import React, { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, ArrowRight, Check, Lock, Mail, User, Zap } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "../lib/trpc";
import ThemeToggle from "../components/ThemeToggle";

export default function CheckoutPage() {
  const [, setLocation] = useLocation();
  const { data: plans, isLoading: plansLoading } = trpc.plans.list.useQuery();
  const checkoutMutation = trpc.plans.createCheckout.useMutation();
  const planId = new URLSearchParams(window.location.search).get("plan") || "pro_annual";
  const selectedPlan = useMemo(() => plans?.find((plan) => plan.id === planId) || plans?.[1], [plans, planId]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedPlan) return;
    if (password.length < 8) {
      toast.error("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    if (password !== passwordConfirmation) {
      toast.error("As senhas não conferem.");
      return;
    }

    try {
      toast.info("Abrindo checkout seguro do Stripe...");
      const result = await checkoutMutation.mutateAsync({
        planId: selectedPlan.id,
        customerEmail: email,
        customerName: name,
        customerPassword: password,
      });
      if (result.url) window.location.href = result.url;
    } catch (error: any) {
      toast.error(error?.message || "Não foi possível iniciar o checkout.");
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f9fc] text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <Link href="/vendas"><span className="flex cursor-pointer items-center gap-2 text-lg font-black"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950 text-white"><Zap className="h-4 w-4 fill-white" /></span>FlowPromos</span></Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 py-10 sm:py-14">
        <div className="mb-9 flex items-center justify-center gap-3 text-xs font-bold text-emerald-600 sm:gap-5">
          <span className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white">1</span> Escolha o plano</span>
          <span className="h-px w-10 bg-emerald-500" />
          <span className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white">2</span> Crie sua conta</span>
        </div>

        <Link href="/vendas"><span className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-500 hover:text-slate-900"><ArrowLeft className="h-4 w-4" /> Voltar para planos</span></Link>
        <div className="mt-7 text-center"><h1 className="text-3xl font-black tracking-tight sm:text-4xl">Crie sua conta</h1><p className="mt-2 text-sm text-slate-500">Preencha seus dados para começar</p></div>

        {selectedPlan && (
          <div className="mt-8 rounded-2xl bg-[#111b30] p-5 text-white shadow-lg sm:p-6">
            <div className="flex items-center justify-between gap-4 border-b border-white/15 pb-4"><div><p className="text-xs text-slate-400">Plano selecionado</p><p className="mt-1 text-xl font-black">{selectedPlan.name}</p></div><div className="text-right"><strong className="text-2xl">R$ {selectedPlan.monthlyEquivalent.toFixed(2).replace(".", ",")}</strong><span className="text-xs text-slate-400">/mês</span></div></div>
            <p className="mt-4 flex items-center gap-2 text-xs text-emerald-300"><Check className="h-4 w-4" /> Garantia de 7 dias · cobrança segura pelo Stripe</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div><label className="text-sm font-semibold text-slate-700">Nome completo</label><div className="relative mt-2"><User className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input required value={name} onChange={(e) => setName(e.target.value)} placeholder="João Silva" className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200" /></div></div>
          <div><label className="text-sm font-semibold text-slate-700">E-mail</label><div className="relative mt-2"><Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200" /></div></div>
          <div><label className="text-sm font-semibold text-slate-700">Senha de acesso</label><div className="relative mt-2"><Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input required minLength={8} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Crie uma senha forte" className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200" /></div></div>
          <div><label className="text-sm font-semibold text-slate-700">Confirme sua senha</label><div className="relative mt-2"><Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input required minLength={8} type="password" value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.target.value)} placeholder="Repita sua senha" className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200" /></div></div>
          <button type="submit" disabled={checkoutMutation.isPending || plansLoading || !selectedPlan} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"><span>{checkoutMutation.isPending ? "Preparando checkout..." : "Continuar para pagamento"}</span><ArrowRight className="h-4 w-4" /></button>
          <p className="text-center text-[11px] leading-5 text-slate-400">Ao continuar, você será levado ao Stripe para concluir o pagamento. Após a confirmação, sua conta será ativada com os dados informados.</p>
        </form>
      </main>
    </div>
  );
}
