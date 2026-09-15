import React, { useState } from "react";
import { trpc } from "../lib/trpc";
import FlowLayout from "../components/FlowLayout";
import { Users, Plus, Check, ShieldCheck, Clock, Settings2 } from "lucide-react";
import { toast } from "sonner";

export default function GroupsPage() {
  const { data: groups, isLoading, refetch } = trpc.groups.list.useQuery();
  const createGroupMutation = trpc.groups.create.useMutation();
  const togglePostingMutation = trpc.groups.toggleAutoPosting.useMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [jid, setJid] = useState("");
  const [delay, setDelay] = useState(30);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !jid) return toast.error("Informe o JID real do grupo.");
    try {
      await createGroupMutation.mutateAsync({
        name,
        jid,
        delaySeconds: Number(delay),
      });
      setName("");
      setJid("");
      setIsModalOpen(false);
      await refetch();
      toast.success("Grupo adicionado com sucesso!");
    } catch (e: any) {
      toast.error("Erro ao adicionar grupo: " + e.message);
    }
  };

  const handleToggle = async (groupId: number, current: boolean) => {
    try {
      await togglePostingMutation.mutateAsync({
        groupId,
        enabled: !current,
      });
      await refetch();
      toast.success("Status de envio automático atualizado");
    } catch (e: any) {
      toast.error("Erro ao alterar: " + e.message);
    }
  };

  return (
    <FlowLayout activeItem="Grupos">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Grupos de WhatsApp
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Gerencie os grupos de destino onde suas ofertas de afiliado serão postadas no piloto automático.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Adicionar Grupo</span>
          </button>
        </div>

        {/* Modal de Criação */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">Cadastrar Novo Grupo</h2>
              <p className="text-xs text-slate-500 mt-1">
                Insira o nome do grupo e o intervalo de delay para disparos.
              </p>

              <form onSubmit={handleCreate} className="mt-4 space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate-700">Nome do Grupo</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 🔥 Achadinhos Shopee & Amazon VIP"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:ring-2 focus:ring-black outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700">JID do grupo no WhatsApp</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 120363...@g.us"
                    value={jid}
                    onChange={(e) => setJid(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-black outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700">
                    Delay entre envios (segundos)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="300"
                    value={delay}
                    onChange={(e) => setDelay(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:ring-2 focus:ring-black outline-hidden"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-lg px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={createGroupMutation.isPending}
                    className="rounded-lg bg-black px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                  >
                    Salvar Grupo
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Lista de Grupos */}
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Nome do Grupo</th>
                <th className="py-3 px-4">Participantes</th>
                <th className="py-3 px-4">Delay</th>
                <th className="py-3 px-4">Envio Automático</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {groups && groups.length > 0 ? (
                groups.map((grp: any) => (
                  <tr key={grp.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-slate-400" />
                        <span>{grp.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {grp.participantsCount} membros
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {grp.delaySeconds}s
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-semibold text-[11px] ${
                          grp.autoPostingEnabled
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {grp.autoPostingEnabled ? "Ativado" : "Pausado"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleToggle(grp.id, grp.autoPostingEnabled)}
                        className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
                      >
                        {grp.autoPostingEnabled ? "Pausar" : "Ativar"}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Nenhum grupo cadastrado. Clique no botão acima para adicionar.
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
