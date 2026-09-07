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
  file: File | null
  ratio: number | null
  zoom: number
  x: number
  y: number
  brightness: number
  contrast: number
  saturation: number
  rotation: number
  flip: boolean
  outputWidth: number
  outputHeight: number
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
      setImageEditor({
        src: String(reader.result),
        file,
        ratio: null,
        zoom: 1,
        x: 50,
        y: 50,
        brightness: 100,
        contrast: 100,
        saturation: 100,
        rotation: 0,
        flip: false,
        outputWidth: 1600,
        outputHeight: 900,
      })
    }
    reader.readAsDataURL(file)
  }

  function editExistingImage() {
    if (!image) return
    setImageEditor({
      src: image,
      file: null,
      ratio: null,
      zoom: 1,
      x: 50,
      y: 50,
      brightness: 100,
      contrast: 100,
      saturation: 100,
      rotation: 0,
      flip: false,
      outputWidth: 1600,
      outputHeight: 900,
    })
  }

  function updateEdit<K extends keyof ImageEdit>(key: K, value: ImageEdit[K]) {
    setImageEditor((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  function setRatio(ratio: number | null) {
    setImageEditor((prev) => {
      if (!prev) return prev
      return ratio === null
        ? { ...prev, ratio: null }
        : { ...prev, ratio, outputHeight: Math.round(prev.outputWidth / ratio) }
    })
  }

  function drawEditedImage(): Promise<Blob | null> {
    return new Promise((resolve) => {
      const edit = imageEditor
      if (!edit) return resolve(null)
      const img = new Image()
      img.onload = () => {
        const canvas = canvasRef.current || document.createElement('canvas')
        const width = Math.max(320, Math.min(4000, Math.round(edit.outputWidth)))
        const height = edit.ratio
          ? Math.round(width / edit.ratio)
          : Math.max(240, Math.min(4000, Math.round(edit.outputHeight)))
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) return resolve(null)

        ctx.filter = `brightness(${edit.brightness}%) contrast(${edit.contrast}%) saturate(${edit.saturation}%)`
        ctx.save()
        ctx.translate(width / 2, height / 2)
        ctx.rotate((edit.rotation * Math.PI) / 180)
        ctx.scale(edit.flip ? -1 : 1, 1)

        const scale = Math.max(width / img.width, height / img.height) * edit.zoom
        const drawWidth = img.width * scale
        const drawHeight = img.height * scale
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
    const blob = await drawEditedImage()
    if (!blob) {
      setMessage('Could not process image.')
      setBusy(false)
      return
    }

    const path = `articles/${crypto.randomUUID()}.jpg`
    const { error } = await supabase.storage.from('ink-verde-media').upload(path, blob, {
      contentType: 'image/jpeg',
      upsert: false,
    })
    if (error) {
      setMessage(error.message)
      setBusy(false)
      return
    }

    const { data } = supabase.storage.from('ink-verde-media').getPublicUrl(path)
    setImage(data.publicUrl)
    setImageEditor(null)
    setMessage('Image edited and ready.')
    setBusy(false)
  }

  function resetImage() {
    setImageEditor((prev) =>
      prev
        ? {
            ...prev,
            ratio: null,
            zoom: 1,
            x: 50,
            y: 50,
            brightness: 100,
            contrast: 100,
            saturation: 100,
            rotation: 0,
            flip: false,
            outputWidth: 1600,
            outputHeight: 900,
          }
        : prev,
    )
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
    const url = window.prompt('Paste the source URL:', 'https://')
    if (!url) return
    let href = url.trim()
    if (!/^https?:\/\//i.test(href)) href = `https://${href}`
    const linked = `[${selected}](${href})`
    setBody(body.slice(0, start) + linked + body.slice(end))
    setMessage('Link added.')
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(start + linked.length, end + linked.length)
    })
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
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(start + replacement.length, start + replacement.length + selected.length)
    })
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
      published_at:
        status === 'published'
          ? initialArticle?.status === 'published'
            ? undefined
            : new Date().toISOString()
          : null,
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

  async function submit(e: FormEvent) {
    e.preventDefault()
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
          <label className="block">
            <span className="eyebrow">SECTION</span>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-2 w-full border-b border-black/20 bg-transparent py-3 text-sm outline-none">
              {sections.map((section) => <option key={section}>{section}</option>)}
            </select>
          </label>

          <label className="block">
            <span className="eyebrow">HEADLINE</span>
            <input required value={title} onChange={(e) => setTitle(e.target.value)} className="mt-2 w-full border-b border-black/20 bg-transparent py-3 font-serif text-3xl outline-none" placeholder="Write a strong headline…" />
          </label>

          <label className="block">
            <span className="eyebrow">DEK</span>
            <textarea value={dek} onChange={(e) => setDek(e.target.value)} rows={2} className="mt-2 w-full border-b border-black/20 bg-transparent py-3 text-base leading-6 outline-none" placeholder="One or two sentences that frame the story…" />
          </label>

          <div>
            <span className="eyebrow">FEATURE IMAGE</span>
            <div className="mt-2 flex flex-wrap gap-3">
              <label className="cursor-pointer border border-black/20 px-5 py-3 text-[10px] font-bold tracking-[.13em]">
                {busy ? 'WORKING…' : 'UPLOAD FROM GALLERY'}
                <input type="file" accept="image/*" className="hidden" disabled={busy} onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) openImageEditor(file)
                  e.currentTarget.value = ''
                }} />
              </label>
              {image && <button type="button" onClick={editExistingImage} disabled={busy} className="border border-black/20 px-5 py-3 text-[10px] font-bold tracking-[.13em] disabled:opacity-50">EDIT IMAGE</button>}
              {image && <span className="self-center text-[11px] text-verde">✓ Image ready</span>}
            </div>
            {image && <img src={image} alt="Selected feature" className="mt-4 aspect-[16/8] w-full object-cover" />}
            <p className="mt-2 text-[11px] leading-5 text-black/50">Upload an image, then crop, resize, reposition, rotate, flip and adjust it before saving.</p>
          </div>

          <label className="block">
            <span className="eyebrow">AUTHOR</span>
            <input value={author} onChange={(e) => setAuthor(e.target.value)} className="mt-2 w-full border-b border-black/20 bg-transparent py-3 text-sm outline-none" />
          </label>

          <label className="block">
            <span className="eyebrow">READING TIME</span>
            <input value={readTime} onChange={(e) => setReadTime(e.target.value)} className="mt-2 w-full border-b border-black/20 bg-transparent py-3 text-sm outline-none" />
          </label>

          <div>
            <span className="eyebrow">STORY</span>
            <div className="mt-2 flex flex-wrap items-center gap-2 border border-black/10 border-b-0 bg-white/70 px-3 py-2">
              <button type="button" onClick={() => wrapSelection('**')} className="border border-black/15 px-3 py-2 text-[10px] font-bold tracking-[.1em] hover:bg-black/5"><strong>B</strong> BOLD</button>
              <button type="button" onClick={() => wrapSelection('*')} className="border border-black/15 px-3 py-2 text-[10px] font-bold italic tracking-[.1em] hover:bg-black/5"><em>I</em> ITALIC</button>
              <button type="button" onClick={() => insertColor('#244C3A')} className="border border-black/15 px-3 py-2 text-[10px] font-bold tracking-[.1em] text-verde hover:bg-black/5">A GREEN</button>
              <button type="button" onClick={() => insertColor('#8B5E3C')} className="border border-black/15 px-3 py-2 text-[10px] font-bold tracking-[.1em] hover:bg-black/5">A WARM</button>
              <button type="button" onClick={addLink} className="border border-black/15 px-3 py-2 text-[10px] font-bold tracking-[.1em] hover:bg-black/5">🔗 ADD LINK</button>
              <span className="text-[10px] text-black/45">Highlight text first, then choose a style.</span>
            </div>
            <textarea ref={bodyRef} required value={body} onChange={(e) => setBody(e.target.value)} rows={18} className="w-full border border-black/10 bg-white/50 p-4 text-[16px] leading-8 outline-none" placeholder="Start writing… Separate paragraphs with blank lines." />
          </div>

          {preview && (
            <div className="border-t border-black/10 pt-7">
              <p className="eyebrow text-verde">PREVIEW</p>
              <h2 className="serif mt-3 text-4xl leading-none">{title || 'Your headline'}</h2>
              <p className="mt-4 text-sm leading-6 text-black/60">{dek}</p>
              <div className="mt-5 space-y-5 text-[16px] leading-8">
                {body.split(/\n\s*\n/).filter(Boolean).map((paragraph, index) => <p key={index}>{paragraph}</p>)}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 border-t border-black/10 pt-6">
            <button type="submit" disabled={busy} className="border border-black/20 px-5 py-3 text-[10px] font-bold tracking-[.13em] disabled:opacity-50">SAVE DRAFT</button>
            <button type="button" onClick={() => setPreview(!preview)} className="border border-black/20 px-5 py-3 text-[10px] font-bold tracking-[.13em]">{preview ? 'HIDE PREVIEW' : 'PREVIEW'}</button>
            <button type="button" disabled={busy} onClick={() => save('published')} className="bg-ink px-5 py-3 text-[10px] font-bold tracking-[.13em] text-ivory disabled:opacity-50">PUBLISH LIVE</button>
            {message && <span className="text-[11px] text-verde">{message}</span>}
          </div>
        </form>
      </div>

      {imageEditor && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 p-4 md:p-8">
          <div className="mx-auto my-4 max-w-[1180px] overflow-hidden bg-ivory shadow-2xl">
            <div className="flex items-start justify-between border-b rule px-6 py-5 md:px-8">
              <div>
                <p className="serif text-3xl tracking-[-.03em]">Edit Image</p>
                <p className="mt-1 text-xs text-black/55">Crop, resize and adjust your image before it becomes the story’s feature image.</p>
              </div>
              <button type="button" onClick={() => setImageEditor(null)} className="text-2xl leading-none">×</button>
            </div>

            <div className="grid md:grid-cols-[1.15fr_.85fr]">
              <div className="bg-[#222] p-5 md:p-8">
                <div className="relative mx-auto aspect-[16/10] max-h-[70vh] overflow-hidden border border-white/20 bg-black">
                  <img
                    src={imageEditor.src}
                    alt="Image crop preview"
                    className="absolute left-1/2 top-1/2 max-w-none"
                    style={{
                      width: `${imageEditor.zoom * 100}%`,
                      height: 'auto',
                      transform: `translate(-${imageEditor.x}%, -${imageEditor.y}%) rotate(${imageEditor.rotation}deg) scaleX(${imageEditor.flip ? -1 : 1})`,
                      filter: `brightness(${imageEditor.brightness}%) contrast(${imageEditor.contrast}%) saturate(${imageEditor.saturation}%)`,
                    }}
                  />
                  <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-35">
                    {Array.from({ length: 9 }).map((_, index) => <div key={index} className="border border-white/30" />)}
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-bold tracking-[.1em] text-white">
                  <button type="button" onClick={() => updateEdit('rotation', (imageEditor.rotation + 90) % 360)} className="border border-white/25 px-3 py-2">↻ ROTATE</button>
                  <button type="button" onClick={() => updateEdit('flip', !imageEditor.flip)} className="border border-white/25 px-3 py-2">↔ FLIP</button>
                  <button type="button" onClick={resetImage} className="border border-white/25 px-3 py-2">↺ RESET</button>
                </div>
              </div>

              <div className="space-y-6 p-6 md:p-8">
                <div>
                  <p className="eyebrow">CROP RATIO</p>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {[['FREE', null], ['1:1', 1], ['4:3', 4 / 3], ['3:4', 3 / 4], ['16:9', 16 / 9]].map(([label, ratio]) => (
                      <button key={String(label)} type="button" onClick={() => setRatio(ratio as number | null)} className={`border px-3 py-3 text-[10px] font-bold tracking-[.08em] ${imageEditor.ratio === ratio ? 'border-verde text-verde' : 'border-black/15'}`}>{label}</button>
                    ))}
                  </div>
                </div>

                <label className="block">
                  <div className="flex justify-between"><span className="eyebrow">ZOOM</span><span className="text-xs">{Math.round(imageEditor.zoom * 100)}%</span></div>
                  <input type="range" min="1" max="3" step="0.01" value={imageEditor.zoom} onChange={(e) => updateEdit('zoom', Number(e.target.value))} className="mt-3 w-full accent-[#244C3A]" />
                </label>

                <label className="block">
                  <div className="flex justify-between"><span className="eyebrow">HORIZONTAL POSITION</span><span className="text-xs">{Math.round(imageEditor.x)}%</span></div>
                  <input type="range" min="0" max="100" value={imageEditor.x} onChange={(e) => updateEdit('x', Number(e.target.value))} className="mt-3 w-full accent-[#244C3A]" />
                </label>

                <label className="block">
                  <div className="flex justify-between"><span className="eyebrow">VERTICAL POSITION</span><span className="text-xs">{Math.round(imageEditor.y)}%</span></div>
                  <input type="range" min="0" max="100" value={imageEditor.y} onChange={(e) => updateEdit('y', Number(e.target.value))} className="mt-3 w-full accent-[#244C3A]" />
                </label>

                <label className="block">
                  <div className="flex justify-between"><span className="eyebrow">BRIGHTNESS</span><span className="text-xs">{imageEditor.brightness}</span></div>
                  <input type="range" min="50" max="150" value={imageEditor.brightness} onChange={(e) => updateEdit('brightness', Number(e.target.value))} className="mt-3 w-full accent-[#244C3A]" />
                </label>

                <label className="block">
                  <div className="flex justify-between"><span className="eyebrow">CONTRAST</span><span className="text-xs">{imageEditor.contrast}</span></div>
                  <input type="range" min="50" max="150" value={imageEditor.contrast} onChange={(e) => updateEdit('contrast', Number(e.target.value))} className="mt-3 w-full accent-[#244C3A]" />
                </label>

                <label className="block">
                  <div className="flex justify-between"><span className="eyebrow">SATURATION</span><span className="text-xs">{imageEditor.saturation}</span></div>
                  <input type="range" min="0" max="180" value={imageEditor.saturation} onChange={(e) => updateEdit('saturation', Number(e.target.value))} className="mt-3 w-full accent-[#244C3A]" />
                </label>

                <div>
                  <p className="eyebrow">OUTPUT SIZE</p>
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    <label className="text-xs">WIDTH<input type="number" min="320" max="4000" value={imageEditor.outputWidth} onChange={(e) => updateEdit('outputWidth', Math.max(320, Number(e.target.value)))} className="mt-1 w-full border border-black/15 bg-transparent px-3 py-2" /></label>
                    <label className="text-xs">HEIGHT<input type="number" min="240" max="4000" value={imageEditor.outputHeight} onChange={(e) => updateEdit('outputHeight', Math.max(240, Number(e.target.value)))} className="mt-1 w-full border border-black/15 bg-transparent px-3 py-2" /></label>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-3 border-t rule px-6 py-5 md:px-8">
              <button type="button" onClick={() => setImageEditor(null)} disabled={busy} className="border border-black/15 px-5 py-3 text-[10px] font-bold tracking-[.12em]">CANCEL</button>
              <button type="button" onClick={saveImageEdits} disabled={busy} className="bg-verde px-5 py-3 text-[10px] font-bold tracking-[.12em] text-ivory disabled:opacity-50">{busy ? 'PROCESSING…' : 'SAVE IMAGE'}</button>
            </div>
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}
    </main>
  )
}
