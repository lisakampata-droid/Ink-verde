import Link from 'next/link'
import { notFound } from 'next/navigation'
import { articleDate, getPublishedArticle } from '@/lib/articles-db'

export const dynamic = 'force-dynamic'

function renderInline(text:string){
 const tokens=text.split(/(\[[^\]]+\]\(https?:\/\/[^\s)]+\)|\*\*[^*]+\*\*|(?<!\*)\*[^*]+\*(?!\*)|<span style="color:#[0-9a-fA-F]{6}">.*?<\/span>)/g)
 return tokens.map((part,index)=>{
  const link=part.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/); if(link)return <a key={index} href={link[2]} target="_blank" rel="noopener noreferrer" className="text-verde underline underline-offset-4 decoration-verde/40 hover:decoration-verde">{link[1]} ↗</a>
  const bold=part.match(/^\*\*([^*]+)\*\*$/); if(bold)return <strong key={index}>{bold[1]}</strong>
  const italic=part.match(/^\*([^*]+)\*$/); if(italic)return <em key={index}>{italic[1]}</em>
  const colored=part.match(/^<span style="color:(#[0-9a-fA-F]{6})">(.*?)<\/span>$/); if(colored)return <span key={index} style={{color:colored[1]}}>{colored[2]}</span>
  return <span key={index}>{part}</span>
 })
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const article = await getPublishedArticle(slug)
  if (!article) notFound()
  const paragraphs = article.body.split(/\n\s*\n/).filter(Boolean)

  return (
    <main className="bg-ivory min-h-screen">
      <header className="border-b rule sticky top-0 z-20 bg-ivory/95 backdrop-blur"><div className="mx-auto flex h-[74px] max-w-[1000px] items-center justify-between px-5 md:px-8"><Link href="/" className="serif text-[28px] font-bold tracking-[-.045em]">INK VERDE</Link><Link href="/" className="text-[10px] font-bold tracking-[.13em]">← BACK TO INK VERDE</Link></div></header>
      <article className="mx-auto max-w-[1080px] px-5 py-12 md:px-8 md:py-20">
        <div className="mx-auto max-w-[820px]"><p className="eyebrow text-verde">{article.category}</p><h1 className="serif mt-5 text-[52px] leading-[.94] tracking-[-.055em] md:text-[82px]">{article.title}</h1><p className="mt-7 max-w-3xl text-[18px] leading-8 text-black/65 md:text-[21px]">{article.dek}</p><div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 border-y rule py-4 text-[10px] font-bold tracking-[.1em]"><span>{article.author}</span><span>{articleDate(article)}</span><span>{article.read_time.toUpperCase()}</span></div></div>
        {article.featured_image && <div className="mt-10 overflow-hidden md:mt-14"><img src={article.featured_image} alt="" className="aspect-[16/9] w-full object-cover" /></div>}
        <div className="mx-auto mt-12 max-w-[680px] md:mt-16">{paragraphs.map((paragraph,index)=><p key={index} className="mb-7 text-[17px] leading-8 text-black/80 md:text-[18px] md:leading-9">{renderInline(paragraph)}</p>)}<div className="mt-14 border-t rule pt-6"><p className="eyebrow text-verde">INK VERDE</p><p className="mt-2 text-[12px] leading-5 text-black/55">Independent journalism on climate, economics, technology, Africa and the ideas shaping tomorrow.</p></div></div>
      </article>
    </main>
  )
}
