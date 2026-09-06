import Link from 'next/link'
import { notFound } from 'next/navigation'
import { articles, getArticlesByCategory } from '@/lib/articles'

const categories = ['world', 'economy', 'climate', 'technology', 'africa', 'ideas']

export function generateStaticParams() {
  return categories.map((category) => ({ category }))
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params
  const normalized = category.toLowerCase()
  if (!categories.includes(normalized)) notFound()
  const stories = getArticlesByCategory(normalized)

  return (
    <main className="min-h-screen bg-ivory">
      <header className="border-b rule">
        <div className="mx-auto flex h-[74px] max-w-[1200px] items-center justify-between px-5 md:px-8">
          <Link href="/" className="serif text-[28px] font-bold tracking-[-.045em]">INK VERDE</Link>
          <Link href="/" className="text-[10px] font-bold tracking-[.13em]">HOME</Link>
        </div>
      </header>
      <div className="mx-auto max-w-[1200px] px-5 py-12 md:px-8 md:py-20">
        <p className="eyebrow text-verde">INK VERDE</p>
        <h1 className="serif mt-3 text-[58px] capitalize leading-none tracking-[-.05em] md:text-[84px]">{normalized}</h1>
        <div className="mt-10 grid gap-10 border-t rule pt-10 md:grid-cols-3">
          {stories.length ? stories.map((story) => (
            <article key={story.slug}>
              <Link href={`/article/${story.slug}`}>
                <div className="overflow-hidden"><img src={story.image} alt="" className="aspect-[4/3] w-full object-cover transition-transform duration-500 hover:scale-[1.025]" /></div>
                <p className="eyebrow mt-4 text-verde">{story.category}</p>
                <h2 className="serif mt-2 text-[30px] leading-[1.02] tracking-[-.03em]">{story.title}</h2>
                <p className="mt-3 text-[13px] leading-5 text-black/60">{story.dek}</p>
              </Link>
            </article>
          )) : <p className="text-sm text-black/60">No stories published in this section yet. Check back soon.</p>}
        </div>
      </div>
    </main>
  )
}
