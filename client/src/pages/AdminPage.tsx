import React, { useState } from "react";
import { Redirect } from "wouter";
import { toast } from "sonner";
import { AlertCircle, CheckCircle2, DollarSign, Eye, EyeOff, KeyRound, Loader2, LogIn, LogOut, ShieldCheck, Tag, Users } from "lucide-react";
import { useAuth } from "../_core/hooks/useAuth";
import { trpc } from "../lib/trpc";
import FlowLayout from "../components/FlowLayout";
import ThemeToggle from "../components/ThemeToggle";

function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const loginMutation = trpc.admin.login.useMutation();
  const utils = trpc.useUtils();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await loginMutation.mutateAsync({ username, password });
      await utils.auth.me.invalidate();
      toast.success("Login administrativo realizado.");
      window.location.reload();
    } catch (error: any) {
      toast.error(error?.message || "Não foi possível realizar o login.");
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 dark:bg-slate-950 dark:text-white">
      <div className="mx-auto flex max-w-md justify-end"><ThemeToggle /></div>
      <div className="mx-auto mt-12 max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white"><ShieldCheck className="h-6 w-6" /></div>
          <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">FlowPromos</p><h1 className="text-2xl font-bold">Acesso administrativo</h1></div>
        </div>
        <p className="mb-6 text-sm leading-6 text-slate-500 dark:text-slate-400">Área exclusiva do proprietário da plataforma. Use as credenciais administrativas configuradas no servidor.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-medium">Usuário<input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:focus:border-white dark:focus:ring-slate-700" /></label>
          <label className="block text-sm font-medium">Senha<div className="relative mt-2"><input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 pr-11 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:focus:border-white dark:focus:ring-slate-700" /><button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"} title={showPassword ? "Ocultar senha" : "Mostrar senha"} className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></label>
          <button type="submit" disabled={loginMutation.isPending} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200">
            {loginMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />} Entrar no painel
          </button>
        </form>
        <div className="mt-6 flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-500 dark:bg-slate-800 dark:text-slate-400"><KeyRound className="mt-0.5 h-4 w-4 shrink-0" />A senha não é armazenada no navegador nem exibida na interface.</div>
      </div>
    </main>
  );
}

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const { data: metrics, isLoading, refetch } = trpc.admin.getOverview.useQuery(undefined, { enabled: user?.role === "admin" });
  const toggleStatusMutation = trpc.admin.toggleUserStatus.useMutation();
  const adminLogoutMutation = trpc.admin.logout.useMutation();

  if (authLoading) return <div className="min-h-screen bg-slate-50 dark:bg-slate-950" />;
  if (!user) return <AdminLogin />;
  if (user.role !== "admin") return <Redirect to="/" />;

  const handleToggle = async (userId: number, currentStatus: string) => {
    try {
      const nextStatus = currentStatus === "active" ? "suspended" : "active";
      await toggleStatusMutation.mutateAsync({ userId, status: nextStatus as any });
      await refetch();
      toast.success("Status do cliente atualizado com sucesso!");
    } catch (e: any) {
      toast.error("Erro ao atualizar: " + e.message);
    }
  };

  const handleAdminLogout = async () => {
    await adminLogoutMutation.mutateAsync();
    window.location.href = "/admin";
  };

  return (
    <FlowLayout activeItem="Administração">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white dark:bg-white dark:text-slate-950">Painel do Administrador Geral</span><h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Controle de Assinaturas & Afiliados FlowPromos</h1><p className="mt-1 text-sm text-slate-500">Gerencie clientes, faturamento Stripe, acesso e assinaturas ativas.</p></div>
          <button onClick={handleAdminLogout} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"><LogOut className="h-4 w-4" />Sair do admin</button>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900"><div className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-400"><Users className="h-4 w-4" /><span>Total de Afiliados</span></div><div className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">{metrics?.totalUsers ?? 0}</div></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900"><div className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-400"><ShieldCheck className="h-4 w-4 text-emerald-600" /><span>Assinaturas Ativas</span></div><div className="mt-2 text-2xl font-extrabold text-emerald-600">{metrics?.activeSubscribers ?? 0}</div></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900"><div className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-400"><DollarSign className="h-4 w-4 text-indigo-600" /><span>Receita Stripe (R$)</span></div><div className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">R$ {((metrics?.totalRevenueCents ?? 0) / 100).toFixed(2)}</div></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900"><div className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-400"><Tag className="h-4 w-4" /><span>Ofertas Monitoradas</span></div><div className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">{metrics?.totalOffersTracked ?? 0}</div></div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900"><div className="flex items-center justify-between border-b border-slate-200 p-4 text-sm font-bold dark:border-slate-800"><span>Afiliados Cadastrados & Acessos</span><span className="text-xs font-normal text-slate-400">Mostrando os clientes mais recentes</span></div><div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead className="border-b border-slate-200 bg-slate-50 font-semibold uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-800"><tr><th className="px-4 py-3">Nome / Email</th><th className="px-4 py-3">Plano</th><th className="px-4 py-3">Método Login</th><th className="px-4 py-3">Status Acesso</th><th className="px-4 py-3 text-right">Ação</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{isLoading ? <tr><td colSpan={5} className="py-8 text-center text-slate-400">Carregando dados...</td></tr> : metrics?.recentUsers && metrics.recentUsers.length > 0 ? metrics.recentUsers.map((u: any) => <tr key={u.id} className="transition hover:bg-slate-50/50 dark:hover:bg-slate-800/50"><td className="px-4 py-3.5 font-medium"><div>{u.name || "Afiliado FlowPromos"}</div><div className="text-[11px] text-slate-400">{u.email}</div></td><td className="px-4 py-3.5 font-mono text-slate-600 dark:text-slate-300">{u.currentPlanId || "Sem plano"}</td><td className="px-4 py-3.5 capitalize text-slate-600 dark:text-slate-300">{u.loginMethod || "credentials"}</td><td className="px-4 py-3.5"><span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${u.status === "active" ? "border border-emerald-200 bg-emerald-50 text-emerald-700" : "border border-red-200 bg-red-50 text-red-700"}`}>{u.status === "active" ? <><CheckCircle2 className="h-3 w-3" />Liberado / Ativo</> : <><AlertCircle className="h-3 w-3" />Suspenso / Pendente</>}</span></td><td className="px-4 py-3.5 text-right"><button onClick={() => handleToggle(u.id, u.status)} className="cursor-pointer rounded-lg border border-slate-200 px-2.5 py-1 font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">{u.status === "active" ? "Suspender" : "Liberar Acesso"}</button></td></tr>) : <tr><td colSpan={5} className="py-8 text-center text-slate-400">Nenhum usuário encontrado.</td></tr>}</tbody></table></div></div>
      </div>
    </FlowLayout>
  );
}
