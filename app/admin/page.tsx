'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

const demoStories = [
  ['The new economics of a hotter world.', 'CLIMATE', 'Published'],
  ["Africa's Next Investment Frontier", 'ECONOMY', 'Published'],
  ['Can AI Make Development More Efficient?', 'TECHNOLOGY', 'Published'],
  ['The Cities Preparing for a Different Future', 'AFRICA', 'Published'],
]

export default function AdminPage() {
  const [drafts, setDrafts] = useState<string[]>([])
  useEffect(() => { try { setDrafts(JSON.parse(localStorage.getItem('ink-verde-drafts') || '[]')) } catch {} }, [])
  return <main className="min-h-screen bg-[#eeeae1] text-ink">
    <header className="border-b border-black/10 bg-ivory"><div className="mx-auto flex h-[76px] max-w-[1400px] items-center justify-between px-5 md:px-8"><div><Link href="/" className="serif text-[27px] font-bold tracking-[-.045em]">INK VERDE</Link><span className="ml-4 text-[9px] font-bold tracking-[.16em] text-verde">EDITORIAL STUDIO</span></div><Link href="/" className="text-[10px] font-bold tracking-[.13em]">VIEW SITE ↗</Link></div></header>
    <div className="mx-auto max-w-[1400px] px-5 py-10 md:px-8 md:py-14"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="eyebrow text-verde">NEWSROOM</p><h1 className="serif mt-2 text-[52px] leading-none tracking-[-.05em]">Good morning, editor.</h1><p className="mt-3 text-sm text-black/55">Write, edit and prepare the next story for Ink Verde.</p></div><Link href="/admin/new" className="w-fit bg-verde px-5 py-3 text-[10px] font-bold tracking-[.13em] text-ivory">+ NEW STORY</Link></div>
      <div className="mt-10 grid gap-4 md:grid-cols-3"><div className="bg-ivory p-6"><p className="eyebrow text-black/45">PUBLISHED</p><p className="serif mt-2 text-4xl">{demoStories.length}</p></div><div className="bg-ivory p-6"><p className="eyebrow text-black/45">DRAFTS</p><p className="serif mt-2 text-4xl">{drafts.length}</p></div><div className="bg-ivory p-6"><p className="eyebrow text-black/45">SECTIONS</p><p className="serif mt-2 text-4xl">06</p></div></div>
      <section className="mt-12 bg-ivory"><div className="border-b border-black/10 px-6 py-5"><p className="eyebrow">STORIES</p></div><div className="divide-y divide-black/10">{demoStories.map(([title, category, status]) => <div key={title} className="grid gap-2 px-6 py-5 md:grid-cols-[1fr_150px_120px] md:items-center"><div><p className="eyebrow text-verde">{category}</p><p className="serif mt-1 text-xl">{title}</p></div><span className="text-[10px] font-bold tracking-[.1em] text-black/45">{status.toUpperCase()}</span><Link href="/admin/new" className="text-[10px] font-bold tracking-[.1em] underline">EDIT</Link></div>)}</div></section>
      <div className="mt-6 border border-dashed border-black/20 bg-ivory/60 p-5 text-[11px] leading-5 text-black/55"><strong className="text-ink">Editorial system foundation:</strong> the writing studio is ready for your workflow. Persistent publishing, secure editor login and image storage will be connected to the database once the Supabase application connection is available to the app.</div>
    </div>
  </main>
}
