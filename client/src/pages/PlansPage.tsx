import React, { useState } from "react";
import { trpc } from "../lib/trpc";
import FlowLayout from "../components/FlowLayout";
import { Check, ShieldCheck, Zap, Sparkles, CreditCard, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../_core/hooks/useAuth";

export default function PlansPage() {
  const { data: plansList, isLoading } = trpc.plans.list.useQuery();
  const { user } = useAuth();

  const handleCheckout = (planId: string) => {
    window.location.href = `/checkout?plan=${encodeURIComponent(planId)}`;
  };

  return (
    <FlowLayout activeItem="Plano">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
            7 dias de garantia total • Cancele quando quiser
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Escolha seu plano FlowPromos
          </h1>
          <p className="text-sm text-slate-500">
            Automatize ofertas de Shopee, Amazon, Mercado Livre e Magalu. Liberação imediata após a compra com login e senha exclusivos.
          </p>
        </div>

        {/* Cards de Preços */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {plansList?.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-3xl bg-white p-7 shadow-xs flex flex-col justify-between transition relative ${
                plan.popular
                  ? "border-2 border-black shadow-lg scale-105"
                  : "border border-slate-200 hover:border-slate-300"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-black px-4 py-1 text-[11px] font-extrabold text-white uppercase tracking-wider">
                  {plan.badge}
                </div>
              )}

              <div>
                <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                <p className="text-xs text-slate-400 mt-1">{plan.marketplacesLabel}</p>

                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-xs text-slate-500">R$</span>
                  <span className="text-4xl font-extrabold text-slate-900">
                    {plan.monthlyEquivalent.toFixed(2).replace(".", ",")}
                  </span>
                  <span className="text-xs text-slate-400">/mês</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  R$ {(plan.priceCents / 100).toFixed(2).replace(".", ",")} cobrados anualmente
                </p>

                {plan.savingsYear && (
                  <div className="mt-2 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md inline-block">
                    Economize R$ {plan.savingsYear.toFixed(2).replace(".", ",")} no plano anual
                  </div>
                )}

                <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
                  {plan.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                      <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-4">
                <button
                  onClick={() => handleCheckout(plan.id)}
                  className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold transition cursor-pointer ${
                    plan.popular
                      ? "bg-black text-white hover:bg-slate-800 shadow-md"
                      : "bg-slate-100 text-slate-900 hover:bg-slate-200"
                  }`}
                >
                  <CreditCard className="h-4 w-4" />
                  <span>Assinar {plan.name} via Stripe</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Garantia & Segurança Stripe */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-emerald-600 shrink-0" />
            <div>
              <h4 className="font-bold text-slate-900 text-sm">
                Pagamento Seguro com Criptografia Stripe
              </h4>
              <p className="text-xs text-slate-500">
                Seus dados são processados de forma 100% segura. Liberação instantânea de usuário e senha por e-mail e na tela de confirmação.
              </p>
            </div>
          </div>
          <div className="text-xs font-semibold text-slate-500 whitespace-nowrap">
            Suporte via WhatsApp incluso
          </div>
        </div>
      </div>
    </FlowLayout>
  );
}
