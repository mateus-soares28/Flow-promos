from pathlib import Path
p=Path('/home/ubuntu/flowpromos/server/routers.ts')
s=p.read_text()
needle='''        return { success: true };\n      }),\n  }),\n  // Disparos e Fila'''
route='''        return { success: true };\n      }),\n    saveCredentials: protectedProcedure\n      .input(z.object({\n        marketplace: z.enum(["amazon", "shopee", "magalu", "mercadolivre", "aliexpress", "kabum"]),\n        affiliateTag: z.string().min(2),\n        apiKey: z.string().optional(),\n        apiSecret: z.string().optional(),\n        appId: z.string().optional(),\n      }))\n      .mutation(async ({ input, ctx }) => {\n        const db = await getDb();\n        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });\n        const [existing] = await db.select().from(affiliateIntegrations).where(and(eq(affiliateIntegrations.userId, ctx.user.id), eq(affiliateIntegrations.marketplace, input.marketplace))).limit(1);\n        const values = { affiliateTag: input.affiliateTag.trim(), apiKey: input.apiKey || null, apiSecret: input.apiSecret || null, appId: input.appId || null, isConnected: Boolean(input.apiKey && input.apiSecret && input.appId), autoConvertLinks: true };\n        if (existing) await db.update(affiliateIntegrations).set(values).where(eq(affiliateIntegrations.id, existing.id));\n        else await db.insert(affiliateIntegrations).values({ userId: ctx.user.id, marketplace: input.marketplace, ...values });\n        return { success: true };\n      }),\n  }),\n  // Disparos e Fila'''
if needle not in s: raise SystemExit('needle not found')
s=s.replace(needle,route,1)
p.write_text(s)
PY
python3 /home/ubuntu/flowpromos/scripts/insert_credentials_route2.py
