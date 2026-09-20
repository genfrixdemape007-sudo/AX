// Runs on Netlify's edge for requests matching /product/:id (see config below).
//
// Why this exists: this app is a client-rendered React SPA, so when someone shares a
// product link in Messenger/Facebook/Twitter/etc., the crawler that generates the preview
// card never runs our JavaScript — it only sees whatever is in the raw HTML response. That
// raw HTML is always the same generic index.html, so every shared link would show the same
// title/image no matter which product it is.
//
// This function intercepts requests from known link-preview bots only, fetches the specific
// product straight from Supabase, and returns a tiny HTML document with the right Open
// Graph tags (name, price, photo). Everyone else (real visitors, browsers) is passed
// straight through to the normal app untouched.

const BOT_PATTERN =
  /facebookexternalhit|Facebot|Twitterbot|LinkedInBot|Slackbot|TelegramBot|WhatsApp|Discordbot|Pinterest|redditbot|vkShare|SkypeUriPreview|Googlebot/i

export default async (request, context) => {
  const userAgent = request.headers.get('user-agent') || ''
  if (!BOT_PATTERN.test(userAgent)) {
    return context.next()
  }

  const url = new URL(request.url)
  const match = url.pathname.match(/^\/product\/([^/]+)/)
  const productId = match?.[1]
  if (!productId) return context.next()

  const supabaseUrl = Deno.env.get('VITE_SUPABASE_URL')
  const supabaseAnonKey = Deno.env.get('VITE_SUPABASE_ANON_KEY')
  if (!supabaseUrl || !supabaseAnonKey) return context.next()

  try {
    const apiUrl =
      `${supabaseUrl}/rest/v1/products?id=eq.${encodeURIComponent(productId)}` +
      `&select=name,price,short_description,image_path`

    const res = await fetch(apiUrl, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
    })
    if (!res.ok) return context.next()

    const rows = await res.json()
    const product = rows?.[0]
    if (!product) return context.next()

    const title = escapeHtml(product.name || 'AXKN07 Crochet')
    const price = Number(product.price)
    const priceText = Number.isFinite(price)
      ? `₱${price.toLocaleString('en-PH', { maximumFractionDigits: 2 })}`
      : ''
    const description = escapeHtml(
      [priceText, product.short_description].filter(Boolean).join(' — ') ||
        'Handmade crochet — message to order.'
    )
    const imageUrl = product.image_path
      ? `${supabaseUrl}/storage/v1/object/public/product-images/${product.image_path}`
      : ''

    const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>${title} — AXKN07 Crochet</title>
    <meta property="og:type" content="product" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:url" content="${escapeHtml(url.toString())}" />
    ${imageUrl ? `<meta property="og:image" content="${escapeHtml(imageUrl)}" />` : ''}
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    ${imageUrl ? `<meta name="twitter:image" content="${escapeHtml(imageUrl)}" />` : ''}
    <meta http-equiv="refresh" content="0; url=${escapeHtml(url.toString())}" />
  </head>
  <body>
    <p><a href="${escapeHtml(url.toString())}">${title}</a></p>
  </body>
</html>`

    return new Response(html, {
      headers: { 'content-type': 'text/html; charset=utf-8' },
    })
  } catch {
    return context.next()
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export const config = { path: '/product/*' }
