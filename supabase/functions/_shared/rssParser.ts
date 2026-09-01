// Minimalus RSS 2.0 / Atom parseris be išorinių priklausomybių (Deno Edge Function aplinkoje
// nėra numatyto DOMParser palaikymo XML formatui, todėl naudojama tiksli regex ištrauka
// standartiniams <item>/<entry> blokams). Pakanka daugumai naujienų/institucijų kanalų.

export interface FeedItem {
  title: string
  link: string
  publishedAt: string | null
  description: string
}

function decodeEntities(text: string): string {
  return text
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim()
}

function extractTag(block: string, tag: string): string {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'))
  return match ? decodeEntities(match[1]) : ''
}

function extractAtomLink(block: string): string {
  const match = block.match(/<link[^>]*href=["']([^"']+)["'][^>]*\/?>/i)
  return match ? match[1] : extractTag(block, 'link')
}

export function parseFeed(xml: string): FeedItem[] {
  const items: FeedItem[] = []

  const rssItems = xml.match(/<item[^>]*>[\s\S]*?<\/item>/gi) || []
  for (const block of rssItems) {
    items.push({
      title: extractTag(block, 'title'),
      link: extractTag(block, 'link'),
      publishedAt: parseDate(extractTag(block, 'pubDate')),
      description: extractTag(block, 'description'),
    })
  }

  if (rssItems.length === 0) {
    const atomEntries = xml.match(/<entry[^>]*>[\s\S]*?<\/entry>/gi) || []
    for (const block of atomEntries) {
      items.push({
        title: extractTag(block, 'title'),
        link: extractAtomLink(block),
        publishedAt: parseDate(extractTag(block, 'updated') || extractTag(block, 'published')),
        description: extractTag(block, 'summary') || extractTag(block, 'content'),
      })
    }
  }

  return items.filter((i) => i.title && i.link)
}

function parseDate(raw: string): string | null {
  if (!raw) return null
  const d = new Date(raw)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}
