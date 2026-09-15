import React from "react";
import FlowLayout from "../components/FlowLayout";
import { PlaySquare, CheckCircle2, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function TutorialPage() {
  const tutorials = [
    {
      title: "1. Como conectar seu WhatsApp via QR Code",
      duration: "3:40 min",
      description: "Passo a passo seguro para parear sua conta sem risco de desconexão.",
      link: "/whatsapp",
    },
    {
      title: "2. Cadastrando suas tags de afiliado (Amazon & Shopee)",
      duration: "4:15 min",
      description: "Como obter suas tags oficiais e garantir 100% das suas comissões.",
      link: "/integracoes",
    },
    {
      title: "3. Criando grupos de WhatsApp e regras de postagem",
      duration: "5:10 min",
      description: "Estratégia de grupos segmentados e intervalos de envio anti-spam.",
      link: "/grupos",
    },
    {
      title: "4. Configurando Segmentos por Palavras-Chave",
      duration: "3:55 min",
      description: "Como filtrar nichos lucrativos (ex: Eletrônicos, Cozinha, Ferramentas).",
      link: "/segmentos",
    },
    {
      title: "5. Cupons automáticos e aumento de conversão",
      duration: "2:50 min",
      description: "Adicione cupons relâmpago para dobrar a taxa de cliques dos membros.",
      link: "/cupons",
    },
    {
      title: "6. Piloto Automático 24/7 e Escala de Faturamento",
      duration: "6:20 min",
      description: "Como deixar o FlowPromos rodando e focar apenas em atrair novos membros.",
      link: "/ofertas",
    },
  ];

  return (
    <FlowLayout activeItem="Tutorial">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Tutorial & Primeiros Passos FlowPromos
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Aprenda a configurar sua máquina de vendas automática em menos de 15 minutos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tutorials.map((tut, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between hover:border-slate-300 transition"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5 font-bold text-slate-900">
                    <PlaySquare className="h-4 w-4 text-indigo-600" />
                    <span>Módulo {idx + 1}</span>
                  </span>
                  <span>{tut.duration}</span>
                </div>
                <h3 className="mt-3 text-base font-bold text-slate-900">{tut.title}</h3>
                <p className="mt-2 text-xs text-slate-500 leading-relaxed">{tut.description}</p>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Conteúdo prático</span>
                </span>
                <Link href={tut.link}>
                  <button className="text-xs font-bold text-slate-900 hover:underline flex items-center gap-1 cursor-pointer">
                    <span>Configurar agora</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </FlowLayout>
  );
}
