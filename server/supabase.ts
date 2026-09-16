import { ENV } from "./_core/env";

type SupabaseAuthResponse = {
  access_token?: string;
  user?: { id?: string; email?: string };
  error?: string;
  error_description?: string;
};

type SupabaseUserResponse = {
  id?: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
};

type AdminProfile = {
  id: string;
  email: string;
  full_name: string | null;
  role: "user" | "admin";
  status: "active" | "suspended";
};

function getSupabaseConfig() {
  if (!ENV.supabaseUrl || !ENV.supabaseAnonKey || !ENV.supabaseServiceRoleKey) {
    throw new Error("Supabase não configurado no ambiente do servidor.");
  }
  return {
    url: ENV.supabaseUrl.replace(/\/$/, ""),
    anonKey: ENV.supabaseAnonKey,
    serviceRoleKey: ENV.supabaseServiceRoleKey,
  };
}

export async function authenticateSupabaseAdmin(email: string, password: string) {
  const { url, anonKey, serviceRoleKey } = getSupabaseConfig();
  const authResponse = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const authBody = (await authResponse.json()) as SupabaseAuthResponse;
  if (!authResponse.ok || !authBody.access_token || !authBody.user?.id) {
    return null;
  }

  const profileResponse = await fetch(
    `${url}/rest/v1/profiles?select=id,email,full_name,role,status&id=eq.${encodeURIComponent(authBody.user.id)}&limit=1`,
    {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    },
  );
  if (!profileResponse.ok) return null;

  const profiles = (await profileResponse.json()) as AdminProfile[];
  const profile = profiles[0];
  if (!profile || profile.role !== "admin" || profile.status !== "active") return null;

  return profile;
}

export async function authenticateSupabaseUser(email: string, password: string) {
  const { url, anonKey } = getSupabaseConfig();
  const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: anonKey, "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) return null;
  const body = (await response.json()) as SupabaseAuthResponse;
  return body.user?.id ? { id: body.user.id, email: body.user.email || email } : null;
}

export async function createSupabaseUser(input: { email: string; password: string; name?: string }) {
  const { url, serviceRoleKey } = getSupabaseConfig();
  const response = await fetch(`${url}/auth/v1/admin/users`, {
    method: "POST",
    headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}`, "content-type": "application/json" },
    body: JSON.stringify({ email: input.email, password: input.password, email_confirm: true, user_metadata: { full_name: input.name || null } }),
  });
  const body = (await response.json()) as SupabaseUserResponse & { msg?: string };
  if (!response.ok || !body.id) throw new Error(body.msg || "Não foi possível criar o usuário no Supabase Auth.");
  return body.id;
}
