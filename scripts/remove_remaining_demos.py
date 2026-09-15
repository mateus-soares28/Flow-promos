from pathlib import Path
routers=Path('/home/ubuntu/flowpromos/server/routers.ts')
s=routers.read_text()
s=s.replace('  seedInitialUserData,\n','')
start=s.find('    simulateConnectionSuccess: protectedProcedure')
if start >= 0:
    end=s.find('    saveConfig: protectedProcedure', start)
    if end < 0: raise SystemExit('saveConfig marker missing')
    s=s[:start]+s[end:]
old='''        const affiliateUrl = `${input.originalUrl}?tag=flowpromos_afiliado_${ctx.user.id}`;\n        await db.insert(offers).values({'''
new='''        const [integration] = await db.select().from(affiliateIntegrations).where(and(eq(affiliateIntegrations.userId, ctx.user.id), eq(affiliateIntegrations.marketplace, input.marketplace as any))).limit(1);\n        if (!integration) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Configure a integração de afiliado antes de cadastrar ofertas." });\n        const affiliateUrl = convertAffiliateLink(input.originalUrl, integration);\n        await db.insert(offers).values({'''
if old in s: s=s.replace(old,new,1)
old2='''          qualityScore: 85,\n          isOfficialStore: true,\n          isFreeShipping: true,'''
s=s.replace(old2,'''          qualityScore: 0,\n          isOfficialStore: false,\n          isFreeShipping: false,''',1)
old3='''        await db.insert(dispatches).values({\n          userId: ctx.user.id,\n          offerId: offer.id,\n          groupId: input.groupId,\n          channelType: "whatsapp",\n          formattedMessage,\n          status: "sent",\n          sentAt: new Date(),\n        });\n        await db\n          .update(offers)\n          .set({ status: "published", publishedAt: new Date() })\n          .where(eq(offers.id, offer.id));\n        return { success: true, message: "Oferta despachada com sucesso para os grupos!" };'''
new3='''        const [session] = await db.select().from(whatsappSessions).where(eq(whatsappSessions.userId, ctx.user.id)).limit(1);\n        if (!session || session.status !== "connected") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Conecte um gateway WhatsApp real antes de disparar." });\n        const groups = input.groupId ? await db.select().from(whatsappGroups).where(and(eq(whatsappGroups.id, input.groupId), eq(whatsappGroups.userId, ctx.user.id))).limit(1) : await db.select().from(whatsappGroups).where(and(eq(whatsappGroups.userId, ctx.user.id), eq(whatsappGroups.autoPostingEnabled, true)));\n        if (!groups.length) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Cadastre pelo menos um grupo de destino." });\n        for (const group of groups) {\n          await sendWhatsAppText(session, group.jid, formattedMessage);\n          await db.insert(dispatches).values({ userId: ctx.user.id, offerId: offer.id, groupId: group.id, channelType: "whatsapp", formattedMessage, status: "sent", sentAt: new Date() });\n        }\n        await db.update(offers).set({ status: "published", publishedAt: new Date() }).where(eq(offers.id, offer.id));\n        return { success: true, message: `Oferta enviada para ${groups.length} grupo(s).` };'''
if old3 in s: s=s.replace(old3,new3,1)
routers.write_text(s)

db=Path('/home/ubuntu/flowpromos/server/db.ts')
d=db.read_text().replace('  await seedInitialUserData(userId);\n','')
db.write_text(d)

home=Path('/home/ubuntu/flowpromos/client/src/pages/Home.tsx')
h=home.read_text().replace('stats?.daysRemaining ?? 3652','stats?.daysRemaining ?? 0').replace('stats?.connectedPhone || "+55 11 98765-4321"','stats?.connectedPhone || "Número não informado"').replace('authUser?.name || "Admin"','authUser?.name || "seu painel"')
home.write_text(h)

layout=Path('/home/ubuntu/flowpromos/client/src/components/FlowLayout.tsx')
l=layout.read_text().replace('daysRemaining = 3652','daysRemaining = 0')
layout.write_text(l)
