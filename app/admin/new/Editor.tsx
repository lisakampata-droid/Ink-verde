'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const sections = ['WORLD', 'ECONOMY', 'CLIMATE', 'TECHNOLOGY', 'AFRICA', 'IDEAS']

type InitialArticle = {
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
      img.onload = () => {
        setImageEditor({ src, width: img.naturalWidth, height: img.naturalHeight, ratio: 16 / 9, zoom: 1, x: 50, y: 50, brightness: 100, contrast: 100, saturation: 100, rotation: 0, flip: false })
      }
      img.src = src
    }
    reader.readAsDataURL(file)
  }

  function editExistingImage() {
    if (!image) return
    const img = new Image()
    img.onload = () => {
      setImageEditor({ src: image, width: img.naturalWidth || 1600, height: img.naturalHeight || 900, ratio: 16 / 9, zoom: 1, x: 50, y: 50, brightness: 100, contrast: 100, saturation: 100, rotation: 0, flip: false })
    }
    img.src = image
  }

  function updateImage<K extends keyof ImageEdit>(key: K, value: ImageEdit[K]) {
    setImageEditor((current) => current ? { ...current, [key]: value } : current)
  }

  function chooseRatio(ratio: number | null) {
    setImageEditor((current) => current ? { ...current, ratio } : current)
  }

  function resetImage() {
    setImageEditor((current) => current ? { ...current, ratio: 16 / 9, zoom: 1, x: 50, y: 50, brightness: 100, contrast: 100, saturation: 100, rotation: 0, flip: false } : current)
  }

  function renderEditedImage(): Promise<Blob | null> {
    return new Promise((resolve) => {
      const edit = imageEditor
      if (!edit) return resolve(null)
      const img = new Image()
      img.onload = () => {
        const canvas = canvasRef.current || document.createElement('canvas')
        const width = 1600
        const height = edit.ratio ? Math.round(width / edit.ratio) : Math.min(1600, Math.max(400, edit.height))
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) return resolve(null)

        ctx.filter = `brightness(${edit.brightness}%) contrast(${edit.contrast}%) saturate(${edit.saturation}%)`
        ctx.save()
        ctx.translate(width / 2, height / 2)
        ctx.rotate((edit.rotation * Math.PI) / 180)
        ctx.scale(edit.flip ? -1 : 1, 1)

        const scale = Math.max(width / img.naturalWidth, height / img.naturalHeight) * edit.zoom
        const drawWidth = img.naturalWidth * scale
        const drawHeight = img.naturalHeight * scale
        const maxX = Math.max(0, (drawWidth - width) / 2)
        const maxY = Math.max(0, (drawHeight - height) / 2)
        const offsetX = ((edit.x - 50) / 50) * maxX
        const offsetY = ((edit.y - 50) / 50) * maxY

        ctx.drawImage(img, -drawWidth / 2 + offsetX, -drawHeight / 2 + offsetY, drawWidth, drawHeight)
        ctx.restore()
        canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.9)
      }
      img.onerror = () => resolve(null)
      img.src = edit.src
    })
  }

  async function saveImageEdits() {
    if (!imageEditor) return
    setBusy(true)
    setMessage('Processing image…')
    const blob = await renderEditedImage()
    if (!blob) {
      setMessage('Could not process this image. Please try again.')
      setBusy(false)
      return
    }
    const path = `articles/${crypto.randomUUID()}.jpg`
    const { error } = await supabase.storage.from('ink-verde-media').upload(path, blob, { contentType: 'image/jpeg', upsert: false })
    if (error) {
      setMessage(error.message)
      setBusy(false)
      return
    }
    const { data } = supabase.storage.from('ink-verde-media').getPublicUrl(path)
    setImage(data.publicUrl)
    setImageEditor(null)
    setMessage('Image saved and ready.')
    setBusy(false)
  }

  function wrapSelection(prefix: string, suffix: string = prefix) {
    const el = bodyRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    if (start === end) {
      setMessage('Highlight the words you want to format first.')
      return
    }
    const selected = body.slice(start, end)
    const replacement = `${prefix}${selected}${suffix}`
    setBody(body.slice(0, start) + replacement + body.slice(end))
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(start + prefix.length, start + prefix.length + selected.length)
    })
  }

  function addLink() {
    const el = bodyRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    if (start === end) {
      setMessage('Highlight the words you want to link first.')
      return
    }
    const selected = body.slice(start, end)
    const entered = window.prompt('Paste the source URL:', 'https://')
    if (!entered) return
    let href = entered.trim()
    if (!/^https?:\/\//i.test(href)) href = `https://${href}`
    const linked = `[${selected}](${href})`
    setBody(body.slice(0, start) + linked + body.slice(end))
    setMessage('Link added.')
  }

  function insertColor(color: string) {
    const el = bodyRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    if (start === end) {
      setMessage('Highlight the words you want to colour first.')
      return
    }
    const selected = body.slice(start, end)
    const replacement = `<span style="color:${color}">${selected}</span>`
    setBody(body.slice(0, start) + replacement + body.slice(end))
    setMessage('Text colour added.')
  }

  async function save(status: 'draft' | 'published') {
    if (!title.trim() || !body.trim()) {
      setMessage('Add a headline and story before saving.')
      return
    }
    setBusy(true)
    setMessage(status === 'published' ? 'Publishing…' : 'Saving draft…')

    const payload = {
      title: title.trim(),
      dek: dek.trim(),
      category,
      body: body.trim(),
      author: author.trim() || 'Ink Verde Editorial',
      read_time: readTime,
      featured_image: image || null,
      status,
      published_at: status === 'published' ? (initialArticle?.status === 'published' ? undefined : new Date().toISOString()) : null,
      updated_at: new Date().toISOString(),
    }

    let error: any
    let slug = initialArticle?.id ? undefined : `${slugify(title)}-${Date.now().toString().slice(-6)}`
    if (initialArticle?.id) {
      const result = await supabase.from('articles').update(payload).eq('id', initialArticle.id)
      error = result.error
      slug = (await supabase.from('articles').select('slug').eq('id', initialArticle.id).single()).data?.slug
    } else {
      const result = await supabase.from('articles').insert({ ...payload, slug })
      error = result.error
    }

    if (error) {
      setMessage(error.message)
      setBusy(false)
      return
    }
    setMessage(status === 'published' ? 'Published. The story is now live.' : 'Draft saved.')
    setBusy(false)
    if (status === 'published' && slug) router.push(`/article/${slug}`)
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    await save('draft')
  }

  return (
    <main className="min-h-screen bg-[#eeeae1] text-ink">
      <header className="border-b border-black/10 bg-ivory">
        <div className="mx-auto flex h-[76px] max-w-[1200px] items-center justify-between px-5 md:px-8">
          <Link href="/admin" className="serif text-[27px] font-bold tracking-[-.045em]">INK VERDE</Link>
          <Link href="/" className="text-[10px] font-bold tracking-[.13em]">VIEW SITE ↗</Link>
        </div>
      </header>

      <div className="mx-auto max-w-[900px] px-5 py-10 md:px-8 md:py-16">
        <Link href="/admin" className="text-[10px] font-bold tracking-[.12em]">← NEWSROOM</Link>
        <p className="eyebrow mt-10 text-verde">{initialArticle ? 'EDIT STORY' : 'NEW STORY'}</p>
        <h1 className="serif mt-2 text-[50px] leading-none tracking-[-.05em]">{initialArticle ? 'Refine the story.' : 'Write the next story.'}</h1>

        <form onSubmit={submit} className="mt-10 space-y-7 bg-ivory p-6 md:p-10">
          <label className="block"><span className="eyebrow">SECTION</span><select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-2 w-full border-b border-black/20 bg-transparent py-3 text-sm outline-none">{sections.map((section) => <option key={section}>{section}</option>)}</select></label>
          <label className="block"><span className="eyebrow">HEADLINE</span><input required value={title} onChange={(e) => setTitle(e.target.value)} className="mt-2 w-full border-b border-black/20 bg-transparent py-3 font-serif text-3xl outline-none" placeholder="Write a strong headline…" /></label>
          <label className="block"><span className="eyebrow">DEK</span><textarea value={dek} onChange={(e) => setDek(e.target.value)} rows={2} className="mt-2 w-full border-b border-black/20 bg-transparent py-3 text-base leading-6 outline-none" placeholder="One or two sentences that frame the story…" /></label>

          <div>
            <span className="eyebrow">FEATURE IMAGE</span>
            <div className="mt-2 flex flex-wrap gap-3">
              <label className="cursor-pointer border border-black/20 px-5 py-3 text-[10px] font-bold tracking-[.13em]">{busy ? 'WORKING…' : 'UPLOAD FROM GALLERY'}<input type="file" accept="image/*" className="hidden" disabled={busy} onChange={(e) => { const file = e.target.files?.[0]; if (file) openImageEditor(file); e.currentTarget.value = '' }} /></label>
              {image && <button type="button" onClick={editExistingImage} disabled={busy} className="border border-black/20 px-5 py-3 text-[10px] font-bold tracking-[.13em] disabled:opacity-50">EDIT IMAGE</button>}
              {image && <span className="self-center text-[11px] text-verde">✓ Image ready</span>}
            </div>
            {image && <img src={image} alt="Selected feature" className="mt-4 aspect-[16/8] w-full object-cover" />}
            <p className="mt-2 text-[11px] leading-5 text-black/50">Upload first, then choose the crop, position, size and visual adjustments yourself.</p>
          </div>

          <label className="block"><span className="eyebrow">AUTHOR</span><input value={author} onChange={(e) => setAuthor(e.target.value)} className="mt-2 w-full border-b border-black/20 bg-transparent py-3 text-sm outline-none" /></label>
          <label className="block"><span className="eyebrow">READING TIME</span><input value={readTime} onChange={(e) => setReadTime(e.target.value)} className="mt-2 w-full border-b border-black/20 bg-transparent py-3 text-sm outline-none" /></label>

          <div>
            <span className="eyebrow">STORY</span>
            <div className="mt-2 flex flex-wrap items-center gap-2 border border-black/10 border-b-0 bg-white/70 px-3 py-2">
              <button type="button" onClick={() => wrapSelection('**')} className="border border-black/15 px-3 py-2 text-[10px] font-bold tracking-[.1em]"><strong>B</strong> BOLD</button>
              <button type="button" onClick={() => wrapSelection('*')} className="border border-black/15 px-3 py-2 text-[10px] font-bold italic tracking-[.1em]"><em>I</em> ITALIC</button>
              <button type="button" onClick={() => insertColor('#244C3A')} className="border border-black/15 px-3 py-2 text-[10px] font-bold tracking-[.1em] text-verde">A GREEN</button>
              <button type="button" onClick={() => insertColor('#8B5E3C')} className="border border-black/15 px-3 py-2 text-[10px] font-bold tracking-[.1em]">A WARM</button>
              <button type="button" onClick={addLink} className="border border-black/15 px-3 py-2 text-[10px] font-bold tracking-[.1em]">🔗 ADD LINK</button>
              <span className="text-[10px] text-black/45">Highlight text first, then choose a style.</span>
            </div>
            <textarea ref={bodyRef} required value={body} onChange={(e) => setBody(e.target.value)} rows={18} className="w-full border border-black/10 bg-white/50 p-4 text-[16px] leading-8 outline-none" placeholder="Start writing… Separate paragraphs with blank lines." />
          </div>

          {preview && <div className="border-t border-black/10 pt-7"><p className="eyebrow text-verde">PREVIEW</p><h2 className="serif mt-3 text-4xl leading-none">{title || 'Your headline'}</h2><p className="mt-4 text-sm leading-6 text-black/60">{dek}</p><div className="mt-5 space-y-5 text-[16px] leading-8">{body.split(/\n\s*\n/).filter(Boolean).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div></div>}

          <div className="flex flex-wrap items-center gap-3 border-t border-black/10 pt-6">
            <button type="submit" disabled={busy} className="border border-black/20 px-5 py-3 text-[10px] font-bold tracking-[.13em] disabled:opacity-50">SAVE DRAFT</button>
            <button type="button" onClick={() => setPreview(!preview)} className="border border-black/20 px-5 py-3 text-[10px] font-bold tracking-[.13em]">{preview ? 'HIDE PREVIEW' : 'PREVIEW'}</button>
            <button type="button" disabled={busy} onClick={() => save('published')} className="bg-ink px-5 py-3 text-[10px] font-bold tracking-[.13em] text-ivory disabled:opacity-50">PUBLISH LIVE</button>
            {message && <span className="text-[11px] text-verde">{message}</span>}
          </div>
        </form>
      </div>

      {imageEditor && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 p-4 md:p-8">
          <div className="mx-auto max-w-[1100px] overflow-hidden bg-ivory shadow-2xl">
            <div className="flex items-start justify-between border-b rule px-6 py-5">
              <div><h2 className="serif text-3xl">Edit Image</h2><p className="mt-1 text-xs text-black/55">Crop, resize, reposition and adjust your photo before saving it.</p></div>
              <button type="button" onClick={() => setImageEditor(null)} className="text-2xl">×</button>
            </div>

            <div className="grid md:grid-cols-[1.1fr_.9fr]">
              <div className="bg-[#222] p-5 md:p-8">
                <div className="relative mx-auto aspect-[16/10] max-h-[65vh] overflow-hidden bg-black">
                  <img src={imageEditor.src} alt="Crop preview" className="absolute left-1/2 top-1/2 max-w-none" style={{ width: `${imageEditor.zoom * 100}%`, transform: `translate(-${imageEditor.x}%, -${imageEditor.y}%) rotate(${imageEditor.rotation}deg) scaleX(${imageEditor.flip ? -1 : 1})`, filter: `brightness(${imageEditor.brightness}%) contrast(${imageEditor.contrast}%) saturate(${imageEditor.saturation}%)` }} />
                  <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-30"><div className="border-r border-b border-white" /><div className="border-r border-b border-white" /><div className="border-b border-white" /><div className="border-r border-b border-white" /><div className="border-r border-b border-white" /><div className="border-b border-white" /><div className="border-r border-white" /><div className="border-r border-white" /><div /></div>
                </div>
                <p className="mt-3 text-center text-[10px] tracking-[.12em] text-white/60">DRAG CONTROLS ON THE RIGHT TO FRAME THE PHOTO</p>
              </div>

              <div className="space-y-6 p-6 md:p-8">
                <div><p className="eyebrow">CROP RATIO</p><div className="mt-2 grid grid-cols-5 gap-2">{[[null, 'FREE'], [1, '1:1'], [4 / 3, '4:3'], [3 / 4, '3:4'], [16 / 9, '16:9']].map(([value, label]) => <button key={label as string} type="button" onClick={() => chooseRatio(value as number | null)} className={`border px-2 py-3 text-[10px] font-bold ${imageEditor.ratio === value ? 'border-verde text-verde' : 'border-black/15'}`}>{label as string}</button>)}</div></div>
                <label className="block"><span className="eyebrow">ZOOM</span><input className="mt-2 w-full" type="range" min="1" max="3" step="0.01" value={imageEditor.zoom} onChange={(e) => updateImage('zoom', Number(e.target.value))} /></label>
                <label className="block"><span className="eyebrow">HORIZONTAL POSITION</span><input className="mt-2 w-full" type="range" min="0" max="100" value={imageEditor.x} onChange={(e) => updateImage('x', Number(e.target.value))} /></label>
                <label className="block"><span className="eyebrow">VERTICAL POSITION</span><input className="mt-2 w-full" type="range" min="0" max="100" value={imageEditor.y} onChange={(e) => updateImage('y', Number(e.target.value))} /></label>
                <label className="block"><span className="eyebrow">BRIGHTNESS</span><input className="mt-2 w-full" type="range" min="50" max="150" value={imageEditor.brightness} onChange={(e) => updateImage('brightness', Number(e.target.value))} /></label>
                <label className="block"><span className="eyebrow">CONTRAST</span><input className="mt-2 w-full" type="range" min="50" max="150" value={imageEditor.contrast} onChange={(e) => updateImage('contrast', Number(e.target.value))} /></label>
                <label className="block"><span className="eyebrow">SATURATION</span><input className="mt-2 w-full" type="range" min="0" max="180" value={imageEditor.saturation} onChange={(e) => updateImage('saturation', Number(e.target.value))} /></label>
                <div className="flex flex-wrap gap-2"><button type="button" onClick={() => updateImage('rotation', (imageEditor.rotation + 90) % 360)} className="border border-black/15 px-4 py-2 text-[10px] font-bold">↻ ROTATE</button><button type="button" onClick={() => updateImage('flip', !imageEditor.flip)} className="border border-black/15 px-4 py-2 text-[10px] font-bold">↔ FLIP</button><button type="button" onClick={resetImage} className="border border-black/15 px-4 py-2 text-[10px] font-bold">RESET</button></div>
                <div className="border-t rule pt-5"><p className="text-xs leading-5 text-black/55">The original upload is kept separate. Saving creates a prepared feature image, so you can experiment without losing the original.</p></div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t rule px-6 py-5"><button type="button" onClick={() => setImageEditor(null)} className="border border-black/20 px-5 py-3 text-[10px] font-bold tracking-[.13em]">CANCEL</button><button type="button" onClick={saveImageEdits} disabled={busy} className="bg-verde px-5 py-3 text-[10px] font-bold tracking-[.13em] text-ivory disabled:opacity-50">{busy ? 'SAVING…' : 'SAVE IMAGE'}</button></div>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </main>
  )
}
