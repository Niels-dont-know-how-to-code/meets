import { createClient } from '@supabase/supabase-js'

const BOT_PATTERN = /facebookexternalhit|Twitterbot|LinkedInBot|WhatsApp|TelegramBot|Slackbot|Discordbot|bot|crawler|spider/i

export default async function handler(req, res) {
  const userAgent = req.headers['user-agent'] || ''
  const url = new URL(req.url, `https://${req.headers.host}`)
  const eventId = url.searchParams.get('event')

  // Only intercept for bots with an event ID
  if (!BOT_PATTERN.test(userAgent) || !eventId) {
    // Serve the SPA
    return res.redirect(308, '/')
  }

  try {
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { data: event } = await supabase
      .from('events')
      .select('title, description, date, start_time, end_time, category, organizer_name, address_label, image_url')
      .eq('id', eventId)
      .single()

    if (!event) {
      return res.redirect(308, '/')
    }

    const title = `${event.title} | Meets`
    const description = event.description
      || `${event.category} event by ${event.organizer_name} on ${event.date} at ${event.address_label}`
    const image = event.image_url || `https://meets-og.vercel.app/api/og?title=${encodeURIComponent(event.title)}`
    const siteUrl = `https://${req.headers.host}/?event=${eventId}`
    const time = `${(event.start_time || '').slice(0, 5)} - ${(event.end_time || '').slice(0, 5)}`

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${escapeHtml(image)}" />
  <meta property="og:url" content="${escapeHtml(siteUrl)}" />
  <meta property="og:site_name" content="Meets" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(image)}" />
</head>
<body>
  <h1>${escapeHtml(event.title)}</h1>
  <p>${escapeHtml(event.category)} · ${escapeHtml(time)} · ${escapeHtml(event.address_label || '')}</p>
  <p>${escapeHtml(description)}</p>
</body>
</html>`

    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('Cache-Control', 'public, max-age=3600')
    return res.status(200).send(html)
  } catch (err) {
    console.error('OG handler error:', err)
    return res.redirect(308, '/')
  }
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/`/g, '&#x60;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\//g, '&#x2F;')
}
