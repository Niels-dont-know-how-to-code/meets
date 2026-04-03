import { createClient } from '@supabase/supabase-js'

// UiTDatabank category term IDs → Meets categories
const CATEGORY_MAP = {
  // Party
  '0.50.6.0.0': 'party',    // Festival
  '0.5.0.0.0': 'party',     // Feest/festival
  '0.50.12.0.0': 'party',   // Fuif/bal
  // Sports
  '0.6.0.0.0': 'sports',    // Sport en beweging
  '0.59.0.0.0': 'sports',   // Sportactiviteit
  // Culture (default)
  '0.50.4.0.0': 'culture',  // Concert
  '0.50.21.0.0': 'culture', // Theater
  '0.50.1.0.0': 'culture',  // Tentoonstelling
  '0.50.8.0.0': 'culture',  // Film
  '0.7.0.0.0': 'culture',   // Cursus/workshop
  '0.50.2.0.0': 'culture',  // Lezing/congres
  '0.50.9.0.0': 'culture',  // Komedie/cabaret
  '0.3.1.0.0': 'culture',   // Muziek
  '0.50.15.0.0': 'culture', // Circus
}

// Regions to fetch events for
const REGIONS = ['gem-leuven', 'gem-hasselt']

// System user ID for imported events — set via env or fallback
const IMPORT_USER_ID = process.env.IMPORT_USER_ID || '0fe51aed-9247-4942-9f7e-213474705ef5'

export default async function handler(req, res) {
  // Verify cron secret (Vercel sends this automatically for cron jobs)
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    // Allow manual trigger with query param in dev
    if (!req.query.secret || req.query.secret !== process.env.CRON_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
  }

  const apiKey = process.env.UITDATABANK_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'UITDATABANK_API_KEY not configured' })
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
  const hasServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    const now = new Date()
    const dateFrom = now.toISOString().slice(0, 10) + 'T00:00:00+02:00'
    const dateTo = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
      .toISOString().slice(0, 10) + 'T23:59:59+02:00'

    let allEvents = []

    // Fetch events for each region
    for (const region of REGIONS) {
      const params = new URLSearchParams({
        apiKey,
        'regions[]': region,
        dateFrom,
        dateTo,
        embed: 'true',
        limit: '200',
        sort: 'startDate asc',
        workflowStatus: 'APPROVED',
      })

      const searchHost = process.env.UITDATABANK_ENV === 'live'
        ? 'search.uitdatabank.be'
        : 'search-test.uitdatabank.be'
      const url = `https://${searchHost}/events/?${params}`
      const response = await fetch(url)

      if (!response.ok) {
        console.error(`UiTDatabank API error for ${region}:`, response.status, await response.text())
        continue
      }

      const data = await response.json()
      const events = (data.member || []).map(event => parseUitEvent(event, region))
        .filter(Boolean)

      allEvents.push(...events)
    }

    // Deduplicate by title+date within the fetched batch
    const seen = new Set()
    allEvents = allEvents.filter(e => {
      const key = `${e.title}|${e.date}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    if (allEvents.length === 0) {
      return res.status(200).json({ message: 'No new events found', imported: 0 })
    }

    // Check which events already exist in the database
    const { data: existing } = await supabase
      .from('events')
      .select('title, date')
      .gte('date', dateFrom.slice(0, 10))
      .lte('date', dateTo.slice(0, 10))

    const existingKeys = new Set(
      (existing || []).map(e => `${e.title}|${e.date}`)
    )

    const newEvents = allEvents.filter(e => !existingKeys.has(`${e.title}|${e.date}`))

    if (newEvents.length === 0) {
      return res.status(200).json({ message: 'All events already imported', imported: 0, total: allEvents.length })
    }

    // Disable rate limit trigger for bulk insert (requires service role)
    if (hasServiceRole) {
      await supabase.rpc('exec_sql', {
        query: 'ALTER TABLE events DISABLE TRIGGER event_rate_limit'
      }).catch(() => {})
    }

    // Insert in batches of 50
    let imported = 0
    const errors = []
    for (let i = 0; i < newEvents.length; i += 50) {
      const batch = newEvents.slice(i, i + 50)
      const { data, error } = await supabase
        .from('events')
        .insert(batch)
        .select('id')

      if (error) {
        console.error('Insert batch error:', error)
        errors.push(error.message)
      } else {
        imported += data.length
      }
    }

    // Re-enable rate limit trigger
    if (hasServiceRole) {
      await supabase.rpc('exec_sql', {
        query: 'ALTER TABLE events ENABLE TRIGGER event_rate_limit'
      }).catch(() => {})
    }

    return res.status(200).json({
      message: `Imported ${imported} new events`,
      imported,
      skipped: allEvents.length - newEvents.length,
      total: allEvents.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (err) {
    console.error('Import error:', err)
    return res.status(500).json({ error: err.message })
  }
}

function parseUitEvent(event, region) {
  try {
    // Get Dutch name (primary) or first available
    const name = event.name?.nl || event.name?.en || Object.values(event.name || {})[0]
    if (!name) return null

    // Title max 200 chars
    const title = name.slice(0, 200)

    // Description
    const description = (
      event.description?.nl || event.description?.en || ''
    ).slice(0, 2000) || null

    // Dates — handle different calendar types
    let date, startTime, endTime

    if (event.calendarType === 'single' || event.calendarType === 'multiple') {
      const sub = event.subEvent?.[0] || {}
      const start = sub.startDate || event.startDate
      const end = sub.endDate || event.endDate
      if (!start) return null

      const startDt = new Date(start)
      const endDt = end ? new Date(end) : new Date(startDt.getTime() + 2 * 60 * 60 * 1000)

      date = startDt.toISOString().slice(0, 10)
      startTime = formatTimetz(startDt)
      endTime = formatTimetz(endDt)
    } else if (event.calendarType === 'periodic') {
      const start = event.startDate
      const end = event.endDate
      if (!start) return null

      const startDt = new Date(start)
      date = startDt.toISOString().slice(0, 10)
      startTime = '10:00:00+02'
      endTime = '18:00:00+02'
    } else if (event.calendarType === 'permanent') {
      // Permanent events — use today's date
      date = new Date().toISOString().slice(0, 10)
      startTime = '10:00:00+02'
      endTime = '22:00:00+02'
    } else {
      return null
    }

    // Skip events with dates in the past
    if (date < new Date().toISOString().slice(0, 10)) return null

    // Location
    const location = event.location || {}
    const geo = location.geo || {}
    const lat = geo.latitude
    const lng = geo.longitude

    if (!lat || !lng) return null

    // Address
    const addr = location.address?.nl || location.address?.en || Object.values(location.address || {})[0] || {}
    const venueName = location.name?.nl || location.name?.en || ''
    const street = addr.streetAddress || ''
    const city = addr.addressLocality || ''
    const addressLabel = [venueName, street, city].filter(Boolean).join(', ').slice(0, 500)

    if (!addressLabel) return null

    // Category mapping
    const terms = event.terms || []
    let category = 'culture' // default
    for (const term of terms) {
      if (CATEGORY_MAP[term.id]) {
        category = CATEGORY_MAP[term.id]
        break
      }
    }

    // Organizer
    const organizerName = (
      event.organizer?.name?.nl ||
      event.organizer?.name?.en ||
      event.creator?.name ||
      venueName ||
      'UiTDatabank'
    ).slice(0, 100)

    return {
      title,
      description,
      date,
      start_time: startTime,
      end_time: endTime,
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      address_label: addressLabel,
      category,
      organizer_name: organizerName,
      created_by_id: IMPORT_USER_ID,
    }
  } catch (err) {
    console.error('Parse error for event:', event['@id'], err)
    return null
  }
}

function formatTimetz(dt) {
  const hours = String(dt.getHours()).padStart(2, '0')
  const minutes = String(dt.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}:00+02`
}
