'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const sections = ['WORLD', 'ECONOMY', 'CLIMATE', 'TECHNOLOGY', 'AFRICA', 'IDEAS']

export type InitialArticle = {
  id: string
  title: string
  dek: string
  category: string
  body: string
  author: string
  read_time: string
  featured_image: string | null
  status: string
}

type ImageEdit = {
  src: string
  width: number
  height: number
  ratio: number | null
  zoom: number
  x: number
  y: number
  brightness: number
  contrast: number
  saturation: number
  rotation: number
  flip: boolean
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export default function Editor({ initialArticle }: { initialArticle?: InitialArticle }) {
  const router = useRouter()
  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [title, setTitle] = useState(initialArticle?.title || '')
  const [dek, setDek] = useState(initialArticle?.dek || '')
  const [category, setCategory] = useState(initialArticle?.category || 'WORLD')
  const [body, setBody] = useState(initialArticle?.body || '')
  const [author, setAuthor] = useState(initialArticle?.author || 'Ink Verde Editorial')
  const [readTime, setReadTime] = useState(initialArticle?.read_time || '5 min read')
  const [image, setImage] = useState(initialArticle?.featured_image || '')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [preview, setPreview] = useState(false)
  const [imageEditor, setImageEditor] = useState<ImageEdit | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace('/admin/login')
    })
  }, [router])

  function openImageEditor(file: File) {
    const reader = new FileReader()
    reader.onload = () => {
      const src = String(reader.result)
      const img = new Image()
      img.onload = () => setImageEditor({ src, width: img.naturalWidth, height: img.naturalHeight, ratio: 16 / 9, zoom: 1, x: 50, y: 50, brightness: 100, contrast: 100, saturation: 100, rotation: 0, flip: false })
      img.src = src
    }
    reader.readAsDataURL(file)
  }

  function editExistingImage() {
    if (!image) return
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => setImageEditor({ src: image, width: img.naturalWidth || 1600, height: img.naturalHeight || 900, ratio: 16 / 9, zoom: 1, x: 50, y: 50, brightness: 100, contrast: 100, saturation: 100, rotation: 0, flip: false })
    img.src = image
  }

  function formatSelection(prefix: string, suffix = prefix) {
    const el = bodyRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    if (start === end) return
    setBody(body.slice(0, start) + prefix + body.slice(start, end) + suffix + body.slice(end))
  }

  function addLink() {
    const el = bodyRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    if (start === end) return
    const url = window.prompt('Paste the URL for this link:')
    if (!url) return
    setBody(body.slice(0, start) + '[' + body.slice(start, end) + '](' + url + ')' + body.slice(end))
  }

  async function saveImageEdit() {
    if (!imageEditor || !canvasRef.current) return
    setBusy(true)
    setMessage('Processing image…')
    try {
      const canvas = canvasRef.current
      const targetRatio = imageEditor.ratio || imageEditor.width / imageEditor.height
      const outWidth = 1600
      const outHeight = Math.max(1, Math.round(outWidth / targetRatio))
      canvas.width = outWidth
      canvas.height = outHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Could not create image canvas')
      const img = new Image()
      img.crossOrigin = 'anonymous'
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('Could not load image'))
        img.src = imageEditor.src
      })
      ctx.filter = `brightness(${imageEditor.brightness}%) contrast(${imageEditor.contrast}%) saturate(${imageEditor.saturation}%)`
      ctx.save()
      ctx.translate(outWidth / 2, outHeight / 2)
      ctx.rotate((imageEditor.rotation * Math.PI) / 180)
      ctx.scale(imageEditor.flip ? -1 : 1, 1)
      const sourceRatio = imageEditor.width / imageEditor.height
      let drawW: number
      let drawH: number
      if (sourceRatio > targetRatio) {
        drawH = outHeight * imageEditor.zoom
        drawW = drawH * sourceRatio
      } else {
        drawW = outWidth * imageEditor.zoom
        drawH = drawW / sourceRatio
      }
      const offsetX = ((imageEditor.x - 50) / 50) * Math.max(0, drawW - outWidth) / 2
      const offsetY = ((imageEditor.y - 50) / 50) * Math.max(0, drawH - outHeight) / 2
      ctx.drawImage(img, -drawW / 2 + offsetX, -drawH / 2 + offsetY, drawW, drawH)
      ctx.restore()
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9))
      if (!blob) throw new Error('Could not create edited image')
      const path = `articles/${crypto.randomUUID()}.jpg`
      const { error } = await supabase.storage.from('ink-verde-media').upload(path, blob, { contentType: 'image/jpeg', upsert: false })
      if (error) throw error
      const { data } = supabase.storage.from('ink-verde-media').getPublicUrl(path)
      setImage(data.publicUrl)
      setImageEditor(null)
      setMessage('Image edited successfully.')
    } catch (error: any) {
      setMessage(error?.message || 'Image editing failed.')
    } finally {
      setBusy(false)
    }
  }

  async function uploadOriginal(file: File) {
    const path = `articles/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`
    const { error } = await supabase.storage.from('ink-verde-media').upload(path, file, { contentType: file.type || 'image/jpeg', upsert: false })
    if (error) throw error
    const { data } = supabase.storage.from('ink-verde-media').getPublicUrl(path)
    return data.publicUrl
  }

  async function handleSubmit(event: FormEvent, desiredStatus: 'draft' | 'published') {
    event.preventDefault()
    setBusy(true)
    setMessage(desiredStatus === 'published' ? 'Publishing…' : 'Saving draft…')
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) throw new Error('Please sign in again.')
      const now = new Date().toISOString()
      const payload = { title, dek, category, body, author, read_time: readTime, featured_image: image || null, status: desiredStatus, updated_at: now }
      if (initialArticle?.id) {
        const updatePayload: any = { ...payload }
        if (desiredStatus === 'published') updatePayload.published_at = initialArticle.status === 'published' ? undefined : now
        else updatePayload.published_at = null
        const { error } = await supabase.from('articles').update(updatePayload).eq('id', initialArticle.id)
        if (error) throw error
        setMessage(desiredStatus === 'published' ? 'Story published successfully.' : 'Draft saved.')
        if (desiredStatus === 'published') router.push(`/article/${slugify(title)}`)
      } else {
        const { error } = await supabase.from('articles').insert({ ...payload, slug: slugify(title), published_at: desiredStatus === 'published' ? now : null })
        if (error) throw error
        setMessage(desiredStatus === 'published' ? 'Story published successfully.' : 'Draft saved.')
        router.push('/admin')
      }
    } catch (error: any) {
      setMessage(error?.message || 'Could not save story.')
    } finally {
      setBusy(false)
    }
  }

  if (preview) {
    return (
      <main className="min-h-screen bg-[#f7f5ef] px-6 py-12 text-[#111]">
        <div className="mx-auto max-w-3xl">
          <button onClick={() => setPreview(false)} className="mb-10 text-sm underline">← Back to editor</button>
          <div className="text-xs tracking-[0.2em] text-[#244c3a]">{category}</div>
          <h1 className="mt-4 font-serif text-5xl leading-tight">{title || 'Untitled story'}</h1>
          <p className="mt-5 text-xl text-black/60">{dek}</p>
          {image && <img src={image} alt="" className="mt-10 w-full" />}
          <div className="mt-10 whitespace-pre-wrap text-lg leading-8">{body}</div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#eeeae1] text-[#111]">
      <header className="border-b border-black/10 bg-[#f7f5ef] px-6 py-5">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div><Link href="/admin" className="font-serif text-2xl">Ink Verde</Link><div className="text-xs uppercase tracking-[0.2em] text-black/45">Newsroom</div></div>
          <button type="button" onClick={() => setPreview(true)} className="border border-black/20 px-4 py-2 text-sm">Preview</button>
        </div>
      </header>
      <form onSubmit={e => e.preventDefault()} className="mx-auto grid max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[1fr_320px]">
        <section className="space-y-6">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Headline" className="w-full bg-transparent font-serif text-5xl outline-none placeholder:text-black/25" required />
          <textarea value={dek} onChange={e => setDek(e.target.value)} placeholder="Standfirst / dek" className="min-h-24 w-full resize-none bg-transparent text-xl outline-none placeholder:text-black/25" />
          <div className="flex flex-wrap gap-2 border-y border-black/10 py-3">
            <button type="button" onClick={() => formatSelection('**')} className="border px-3 py-1 text-sm font-bold">BOLD</button>
            <button type="button" onClick={() => formatSelection('*')} className="border px-3 py-1 text-sm italic">ITALIC</button>
            <button type="button" onClick={() => formatSelection('<span style="color:#244C3A">','</span>')} className="border px-3 py-1 text-sm text-[#244c3a]">A GREEN</button>
            <button type="button" onClick={() => formatSelection('<span style="color:#8B5E3C">','</span>')} className="border px-3 py-1 text-sm text-[#8b5e3c]">A WARM</button>
            <button type="button" onClick={addLink} className="border px-3 py-1 text-sm">🔗 ADD LINK</button>
          </div>
          <textarea ref={bodyRef} value={body} onChange={e => setBody(e.target.value)} placeholder="Write the story…" className="min-h-[520px] w-full resize-y bg-transparent text-lg leading-8 outline-none placeholder:text-black/25" />
        </section>
        <aside className="space-y-6">
          <div className="bg-[#f7f5ef] p-5">
            <label className="text-xs uppercase tracking-[0.15em] text-black/45">Section</label>
            <select value={category} onChange={e => setCategory(e.target.value)} className="mt-2 w-full border border-black/15 bg-transparent p-3">{sections.map(s => <option key={s}>{s}</option>)}</select>
            <label className="mt-5 block text-xs uppercase tracking-[0.15em] text-black/45">Author</label>
            <input value={author} onChange={e => setAuthor(e.target.value)} className="mt-2 w-full border border-black/15 bg-transparent p-3" />
            <label className="mt-5 block text-xs uppercase tracking-[0.15em] text-black/45">Reading time</label>
            <input value={readTime} onChange={e => setReadTime(e.target.value)} className="mt-2 w-full border border-black/15 bg-transparent p-3" />
          </div>
          <div className="bg-[#f7f5ef] p-5">
            <div className="flex items-center justify-between"><label className="text-xs uppercase tracking-[0.15em] text-black/45">Feature image</label>{image && <button type="button" onClick={editExistingImage} className="text-xs underline">Edit image</button>}</div>
            {image ? <img src={image} alt="Feature" className="mt-4 aspect-video w-full object-cover" /> : <div className="mt-4 grid aspect-video place-items-center border border-dashed border-black/20 text-sm text-black/40">No image yet</div>}
            <input type="file" accept="image/*" className="mt-4 w-full text-sm" onChange={async e => { const file = e.target.files?.[0]; if (!file) return; try { setBusy(true); const url = await uploadOriginal(file); setImage(url); openImageEditor(file); setMessage('Image loaded. Edit it, then save the edit.'); } catch (error: any) { setMessage(error?.message || 'Upload failed.'); } finally { setBusy(false) } }} />
          </div>
          <div className="bg-[#244c3a] p-5 text-[#f7f5ef]">
            <div className="mb-3 text-xs uppercase tracking-[0.15em] text-white/70">Publication</div>
            <div className="grid gap-2">
              <button type="button" disabled={busy} onClick={e => handleSubmit(e as unknown as FormEvent, 'published')} className="w-full bg-[#f7f5ef] px-4 py-3 text-sm font-semibold text-[#111] disabled:opacity-50">{busy ? 'Working…' : 'Publish story'}</button>
              <button type="button" disabled={busy} onClick={e => handleSubmit(e as unknown as FormEvent, 'draft')} className="w-full border border-white/40 px-4 py-3 text-sm text-white disabled:opacity-50">Save as draft</button>
            </div>
            {message && <p className="mt-3 text-xs text-white/80">{message}</p>}
          </div>
        </aside>
      </form>
      {imageEditor && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black/70 p-4">
          <div className="mx-auto max-w-5xl bg-[#f7f5ef] p-6">
            <div className="flex items-center justify-between"><h2 className="font-serif text-2xl">Edit feature image</h2><button type="button" onClick={() => setImageEditor(null)}>Close</button></div>
            <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_320px]">
              <div className="bg-black p-3"><img src={imageEditor.src} alt="Editing preview" className="mx-auto max-h-[60vh] max-w-full object-contain" style={{ filter: `brightness(${imageEditor.brightness}%) contrast(${imageEditor.contrast}%) saturate(${imageEditor.saturation}%)`, transform: `rotate(${imageEditor.rotation}deg) scaleX(${imageEditor.flip ? -1 : 1}) scale(${imageEditor.zoom})` }} /></div>
              <div className="space-y-4 text-sm">
                <label className="block">Crop ratio<select value={imageEditor.ratio ?? ''} onChange={e => setImageEditor({ ...imageEditor, ratio: e.target.value ? Number(e.target.value) : null })} className="mt-1 w-full border p-2"><option value="">FREE</option><option value={1}>1:1</option><option value={4 / 3}>4:3</option><option value={3 / 4}>3:4</option><option value={16 / 9}>16:9</option></select></label>
                <label className="block">Zoom<input type="range" min="1" max="3" step="0.1" value={imageEditor.zoom} onChange={e => setImageEditor({ ...imageEditor, zoom: Number(e.target.value) })} className="w-full" /></label>
                <label className="block">Horizontal position<input type="range" min="0" max="100" value={imageEditor.x} onChange={e => setImageEditor({ ...imageEditor, x: Number(e.target.value) })} className="w-full" /></label>
                <label className="block">Vertical position<input type="range" min="0" max="100" value={imageEditor.y} onChange={e => setImageEditor({ ...imageEditor, y: Number(e.target.value) })} className="w-full" /></label>
                <label className="block">Brightness<input type="range" min="50" max="150" value={imageEditor.brightness} onChange={e => setImageEditor({ ...imageEditor, brightness: Number(e.target.value) })} className="w-full" /></label>
                <label className="block">Contrast<input type="range" min="50" max="150" value={imageEditor.contrast} onChange={e => setImageEditor({ ...imageEditor, contrast: Number(e.target.value) })} className="w-full" /></label>
                <label className="block">Saturation<input type="range" min="0" max="200" value={imageEditor.saturation} onChange={e => setImageEditor({ ...imageEditor, saturation: Number(e.target.value) })} className="w-full" /></label>
                <div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => setImageEditor({ ...imageEditor, rotation: (imageEditor.rotation + 90) % 360 })} className="border px-3 py-2">Rotate 90°</button><button type="button" onClick={() => setImageEditor({ ...imageEditor, flip: !imageEditor.flip })} className="border px-3 py-2">Flip</button></div>
                <button type="button" onClick={() => setImageEditor({ ...imageEditor, ratio: 16 / 9, zoom: 1, x: 50, y: 50, brightness: 100, contrast: 100, saturation: 100, rotation: 0, flip: false })} className="w-full border px-3 py-2">Reset edits</button>
                <div className="grid grid-cols-2 gap-2 pt-2"><button type="button" onClick={() => setImageEditor(null)} className="border px-3 py-2">Cancel</button><button type="button" disabled={busy} onClick={saveImageEdit} className="bg-[#244c3a] px-3 py-2 text-white">Save image</button></div>
              </div>
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </div>
        </div>
      )}
    </main>
  )
}
