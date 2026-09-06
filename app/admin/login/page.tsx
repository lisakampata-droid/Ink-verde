'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace('/admin')
    })
  }, [router])

  async function submit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    router.replace('/admin')
    router.refresh()
  }

  return <main className="min-h-screen bg-[#eeeae1] px-5 py-10 text-ink md:py-20">
    <div className="mx-auto max-w-md">
      <div className="text-center">
        <p className="serif text-[30px] font-bold tracking-[-.05em]">INK VERDE</p>
        <p className="eyebrow mt-3 text-verde">EDITORIAL STUDIO</p>
        <h1 className="serif mt-8 text-[42px] leading-none tracking-[-.04em]">Welcome back.</h1>
        <p className="mt-4 text-sm leading-6 text-black/55">Sign in to write, edit and publish.</p>
      </div>
      <form onSubmit={submit} className="mt-10 space-y-6 bg-ivory p-7 md:p-9">
        <label className="block"><span className="eyebrow">EMAIL</span><input required type="email" value={email} onChange={e=>setEmail(e.target.value)} className="mt-2 w-full border-b border-black/20 bg-transparent py-3 outline-none" /></label>
        <label className="block"><span className="eyebrow">PASSWORD</span><input required type="password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-2 w-full border-b border-black/20 bg-transparent py-3 outline-none" /></label>
        {error && <p className="border border-red-900/15 bg-red-50 p-3 text-xs text-red-800">{error}</p>}
        <button disabled={loading} className="w-full bg-ink px-5 py-4 text-[10px] font-bold tracking-[.14em] text-ivory disabled:opacity-50">{loading ? 'SIGNING IN…' : 'SIGN IN'}</button>
      </form>
      <p className="mt-6 text-center text-[10px] text-black/40">Private editorial access. Public readers do not need an account.</p>
    </div>
  </main>
}
