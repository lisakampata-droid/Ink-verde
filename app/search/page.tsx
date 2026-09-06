import Link from 'next/link'
import { articles } from '@/lib/articles'

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = '' } = await searchParams
  const term = q.trim().toLowerCase()
  const results = term ? articles.filter(a => `${a.title} ${a.dek} ${a.category}`.toLowerCase().includes(term)) : articles

  return <main className="min-h-screen bg-ivory">
    <header className="border-b rule"><div className="mx-auto flex h-[74px] max-w-[1200px] items-center justify-between px-5 md:px-8"><Link href="/" className="serif text-[28px] font-bold tracking-[-.045em]">INK VERDE</Link><Link href="/" className="text-[10px] font-bold tracking-[.13em]">HOME</Link></div></header>
    <div className="mx-auto max-w-[1000px] px-5 py-14 md:px-8 md:py-20">
      <p className="eyebrow text-verde">SEARCH INK VERDE</p>
      <h1 className="serif mt-3 text-[54px] leading-none tracking-[-.05em] md:text-[76px]">Find a story.</h1>
      <form className="mt-10 flex gap-2 border-b-2 border-ink pb-3" action="/search"><input name="q" defaultValue={q} autoFocus aria-label="Search Ink Verde" placeholder="Search stories, ideas, topics…" className="min-w-0 flex-1 bg-transparent text-lg outline-none"/><button className="bg-ink px-5 py-3 text-[10px] font-bold tracking-[.13em] text-ivory">SEARCH</button></form>
      <p className="mt-8 text-[10px] font-bold tracking-[.12em] text-black/45">{term ? `${results.length} RESULT${results.length === 1 ? '' : 'S'}` : 'LATEST STORIES'}</p>
      <div className="mt-5 divide-y rule border-t rule">{results.map(article => <Link key={article.slug} href={`/article/${article.slug}`} className="block py-7 hover:bg-black/[.02]"><p className="eyebrow text-verde">{article.category}</p><h2 className="serif mt-2 text-[31px] leading-none tracking-[-.03em]">{article.title}</h2><p className="mt-3 max-w-2xl text-[14px] leading-6 text-black/60">{article.dek}</p></Link>)}{!results.length && <p className="py-10 text-sm text-black/60">No stories matched “{q}”. Try another search.</p>}</div>
    </div>
  </main>
}
