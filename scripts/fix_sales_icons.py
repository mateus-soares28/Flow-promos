from pathlib import Path
p=Path('/home/ubuntu/flowpromos/client/src/pages/SalesPage.tsx')
s=p.read_text()
s=s.replace(']].map(([Icon,title,desc]) => <div key={String(title)} className="rounded-3xl border border-white/10 bg-white/[.05] p-6"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-400/15 text-indigo-200"><Icon className="h-5 w-5" />', ']].map(([Icon,title,desc]) => { const StepIcon = Icon as React.ElementType; return <div key={String(title)} className="rounded-3xl border border-white/10 bg-white/[.05] p-6"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-400/15 text-indigo-200"><StepIcon className="h-5 w-5" />')
s=s.replace('text-slate-400">{desc}</p></div>)}</div></div></section>', 'text-slate-400">{desc}</p></div>; })}</div></div></section>')
p.write_text(s)
