'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const EDITOR_EMAIL = 'lisakampata@gmail.com'

export default function EditorSetupPage() {
  const router = useRouter()
  const [email, setEmail] = useState(EDITOR_EMAIL)
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active || !data.session) return
      const { data: editor } = await supabase
        .from('editor_users')
        .select('user_id')
        .eq('user_id', data.session.user.id)
        .maybeSingle()
      if (editor) router.replace('/admin')
    })
    return () => { active = false }
  }, [router])

  async function createEditor(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password })
    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    if (data.session && data.user) {
      const { error: claimError } = await supabase
        .from('editor_users')
        .insert({ user_id: data.user.id })

      if (claimError) {
        setMessage(claimError.message)
        setLoading(false)
        return
      }

      router.replace('/admin')
      return
    }

    setMessage('Account created. Check your email to confirm the address, then sign in at the Editorial Studio.')
    setPassword('')
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-[#eeeae1] text-ink">
      <header className="border-b border-black/10 bg-ivory">
        <div className="mx-auto flex h-[76px] max-w-[1200px] items-center justify-between px-5 md:px-8">
          <Link href="/" className="serif text-[27px] font-bold tracking-[-.045em]">INK VERDE</Link>
          <span className="eyebrow text-black/50">EDITORIAL ACCESS</span>
        </div>
      </header>

      <div className="mx-auto max-w-[520px] px-5 py-16 md:py-24">
        <p className="eyebrow text-verde">ONE-TIME SETUP</p>
        <h1 className="serif mt-3 text-[48px] leading-[.95] tracking-[-.05em]">Create your editor account.</h1>
        <p className="mt-5 text-sm leading-6 text-black/60">
          This account gives you private access to the Ink Verde Editorial Studio. Readers will not need an account to read your published stories.
        </p>

        <form onSubmit={createEditor} className="mt-10 space-y-6 bg-ivory p-7 md:p-9">
          <label className="block">
            <span className="eyebrow">EDITOR EMAIL</span>
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" required className="mt-2 w-full border-b border-black/20 bg-transparent py-3 text-sm outline-none" />
          </label>
          <label className="block">
            <span className="eyebrow">PASSWORD</span>
            <input value={password} onChange={e => setPassword(e.target.value)} type="password" minLength={8} required className="mt-2 w-full border-b border-black/20 bg-transparent py-3 text-sm outline-none" placeholder="Choose a private password (8+ characters)" />
          </label>

          <button disabled={loading} className="w-full bg-ink px-5 py-4 text-[10px] font-bold tracking-[.15em] text-ivory disabled:opacity-50">
            {loading ? 'CREATING ACCOUNT…' : 'CREATE EDITOR ACCOUNT'}
          </button>

          {message && <p className="text-sm leading-6 text-verde">{message}</p>}
        </form>

        <p className="mt-6 text-center text-[11px] text-black/45">
          Already set up? <Link href="/admin/login" className="underline underline-offset-4">Sign in</Link>
        </p>
      </div>
    </main>
  )
}
