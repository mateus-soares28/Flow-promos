from pathlib import Path
p=Path('/home/ubuntu/flowpromos/server/routers.ts')
s=p.read_text()
old='''        const affiliateUrl = `${input.originalUrl}?tag=flowpromos_afiliado_${ctx.user.id}`;'''
new='''        const [integration] = await db.select().from(affiliateIntegrations).where(and(eq(affiliateIntegrations.userId, ctx.user.id), eq(affiliateIntegrations.marketplace, input.marketplace as any))).limit(1);\n        if (!integration) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Configure a integração de afiliado antes de cadastrar ofertas." });\n        const affiliateUrl = convertAffiliateLink(input.originalUrl, integration);'''
s=s.replace(old,new,1)
start=s.find('        await db.insert(dispatches).values({', s.find('dispatchOfferNow'))
end=s.find('      }),\n  }),\n  // Cupons', start)
if start<0 or end<0: raise SystemExit(f'positions missing {start} {end}')
replacement='''        const [session] = await db.select().from(whatsappSessions).where(eq(whatsappSessions.userId, ctx.user.id)).limit(1);\n        if (!session || session.status !== "connected") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Conecte um gateway WhatsApp real antes de disparar." });\n        const groups = input.groupId ? await db.select().from(whatsappGroups).where(and(eq(whatsappGroups.id, input.groupId), eq(whatsappGroups.userId, ctx.user.id))).limit(1) : await db.select().from(whatsappGroups).where(and(eq(whatsappGroups.userId, ctx.user.id), eq(whatsappGroups.autoPostingEnabled, true)));\n        if (!groups.length) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Cadastre pelo menos um grupo de destino." });\n        for (const group of groups) {\n          await sendWhatsAppText(session, group.jid, formattedMessage);\n          await db.insert(dispatches).values({ userId: ctx.user.id, offerId: offer.id, groupId: group.id, channelType: "whatsapp", formattedMessage, status: "sent", sentAt: new Date() });\n        }\n        await db.update(offers).set({ status: "published", publishedAt: new Date() }).where(eq(offers.id, offer.id));\n        return { success: true, message: `Oferta enviada para ${groups.length} grupo(s).` };\n'''
s=s[:start]+replacement+s[end:]
p.write_text(s)

p=Path('/home/ubuntu/flowpromos/server/db.ts')
s=p.read_text()
start=s.find('/**\n * Mantido apenas para compatibilidade')
if start>=0:
    end=s.find('/**\n * Consulta estatísticas',start)
    s=s[:start]+s[end:]
p.write_text(s)
