from pathlib import Path
p = Path('/home/ubuntu/flowpromos/server/routers.ts')
s = p.read_text()
marker = '  // Painel Administrativo Geral'
module = '''  automation: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return null;
      const [job] = await db.select().from(automationJobs).where(eq(automationJobs.userId, ctx.user.id)).limit(1);
      return job || null;
    }),
    enable: protectedProcedure.input(z.object({ cronExpression: z.string().default("0 */15 * * * *") })).mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [existing] = await db.select().from(automationJobs).where(eq(automationJobs.userId, ctx.user.id)).limit(1);
      if (existing?.scheduleCronTaskUid) return { success: true, taskUid: existing.scheduleCronTaskUid };
      const session = parseCookie(ctx.req.headers.cookie || "")[COOKIE_NAME] || "";
      const job = await createHeartbeatJob({ name: `flowpromos-scan-${ctx.user.id}`, cron: input.cronExpression, path: "/api/scheduled/scan-promotions", payload: { userId: ctx.user.id }, description: "Varredura periódica de promoções configuradas pelo usuário" }, session);
      if (existing) await db.update(automationJobs).set({ scheduleCronTaskUid: job.taskUid, cronExpression: input.cronExpression, isEnabled: true }).where(eq(automationJobs.id, existing.id));
      else await db.insert(automationJobs).values({ userId: ctx.user.id, name: `flowpromos-scan-${ctx.user.id}`, scheduleCronTaskUid: job.taskUid, cronExpression: input.cronExpression, isEnabled: true });
      return { success: true, taskUid: job.taskUid };
    }),
    disable: protectedProcedure.mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [job] = await db.select().from(automationJobs).where(eq(automationJobs.userId, ctx.user.id)).limit(1);
      if (!job?.scheduleCronTaskUid) return { success: true };
      const session = parseCookie(ctx.req.headers.cookie || "")[COOKIE_NAME] || "";
      await deleteHeartbeatJob(job.scheduleCronTaskUid, session);
      await db.update(automationJobs).set({ scheduleCronTaskUid: null, isEnabled: false }).where(eq(automationJobs.id, job.id));
      return { success: true };
    }),
  }),
'''
if marker not in s:
    raise SystemExit('marker missing')
if '  automation: router({' not in s:
    s = s.replace(marker, module + marker, 1)
p.write_text(s)
