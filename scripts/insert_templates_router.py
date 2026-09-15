from pathlib import Path
p=Path('/home/ubuntu/flowpromos/server/routers.ts')
s=p.read_text()
marker='  // Integrações com Lojas'
module='''  templates: router({\n    list: protectedProcedure.query(async ({ ctx }) => {\n      const db = await getDb();\n      if (!db) return [];\n      return db.select().from(messageTemplates).where(eq(messageTemplates.userId, ctx.user.id)).orderBy(desc(messageTemplates.createdAt));\n    }),\n    save: protectedProcedure.input(z.object({ id: z.number().optional(), title: z.string().min(2), content: z.string().min(2) })).mutation(async ({ input, ctx }) => {\n      const db = await getDb();\n      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });\n      if (input.id) await db.update(messageTemplates).set({ title: input.title, content: input.content }).where(and(eq(messageTemplates.id, input.id), eq(messageTemplates.userId, ctx.user.id)));\n      else await db.insert(messageTemplates).values({ userId: ctx.user.id, title: input.title, content: input.content, isDefault: false });\n      return { success: true };\n    }),\n  }),\n'''
if marker not in s: raise SystemExit('marker missing')
if '  templates: router({' not in s: s=s.replace(marker,module+marker,1)
p.write_text(s)
