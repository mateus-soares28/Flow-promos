import React from "react";
import { trpc } from "../lib/trpc";
import FlowLayout from "../components/FlowLayout";
import { CreditCard, CheckCircle2, Download, ShieldCheck, Zap } from "lucide-react";
import { Link } from "wouter";

export default function BillingPage() {
  const { data: invoices, isLoading } = trpc.invoices.list.useQuery();

  return (
    <FlowLayout activeItem="Faturamento">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Faturamento & Recibos Stripe
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Histórico de pagamentos e dados da sua assinatura FlowPromos.
            </p>
          </div>
          <Link href="/planos">
            <button className="flex items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition cursor-pointer">
              <Zap className="h-4 w-4" />
              <span>Gerenciar Assinatura</span>
            </button>
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Descrição do Plano</th>
                <th className="py-3 px-4">Valor</th>
                <th className="py-3 px-4">Data Pagamento</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Comprovante</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices && invoices.length > 0 ? (
                invoices.map((inv: any) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {inv.planName}
                    </td>
                    <td className="py-3.5 px-4 text-slate-800 font-bold">
                      R$ {(inv.amountCents / 100).toFixed(2).replace(".", ",")}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(inv.paidAt).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Pago via Stripe</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button className="text-indigo-600 hover:text-indigo-900 font-semibold text-xs">
                        Baixar Recibo
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Nenhum comprovante encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </FlowLayout>
  );
}
