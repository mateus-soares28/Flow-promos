from pathlib import Path
p=Path('/home/ubuntu/flowpromos/server/routers.ts')
s=p.read_text()
s=s.replace('''          jid: z.string().optional(),''','''          jid: z.string().min(5),''',1)
s=s.replace('''        const jid = input.jid || `1203630${Date.now()}@g.us`;''','''        const jid = input.jid.trim();''',1)
s=s.replace('''          participantsCount: Math.floor(Math.random() * 400) + 100,''','''          participantsCount: 0,''',1)
old='''        const affiliateUrl = `${input.originalUrl}?tag=flowpromos_afiliado_${ctx.user.id}`;\n        await db.insert(offers).values({'''
new='''        const [integration] = await db.select().from(affiliateIntegrations).where(and(eq(affiliateIntegrations.userId, ctx.user.id), eq(affiliateIntegrations.marketplace, input.marketplace as any))).limit(1);\n        if (!integration) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Configure a integração de afiliado antes de cadastrar ofertas." });\n        const affiliateUrl = convertAffiliateLink(input.originalUrl, integration);\n        await db.insert(offers).values({'''
if old not in s: raise SystemExit('offer marker missing')
s=s.replace(old,new,1)
s=s.replace('''          qualityScore: 85,\n          isOfficialStore: true,\n          isFreeShipping: true,''','''          qualityScore: 0,\n          isOfficialStore: false,\n          isFreeShipping: false,''',1)
old2='''        await db.insert(dispatches).values({\n          userId: ctx.user.id,\n          offerId: offer.id,\n          groupId: input.groupId,\n          channelType: "whatsapp",\n          formattedMessage,\n          status: "sent",\n          sentAt: new Date(),\n        });\n        await db\n          .update(offers)\n          .set({ status: "published", publishedAt: new Date() })\n          .where(eq(offers.id, offer.id));\n        return { success: true, message: "Oferta despachada com sucesso para os grupos!" };'''
new2='''        const [session] = await db.select().from(whatsappSessions).where(eq(whatsappSessions.userId, ctx.user.id)).limit(1);\n        if (!session || session.status !== "connected") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Conecte um gateway WhatsApp real antes de disparar." });\n        const groups = input.groupId ? await db.select().from(whatsappGroups).where(and(eq(whatsappGroups.id, input.groupId), eq(whatsappGroups.userId, ctx.user.id))).limit(1) : await db.select().from(whatsappGroups).where(and(eq(whatsappGroups.userId, ctx.user.id), eq(whatsappGroups.autoPostingEnabled, true)));\n        if (!groups.length) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Cadastre pelo menos um grupo de destino." });\n        for (const group of groups) {\n          await sendWhatsAppText(session, group.jid, formattedMessage);\n          await db.insert(dispatches).values({ userId: ctx.user.id, offerId: offer.id, groupId: group.id, channelType: "whatsapp", formattedMessage, status: "sent", sentAt: new Date() });\n        }\n        await db.update(offers).set({ status: "published", publishedAt: new Date() }).where(eq(offers.id, offer.id));\n        return { success: true, message: `Oferta enviada para ${groups.length} grupo(s).` };'''
if old2 not in s: raise SystemExit('dispatch marker missing')
s=s.replace(old2,new2,1)
p.write_text(s)
PY
python3 /home/ubuntu/flowpromos/scripts/patch_real_dispatch.py
