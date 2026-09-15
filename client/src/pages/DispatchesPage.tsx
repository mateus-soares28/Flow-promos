import React from "react";
import { trpc } from "../lib/trpc";
import FlowLayout from "../components/FlowLayout";
import { Send, CheckCircle2, Clock, AlertCircle } from "lucide-react";

export default function DispatchesPage() {
  const { data: dispatches, isLoading } = trpc.dispatches.list.useQuery();

  return (
    <FlowLayout activeItem="Disparos">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Fila & Histórico de Disparos
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Acompanhe em tempo real cada promoção enviada para os seus canais e grupos do WhatsApp.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Canal</th>
                <th className="py-3 px-4">Mensagem Formatada</th>
                <th className="py-3 px-4">Horário</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dispatches && dispatches.length > 0 ? (
                dispatches.map((disp: any) => (
                  <tr key={disp.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3.5 px-4 font-semibold text-slate-900 capitalize">
                      {disp.channelType}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 max-w-md">
                      <div className="line-clamp-2 whitespace-pre-wrap font-mono text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-100">
                        {disp.formattedMessage}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                      {disp.sentAt ? new Date(disp.sentAt).toLocaleTimeString("pt-BR") : "Na fila"}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          disp.status === "sent"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {disp.status === "sent" ? "Enviado com Sucesso" : "Agendado"}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">
                    Nenhum disparo registrado ainda. Conecte o WhatsApp e publique suas primeiras ofertas!
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
