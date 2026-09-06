import { createClient } from '@supabase/supabase-js'

export type DbArticle = {
  id: string
  slug: string
  category: string
  title: string
  dek: string
  author: string
  read_time: string
  featured_image: string | null
  body: string
  status: 'draft' | 'published'
  published_at: string | null
  created_at: string
  updated_at: string
}

function getClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jvllgjgvbalirniaheyj.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_gcI3JQsR6fPSs-pN7fmkEw_f8mN0ICx'
  )
}

export async function getPublishedArticles() {
  const { data, error } = await getClient()
    .from('articles')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  if (error) return []
  return (data || []) as DbArticle[]
}

export async function getPublishedArticle(slug: string) {
  const { data, error } = await getClient()
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()

  if (error || !data) return null
  return data as DbArticle
}

export function articleDate(article: DbArticle) {
  if (!article.published_at) return ''
  return new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(new Date(article.published_at))
}
