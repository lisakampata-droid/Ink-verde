export type Article = {
  slug: string
  category: string
  title: string
  dek: string
  author: string
  date: string
  readTime: string
  image: string
  body: string[]
}

export const articles: Article[] = [
  {
    slug: 'new-economics-of-a-hotter-world',
    category: 'CLIMATE · FEATURE',
    title: 'The new economics of a hotter world.',
    dek: 'Why rising temperatures are changing the financial calculations of governments, businesses and households.',
    author: 'Ink Verde Editorial',
    date: 'September 2026',
    readTime: '8 min read',
    image: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1600&q=88',
    body: [
      'Climate change is increasingly being priced not as a distant environmental risk, but as a present economic variable. Governments are reassessing infrastructure, businesses are recalculating supply chains and households are confronting higher costs from heat, floods and disrupted services.',
      'The important shift is not simply that the planet is getting warmer. It is that temperature, rainfall and extreme events are becoming part of everyday financial decision-making. The question is moving from whether climate risk matters to who pays for it, when and how much.',
      'For developing economies, the stakes are particularly high. A damaged road can reduce market access. A failed harvest can weaken household income and food security. A public balance sheet already under pressure can be forced to absorb another emergency just as investment is most needed.',
      'That makes adaptation an economic strategy. Better information, resilient infrastructure, smarter finance and technologies that help communities anticipate risk can protect productivity as well as lives.',
      'The next chapter of climate economics will therefore be less about forecasting catastrophe and more about allocating capital intelligently in a changing world.'
    ]
  },
  {
    slug: 'africas-next-investment-frontier',
    category: 'ECONOMY',
    title: "Africa's Next Investment Frontier",
    dek: 'The next wave of growth may depend less on commodities and more on the infrastructure around them.',
    author: 'Ink Verde Editorial',
    date: 'September 2026',
    readTime: '6 min read',
    image: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=1400&q=85',
    body: [
      'Africa’s investment story is changing. Natural resources remain important, but investors are increasingly looking at the systems that determine whether economies can turn resources, talent and markets into sustained productivity.',
      'Energy reliability, transport, digital infrastructure and financial inclusion can have effects far beyond a single project. They lower transaction costs, connect producers to consumers and create the conditions for new firms to emerge.',
      'The opportunity is substantial, but so is the need for patient capital and stronger institutions. The winners may be the markets that combine ambitious infrastructure investment with credible policy and a growing base of local entrepreneurs.'
    ]
  },
  {
    slug: 'can-ai-make-development-more-efficient',
    category: 'TECHNOLOGY',
    title: 'Can AI Make Development More Efficient?',
    dek: 'The promise is enormous. The harder question is where the gains will actually land.',
    author: 'Ink Verde Editorial',
    date: 'September 2026',
    readTime: '5 min read',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1400&q=85',
    body: [
      'Artificial intelligence is moving quickly from experimentation into the practical machinery of organisations. In development, that could mean faster analysis, better targeting of scarce resources and new ways to deliver services.',
      'But efficiency is not the same as impact. An algorithm can process information quickly while still relying on incomplete data or reproducing the assumptions built into the system around it.',
      'The most useful question is therefore not whether AI can replace people. It is where intelligent tools can help people make better decisions, particularly where institutions face constraints in time, information and capacity.'
    ]
  },
  {
    slug: 'cities-preparing-for-a-different-future',
    category: 'AFRICA',
    title: 'The Cities Preparing for a Different Future',
    dek: 'Across the continent, a new generation of urban thinkers is redesigning how cities work.',
    author: 'Ink Verde Editorial',
    date: 'September 2026',
    readTime: '7 min read',
    image: 'https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=1400&q=85',
    body: [
      'Africa’s urban future will be shaped by choices being made today. Population growth is putting pressure on housing, transport, water, energy and public space, while climate change is raising the cost of getting those choices wrong.',
      'A different approach starts with seeing cities as connected systems. Better transport changes access to jobs. Better drainage protects businesses. Better public spaces can strengthen community life while improving resilience.',
      'The opportunity is to build cities around the lives people actually lead, rather than around a narrow idea of infrastructure alone.'
    ]
  }
]

export function getArticle(slug: string) {
  return articles.find((article) => article.slug === slug)
}

export function getArticlesByCategory(category: string) {
  return articles.filter((article) => article.category.startsWith(category.toUpperCase()))
}
