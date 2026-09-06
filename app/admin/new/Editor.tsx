'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const sections = ['WORLD','ECONOMY','CLIMATE','TECHNOLOGY','AFRICA','IDEAS']

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export default function Editor() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [dek, setDek] = useState('')
  const [category, setCategory] = useState('WORLD')
  const [body, setBody] = useState('')
  const [author, setAuthor] = useState('Ink Verde Editorial')
  const [readTime, setReadTime] = useState('5 min read')
  const [image, setImage] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (!data.session) router.replace('/admin/login') })
  }, [router])

  async function uploadImage(file: File) {
    setBusy(true); setMessage('Uploading image…')
    const extension = file.name.split('.').pop() || 'jpg'
    const path = `articles/${crypto.randomUUID()}.${extension}`
    const { error } = await supabase.storage.from('ink-verde-media').upload(path, file, { contentType: file.type, upsert: false })
    if (error) { setMessage(error.message); setBusy(false); return }
    const { data } = supabase.storage.from('ink-verde-media').getPublicUrl(path)
    setImage(data.publicUrl); setMessage('Image uploaded.')
    setBusy(false)
  }

  async function save(status: 'draft' | 'published') {
    if (!title.trim() || !body.trim()) { setMessage('Add a headline and story before saving.'); return }
    setBusy(true); setMessage(status === 'published' ? 'Publishing…' : 'Saving draft…')
    const slug = `${slugify(title)}-${Date.now().toString().slice(-6)}`
    const { error } = await supabase.from('articles').insert({ slug, title: title.trim(), dek: dek.trim(), category, body: body.trim(), author: author.trim() || 'Ink Verde Editorial', read_time: readTime, featured_image: image || null, status, published_at: status === 'published' ? new Date().toISOString() : null })
    if (error) { setMessage(error.message); setBusy(false); return }
    setMessage(status === 'published' ? 'Published. The story is now live.' : 'Draft saved.')
    setBusy(false)
    if (status === 'published') router.push(`/article/${slug}`)
  }

  async function submit(e: FormEvent) { e.preventDefault(); await save('draft') }

  return <main className="min-h-screen bg-[#eeeae1] text-ink">
    <header className="border-b border-black/10 bg-ivory"><div className="mx-auto flex h-[76px] max-w-[1200px] items-center justify-between px-5 md:px-8"><Link href="/admin" className="serif text-[27px] font-bold tracking-[-.045em]">INK VERDE</Link><Link href="/" className="text-[10px] font-bold tracking-[.13em]">VIEW SITE ↗</Link></div></header>
    <div className="mx-auto max-w-[900px] px-5 py-10 md:px-8 md:py-16">
      <Link href="/admin" className="text-[10px] font-bold tracking-[.12em]">← NEWSROOM</Link>
      <p className="eyebrow mt-10 text-verde">NEW STORY</p><h1 className="serif mt-2 text-[50px] leading-none tracking-[-.05em]">Write the next story.</h1>
      <form onSubmit={submit} className="mt-10 space-y-7 bg-ivory p-6 md:p-10">
        <label className="block"><span className="eyebrow">SECTION</span><select value={category} onChange={e=>setCategory(e.target.value)} className="mt-2 w-full border-b border-black/20 bg-transparent py-3 text-sm outline-none">{sections.map(x=><option key={x}>{x}</option>)}</select></label>
        <label className="block"><span className="eyebrow">HEADLINE</span><input required value={title} onChange={e=>setTitle(e.target.value)} className="mt-2 w-full border-b border-black/20 bg-transparent py-3 font-serif text-3xl outline-none" placeholder="Write a strong headline…" /></label>
        <label className="block"><span className="eyebrow">DEK</span><textarea value={dek} onChange={e=>setDek(e.target.value)} rows={2} className="mt-2 w-full border-b border-black/20 bg-transparent py-3 text-base leading-6 outline-none" placeholder="One or two sentences that frame the story…" /></label>
        <div><span className="eyebrow">FEATURE IMAGE</span><div className="mt-2 flex flex-wrap gap-3"><label className="cursor-pointer border border-black/20 px-5 py-3 text-[10px] font-bold tracking-[.13em]">{busy ? 'UPLOADING…' : 'UPLOAD FROM GALLERY'}<input type="file" accept="image/*" className="hidden" disabled={busy} onChange={e=>{const file=e.target.files?.[0]; if(file) uploadImage(file)}} /></label>{image && <span className="self-center text-[11px] text-verde">✓ Image ready</span>}</div>{image && <img src={image} alt="Selected feature" className="mt-4 aspect-[16/8] w-full object-cover" />}</div>
        <label className="block"><span className="eyebrow">AUTHOR</span><input value={author} onChange={e=>setAuthor(e.target.value)} className="mt-2 w-full border-b border-black/20 bg-transparent py-3 text-sm outline-none" /></label>
        <label className="block"><span className="eyebrow">READING TIME</span><input value={readTime} onChange={e=>setReadTime(e.target.value)} className="mt-2 w-full border-b border-black/20 bg-transparent py-3 text-sm outline-none" /></label>
        <label className="block"><span className="eyebrow">STORY</span><textarea required value={body} onChange={e=>setBody(e.target.value)} rows={18} className="mt-2 w-full border border-black/10 bg-white/50 p-4 text-[16px] leading-8 outline-none" placeholder="Start writing… Separate paragraphs with blank lines." /></label>
        <div className="flex flex-wrap items-center gap-3 border-t border-black/10 pt-6"><button type="submit" disabled={busy} className="border border-black/20 px-5 py-3 text-[10px] font-bold tracking-[.13em] disabled:opacity-50">SAVE DRAFT</button><button type="button" disabled={busy} onClick={()=>save('published')} className="bg-ink px-5 py-3 text-[10px] font-bold tracking-[.13em] text-ivory disabled:opacity-50">PUBLISH LIVE</button>{message && <span className="text-[11px] text-verde">{message}</span>}</div>
      </form>
      <p className="mt-5 text-[11px] leading-5 text-black/50">Published stories are public. Editorial tools remain behind login.</p>
    </div>
  </main>
}
