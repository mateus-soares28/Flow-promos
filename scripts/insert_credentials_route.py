from pathlib import Path
p=Path('/home/ubuntu/flowpromos/server/routers.ts')
s=p.read_text()
marker='  // Disparos e Fila'
insert='''    saveCredentials: protectedProcedure\n      .input(z.object({\n        marketplace: z.enum(["amazon", "shopee", "magalu", "mercadolivre", "aliexpress", "kabum"]),\n        affiliateTag: z.string().min(2),\n        apiKey: z.string().optional(),\n        apiSecret: z.string().optional(),\n        appId: z.string().optional(),\n      }))\n      .mutation(async ({ input, ctx }) => {\n        const db = await getDb();\n        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });\n        const [existing] = await db.select().from(affiliateIntegrations).where(and(eq(affiliateIntegrations.userId, ctx.user.id), eq(affiliateIntegrations.marketplace, input.marketplace))).limit(1);\n        const values = { affiliateTag: input.affiliateTag.trim(), apiKey: input.apiKey || null, apiSecret: input.apiSecret || null, appId: input.appId || null, isConnected: Boolean(input.apiKey && input.apiSecret && input.appId), autoConvertLinks: true };\n        if (existing) await db.update(affiliateIntegrations).set(values).where(eq(affiliateIntegrations.id, existing.id));\n        else await db.insert(affiliateIntegrations).values({ userId: ctx.user.id, marketplace: input.marketplace, ...values });\n        return { success: true };\n      }),\n  },\n'''
# This replaces the close of integrations router immediately before the comment.
pos=s.index(marker)
close=s.rfind('  }),\n', 0, pos)
s=s[:close]+insert+s[close+len('  }),\n'):]
p.write_text(s)
PY
python3 /home/ubuntu/flowpromos/scripts/insert_credentials_route.py
