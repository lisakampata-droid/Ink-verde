'use client'

import { useState } from 'react'

export default function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false)

  async function share() {
    const url = window.location.href

    try {
      if (navigator.share) {
        await navigator.share({ title, url })
        return
      }

      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2200)
    } catch {
      // Ignore cancelled native shares and clipboard failures.
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      className="border rule px-4 py-2 text-[10px] font-bold tracking-[.12em] transition hover:bg-black hover:text-ivory"
      aria-label={`Share ${title}`}
    >
      {copied ? 'LINK COPIED ✓' : '↗ SHARE STORY'}
    </button>
  )
}
