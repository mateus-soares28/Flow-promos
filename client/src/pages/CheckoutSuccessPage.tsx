import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "../lib/trpc";
import { CheckCircle2, Copy, ArrowRight, ShieldCheck, Zap } from "lucide-react";
import { toast } from "sonner";

export default function CheckoutSuccessPage() {
  const [, setLocation] = useLocation();
  const confirmPaymentMutation = trpc.plans.confirmPaymentAndActivate.useMutation();

  const [activatedData, setActivatedData] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get("email") || undefined;
    const planId = urlParams.get("plan_id");
    const sessionId = urlParams.get("session_id");

    if (!sessionId || !planId) return;

    // Executa a confirmação da compra e liberação da conta
    confirmPaymentMutation
      .mutateAsync({
        email,
        planId,
        sessionId,
      })
      .then((res) => {
        setActivatedData(res);
      })
      .catch((err) => {
        console.error("Erro na ativação pós-compra:", err);
      });
  }, []);

  const handleCopyCredentials = () => {
    if (!activatedData) return;
    const text = `FlowPromos Acesso:\nE-mail: ${activatedData.email}\nSenha: ${activatedData.tempPassword}\nLink: ${window.location.origin}/login`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Credenciais copiadas para a área de transferência!");
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-xl border border-slate-200 text-center space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200">
          <CheckCircle2 className="h-10 w-10 text-emerald-600" />
        </div>

        <div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
            Pagamento Confirmado via Stripe
          </span>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900">
            Parabéns! Seu acesso está liberado
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Sua assinatura anual do FlowPromos foi ativada com sucesso. Guarde suas credenciais de login abaixo.
          </p>
        </div>

        {/* Box com Usuário e Senha */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Credenciais de Acesso
            </span>
            <span className="text-[11px] font-semibold text-emerald-600">Status: Ativo</span>
          </div>

          <div>
            <label className="text-[11px] text-slate-400 font-semibold uppercase">E-mail de Login</label>
            <div className="font-mono text-sm font-bold text-slate-900">
              {activatedData?.email || "Processando..."}
            </div>
          </div>

          <div>
            <label className="text-[11px] text-slate-400 font-semibold uppercase">Senha Temporária</label>
            <div className="font-mono text-sm font-bold text-slate-900 bg-white p-2 rounded-lg border border-slate-200 flex items-center justify-between">
              <span>{activatedData?.tempPassword || "Processando..."}</span>
              <button
                onClick={handleCopyCredentials}
                className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer font-sans"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>{copied ? "Copiado!" : "Copiar"}</span>
              </button>
            </div>
          </div>

          <p className="text-[11px] text-slate-400">
            * Guarde estas credenciais. O acesso foi criado com os dados informados no checkout.
          </p>
        </div>

        {/* Botão Acessar Painel */}
        <div className="pt-2">
          <button
            onClick={() => setLocation("/")}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-black py-3.5 text-xs font-bold text-white hover:bg-slate-800 transition shadow-md cursor-pointer"
          >
            <span>Acessar Painel FlowPromos</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
