from pathlib import Path
p=Path('/home/ubuntu/flowpromos/client/src/pages/SalesPage.tsx')
s=p.read_text()
s=s.replace('["Cliques","12.480","text-indigo-600"],["Conversões","684","text-emerald-600"],["Comissões","R$ 8.942","text-slate-900"]', '["Cliques","Ao vivo","text-indigo-600"],["Conversões","Confirmadas","text-emerald-600"],["Comissões","Por venda","text-slate-900"]')
s=s.replace('text-lg font-black ${color}', 'text-sm font-black ${color}')
p.write_text(s)
