from pathlib import Path
p=Path('/home/ubuntu/flowpromos/client/src/pages/SalesPage.tsx')
s=p.read_text().replace('<h3 className="mt-5 text-lg font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{desc}</p>', '<h3 className="mt-5 text-lg font-bold">{String(title)}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{String(desc)}</p>')
p.write_text(s)
