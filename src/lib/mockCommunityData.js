// Mock data for community feature — will be replaced by Supabase queries

const now = new Date()
const h = (hoursAgo) => new Date(now - hoursAgo * 3600000).toISOString()
const d = (daysAgo, hour = 12) => {
  const date = new Date(now)
  date.setDate(date.getDate() - daysAgo)
  date.setHours(hour, Math.floor(Math.random() * 60), 0, 0)
  return date.toISOString()
}

export const MOCK_COMMUNITIES = [
  {
    id: 'comm-1',
    name: 'KU Leuven Studentenraad',
    description: 'Official student council of KU Leuven. Stay updated on campus decisions, events, and student life.',
    image_url: null,
    created_by: 'user-admin-1',
    created_at: '2025-09-01T10:00:00Z',
    member_count: 24,
    my_role: 'admin',
    last_message_preview: 'Reminder: general assembly this Thursday at 19h in Aula Pieter De Somer',
    last_message_at: h(0.5),
  },
  {
    id: 'comm-2',
    name: 'VTK - Vlaamse Technische Kring',
    description: 'The engineering student association of KU Leuven. Cantussen, sport, culture, and more!',
    image_url: null,
    created_by: 'user-admin-2',
    created_at: '2025-08-15T14:00:00Z',
    member_count: 156,
    my_role: 'member',
    last_message_preview: 'Who is coming to the cantus on Friday? 🍺',
    last_message_at: h(2),
  },
  {
    id: 'comm-3',
    name: 'Erasmus Leuven 2026',
    description: 'Welcome to Leuven! A group for all exchange students arriving in 2026. Ask questions, find friends, explore the city.',
    image_url: null,
    created_by: 'user-admin-3',
    created_at: '2025-12-01T09:00:00Z',
    member_count: 89,
    my_role: 'member',
    last_message_preview: 'Does anyone know a good dentist that takes RIZIV?',
    last_message_at: h(6),
  },
]

export const MOCK_MEMBERS = {
  'comm-1': [
    { id: 'mem-1', user_id: 'user-admin-1', display_name: 'Pieter Janssens', avatar_url: null, role: 'admin', joined_at: '2025-09-01T10:00:00Z' },
    { id: 'mem-2', user_id: 'user-2', display_name: 'Lotte De Smedt', avatar_url: null, role: 'admin', joined_at: '2025-09-01T10:05:00Z' },
    { id: 'mem-3', user_id: 'user-3', display_name: 'Bram Wouters', avatar_url: null, role: 'member', joined_at: '2025-09-02T14:00:00Z' },
    { id: 'mem-4', user_id: 'user-4', display_name: 'Fien Peeters', avatar_url: null, role: 'member', joined_at: '2025-09-03T11:00:00Z' },
    { id: 'mem-5', user_id: 'user-5', display_name: 'Jens Maes', avatar_url: null, role: 'member', joined_at: '2025-09-05T16:00:00Z' },
  ],
  'comm-2': [
    { id: 'mem-10', user_id: 'user-admin-2', display_name: 'Stijn Claes', avatar_url: null, role: 'admin', joined_at: '2025-08-15T14:00:00Z' },
    { id: 'mem-11', user_id: 'user-11', display_name: 'Emma Willems', avatar_url: null, role: 'admin', joined_at: '2025-08-15T14:30:00Z' },
    { id: 'mem-12', user_id: 'user-12', display_name: 'Robbe Jacobs', avatar_url: null, role: 'member', joined_at: '2025-08-20T09:00:00Z' },
    { id: 'mem-13', user_id: 'user-13', display_name: 'Noor Van Damme', avatar_url: null, role: 'member', joined_at: '2025-08-22T11:00:00Z' },
  ],
  'comm-3': [
    { id: 'mem-20', user_id: 'user-admin-3', display_name: 'María García', avatar_url: null, role: 'admin', joined_at: '2025-12-01T09:00:00Z' },
    { id: 'mem-21', user_id: 'user-21', display_name: 'Lukas Schmidt', avatar_url: null, role: 'member', joined_at: '2025-12-05T10:00:00Z' },
    { id: 'mem-22', user_id: 'user-22', display_name: 'Chiara Rossi', avatar_url: null, role: 'member', joined_at: '2025-12-08T15:00:00Z' },
  ],
}

export const MOCK_SUBGROUPS = {
  'comm-1': [
    { id: 'sub-1', community_id: 'comm-1', name: 'Board 2025-2026', description: 'Internal board discussions', created_by: 'user-admin-1', member_count: 5, created_at: '2025-09-01T10:30:00Z' },
    { id: 'sub-2', community_id: 'comm-1', name: 'Event Planning', description: 'Coordinate upcoming events', created_by: 'user-admin-1', member_count: 8, created_at: '2025-09-15T14:00:00Z' },
  ],
  'comm-2': [
    { id: 'sub-3', community_id: 'comm-2', name: 'Praesidium', description: 'Board members only', created_by: 'user-admin-2', member_count: 12, created_at: '2025-08-15T15:00:00Z' },
    { id: 'sub-4', community_id: 'comm-2', name: 'Cantus Committee', description: 'Organize cantussen and TD', created_by: 'user-admin-2', member_count: 6, created_at: '2025-09-01T10:00:00Z' },
    { id: 'sub-5', community_id: 'comm-2', name: 'Promo Team', description: 'Social media and posters', created_by: 'user-admin-2', member_count: 4, created_at: '2025-09-10T11:00:00Z' },
  ],
  'comm-3': [
    { id: 'sub-6', community_id: 'comm-3', name: 'Housing Help', description: 'Find kots and roommates', created_by: 'user-admin-3', member_count: 34, created_at: '2025-12-02T10:00:00Z' },
  ],
}

export const MOCK_MESSAGES = {
  'comm-1': [
    { id: 'msg-1', sender_id: 'user-admin-1', sender_name: 'Pieter Janssens', sender_avatar: null, content: 'Hey everyone! Welcome to the Studentenraad community 🎉', created_at: d(1, 9) },
    { id: 'msg-2', sender_id: 'user-3', sender_name: 'Bram Wouters', sender_avatar: null, content: 'Thanks for setting this up! Much easier than email chains', created_at: d(1, 9.5) },
    { id: 'msg-3', sender_id: 'user-2', sender_name: 'Lotte De Smedt', sender_avatar: null, content: 'Agreed! Quick reminder that the budget meeting is moved to next week', created_at: d(1, 10) },
    { id: 'msg-4', sender_id: 'user-4', sender_name: 'Fien Peeters', sender_avatar: null, content: 'Which room? Still Aula Pieter De Somer?', created_at: d(1, 10.5) },
    { id: 'msg-5', sender_id: 'user-2', sender_name: 'Lotte De Smedt', sender_avatar: null, content: 'Yes, same room. 19h sharp.', created_at: d(1, 11) },
    { id: 'msg-6', sender_id: 'user-5', sender_name: 'Jens Maes', sender_avatar: null, content: 'Is there an agenda already? I want to bring up the bike parking issue again', created_at: d(1, 14) },
    { id: 'msg-7', sender_id: 'user-admin-1', sender_name: 'Pieter Janssens', sender_avatar: null, content: 'Good point Jens, I will add it. Anyone else has topics?', created_at: d(1, 14.5) },
    { id: 'msg-8', sender_id: 'user-3', sender_name: 'Bram Wouters', sender_avatar: null, content: 'The exam schedule overlap problem — got some complaints from 2nd year students', created_at: d(1, 15) },
    { id: 'msg-9', sender_id: 'user-admin-1', sender_name: 'Pieter Janssens', sender_avatar: null, content: 'Noted! Will prepare slides for both topics.', created_at: d(1, 15.5) },
    { id: 'msg-10', sender_id: 'user-4', sender_name: 'Fien Peeters', sender_avatar: null, content: 'Can we also discuss the food options in Alma? The vegetarian options are really limited this semester', created_at: d(0, 8) },
    { id: 'msg-11', sender_id: 'user-5', sender_name: 'Jens Maes', sender_avatar: null, content: '+1 on that, heard the same from multiple people', created_at: d(0, 8.5) },
    { id: 'msg-12', sender_id: 'user-2', sender_name: 'Lotte De Smedt', sender_avatar: null, content: 'Great, so we have 3 main topics for the GA. I will send the formal agenda by email today.', created_at: d(0, 10) },
    { id: 'msg-13', sender_id: 'user-3', sender_name: 'Bram Wouters', sender_avatar: null, content: 'Also quick question — is the sustainability working group still meeting on Wednesdays?', created_at: d(0, 11) },
    { id: 'msg-14', sender_id: 'user-admin-1', sender_name: 'Pieter Janssens', sender_avatar: null, content: 'Yes, every Wednesday 17h in MSI. They could use more people actually!', created_at: d(0, 11.5) },
    { id: 'msg-15', sender_id: 'user-5', sender_name: 'Jens Maes', sender_avatar: null, content: 'I will join next week. Count me in.', created_at: d(0, 12) },
    { id: 'msg-16', sender_id: 'user-4', sender_name: 'Fien Peeters', sender_avatar: null, content: 'Does anyone have the contact info for the facilities manager? The heating in our aula was broken again', created_at: d(0, 14) },
    { id: 'msg-17', sender_id: 'user-2', sender_name: 'Lotte De Smedt', sender_avatar: null, content: 'I have it, will DM you. We already filed a complaint last month about that...', created_at: d(0, 14.5) },
    { id: 'msg-18', sender_id: 'user-admin-1', sender_name: 'Pieter Janssens', sender_avatar: null, content: 'Reminder: general assembly this Thursday at 19h in Aula Pieter De Somer', created_at: h(0.5) },
  ],
  'comm-2': [
    { id: 'msg-20', sender_id: 'user-admin-2', sender_name: 'Stijn Claes', sender_avatar: null, content: 'Dag iedereen! Welkom in de VTK community', created_at: d(2, 10) },
    { id: 'msg-21', sender_id: 'user-12', sender_name: 'Robbe Jacobs', sender_avatar: null, content: 'Nice! Is here where we get all the event info?', created_at: d(2, 10.5) },
    { id: 'msg-22', sender_id: 'user-admin-2', sender_name: 'Stijn Claes', sender_avatar: null, content: 'Yes! All events, announcements, and cantus info will be posted here', created_at: d(2, 11) },
    { id: 'msg-23', sender_id: 'user-11', sender_name: 'Emma Willems', sender_avatar: null, content: 'FYI: sport tournament this Saturday at 14h, Sporthal UCLL. Bring your A-game 💪', created_at: d(1, 9) },
    { id: 'msg-24', sender_id: 'user-13', sender_name: 'Noor Van Damme', sender_avatar: null, content: 'Are there still spots for volleyball?', created_at: d(1, 9.5) },
    { id: 'msg-25', sender_id: 'user-11', sender_name: 'Emma Willems', sender_avatar: null, content: 'Yes! Sign up in the sub group "Sport"', created_at: d(1, 10) },
    { id: 'msg-26', sender_id: 'user-12', sender_name: 'Robbe Jacobs', sender_avatar: null, content: 'Who is coming to the cantus on Friday? 🍺', created_at: h(2) },
    { id: 'msg-27', sender_id: 'user-13', sender_name: 'Noor Van Damme', sender_avatar: null, content: 'Count me in!', created_at: h(1.5) },
    { id: 'msg-28', sender_id: 'user-admin-2', sender_name: 'Stijn Claes', sender_avatar: null, content: 'Schol! See you all there at 21h, usual spot Oude Markt', created_at: h(1) },
    { id: 'msg-29a', sender_id: 'user-12', sender_name: 'Robbe Jacobs', sender_avatar: null, content: 'Does anyone have a spare lab coat? Forgot mine and I have practicum tomorrow', created_at: d(1, 11) },
    { id: 'msg-29b', sender_id: 'user-13', sender_name: 'Noor Van Damme', sender_avatar: null, content: 'I have one! Meet me at the VTK building around 12h', created_at: d(1, 12) },
    { id: 'msg-29c', sender_id: 'user-admin-2', sender_name: 'Stijn Claes', sender_avatar: null, content: 'Hey reminder: the deadline for the industry day CV submission is this Sunday 23h59', created_at: d(1, 14) },
    { id: 'msg-29d', sender_id: 'user-11', sender_name: 'Emma Willems', sender_avatar: null, content: 'Thanks for the reminder! Almost forgot about that', created_at: d(1, 14.5) },
    { id: 'msg-29e', sender_id: 'user-12', sender_name: 'Robbe Jacobs', sender_avatar: null, content: 'Is the format still the same as last year? Max 1 page?', created_at: d(1, 15) },
    { id: 'msg-29f', sender_id: 'user-admin-2', sender_name: 'Stijn Claes', sender_avatar: null, content: 'Yes, one page PDF. Upload link is on the VTK website under "Industry Day"', created_at: d(1, 15.5) },
    { id: 'msg-29g', sender_id: 'user-13', sender_name: 'Noor Van Damme', sender_avatar: null, content: 'Do we know which companies are coming this year?', created_at: d(0, 9) },
    { id: 'msg-29h', sender_id: 'user-admin-2', sender_name: 'Stijn Claes', sender_avatar: null, content: 'McKinsey, AB InBev, Siemens, Atlas Copco, and a few more. Full list drops next week!', created_at: d(0, 10) },
    { id: 'msg-29i', sender_id: 'user-11', sender_name: 'Emma Willems', sender_avatar: null, content: 'Atlas Copco! Definitely going to that one', created_at: d(0, 10.5) },
  ],
  'comm-3': [
    { id: 'msg-30', sender_id: 'user-admin-3', sender_name: 'María García', sender_avatar: null, content: 'Welcome everyone! I arrived in Leuven last week from Barcelona. This group is for all of us to help each other out 🇪🇺', created_at: d(3, 10) },
    { id: 'msg-31', sender_id: 'user-21', sender_name: 'Lukas Schmidt', sender_avatar: null, content: 'Hallo! Just arrived from Munich. Where does everyone live?', created_at: d(3, 11) },
    { id: 'msg-32', sender_id: 'user-22', sender_name: 'Chiara Rossi', sender_avatar: null, content: 'Ciao! I have a kot in Naamsestraat. The center is really nice!', created_at: d(3, 12) },
    { id: 'msg-33', sender_id: 'user-admin-3', sender_name: 'María García', sender_avatar: null, content: 'Pro tip: get the Velo bike subscription, it is only 35€/year and bikes are everywhere', created_at: d(2, 9) },
    { id: 'msg-34', sender_id: 'user-21', sender_name: 'Lukas Schmidt', sender_avatar: null, content: 'Thanks! Also does anyone know where to get a Belgian SIM card?', created_at: d(2, 10) },
    { id: 'msg-35', sender_id: 'user-22', sender_name: 'Chiara Rossi', sender_avatar: null, content: 'I got one from Proximus at the shop on Bondgenotenlaan. Very easy.', created_at: d(2, 11) },
    { id: 'msg-36', sender_id: 'user-admin-3', sender_name: 'María García', sender_avatar: null, content: 'We are organizing a welcome drinks this Friday at Leuven Central! Who wants to come?', created_at: d(1, 15) },
    { id: 'msg-37', sender_id: 'user-21', sender_name: 'Lukas Schmidt', sender_avatar: null, content: 'I am in! What time?', created_at: d(1, 15.5) },
    { id: 'msg-38', sender_id: 'user-admin-3', sender_name: 'María García', sender_avatar: null, content: '19h, ground floor. Look for the Erasmus flag 🇪🇺', created_at: d(1, 16) },
    { id: 'msg-39', sender_id: 'user-22', sender_name: 'Chiara Rossi', sender_avatar: null, content: 'Does anyone know how the bus system works? I see De Lijn everywhere but the app is confusing', created_at: d(1, 17) },
    { id: 'msg-39a', sender_id: 'user-admin-3', sender_name: 'Maria Garcia', sender_avatar: null, content: 'Use Google Maps for routes, it integrates with De Lijn. Also get the Buzzy Pazz if you are under 25 — super cheap!', created_at: d(1, 17.5) },
    { id: 'msg-39b', sender_id: 'user-21', sender_name: 'Lukas Schmidt', sender_avatar: null, content: 'Is the Oude Markt really as wild as people say? haha', created_at: d(0, 11) },
    { id: 'msg-39c', sender_id: 'user-22', sender_name: 'Chiara Rossi', sender_avatar: null, content: 'It is the longest bar in Europe apparently! You have to see it on a Thursday night', created_at: d(0, 11.5) },
    { id: 'msg-39d', sender_id: 'user-admin-3', sender_name: 'Maria Garcia', sender_avatar: null, content: 'Thursday is student night, yes. But honestly there is stuff every night of the week in Leuven', created_at: d(0, 12) },
    { id: 'msg-39e', sender_id: 'user-21', sender_name: 'Lukas Schmidt', sender_avatar: null, content: 'Has anyone registered at the gemeente yet? I need to do the address registration', created_at: d(0, 14) },
    { id: 'msg-39f', sender_id: 'user-22', sender_name: 'Chiara Rossi', sender_avatar: null, content: 'Yes I went last week. Make an appointment online first, and bring your rental contract + passport', created_at: d(0, 14.5) },
    { id: 'msg-39g', sender_id: 'user-admin-3', sender_name: 'Maria Garcia', sender_avatar: null, content: 'Also bring passport photos! They ask for those too. The office is in the Stadskantoor on Professor Van Overstraetenplein', created_at: d(0, 15) },
    { id: 'msg-39h', sender_id: 'user-21', sender_name: 'Lukas Schmidt', sender_avatar: null, content: 'Perfect, thanks both! This group is so helpful', created_at: d(0, 15.5) },
    { id: 'msg-39i', sender_id: 'user-22', sender_name: 'Chiara Rossi', sender_avatar: null, content: 'Does anyone know a good dentist that takes RIZIV?', created_at: h(6) },
  ],
  'sub-1': [
    { id: 'msg-50', sender_id: 'user-admin-1', sender_name: 'Pieter Janssens', sender_avatar: null, content: 'Board meeting minutes from last week are uploaded to the shared drive', created_at: d(2, 14) },
    { id: 'msg-51', sender_id: 'user-2', sender_name: 'Lotte De Smedt', sender_avatar: null, content: 'Thanks. We need to decide on the budget allocation before Friday.', created_at: d(2, 15) },
    { id: 'msg-52', sender_id: 'user-admin-1', sender_name: 'Pieter Janssens', sender_avatar: null, content: 'Agreed. I propose we split 40% events, 30% operations, 30% reserve', created_at: d(1, 10) },
    { id: 'msg-53', sender_id: 'user-2', sender_name: 'Lotte De Smedt', sender_avatar: null, content: 'Makes sense. Let us vote on it at the next board meeting.', created_at: d(1, 11) },
  ],
  'sub-3': [
    { id: 'msg-60', sender_id: 'user-admin-2', sender_name: 'Stijn Claes', sender_avatar: null, content: 'Praesidium meeting tomorrow at 18h in the VTK building', created_at: d(1, 16) },
    { id: 'msg-61', sender_id: 'user-11', sender_name: 'Emma Willems', sender_avatar: null, content: 'I will be 10 min late, coming from a lab session', created_at: d(1, 17) },
    { id: 'msg-62', sender_id: 'user-admin-2', sender_name: 'Stijn Claes', sender_avatar: null, content: 'No problem. Main topic: planning for the spring gala', created_at: d(0, 9) },
  ],
}

export const MOCK_JOIN_REQUESTS = {
  'comm-1': [
    { id: 'req-1', user_id: 'user-99', display_name: 'Sophie Mertens', avatar_url: null, created_at: h(3) },
    { id: 'req-2', user_id: 'user-98', display_name: 'Thomas Dubois', avatar_url: null, created_at: h(12) },
  ],
}

export const MOCK_SUBGROUP_MEMBERS = {
  'sub-1': [
    { user_id: 'user-admin-1', display_name: 'Pieter Janssens', avatar_url: null },
    { user_id: 'user-2', display_name: 'Lotte De Smedt', avatar_url: null },
    { user_id: 'user-3', display_name: 'Bram Wouters', avatar_url: null },
    { user_id: 'user-4', display_name: 'Fien Peeters', avatar_url: null },
    { user_id: 'user-5', display_name: 'Jens Maes', avatar_url: null },
  ],
  'sub-2': [
    { user_id: 'user-admin-1', display_name: 'Pieter Janssens', avatar_url: null },
    { user_id: 'user-2', display_name: 'Lotte De Smedt', avatar_url: null },
    { user_id: 'user-4', display_name: 'Fien Peeters', avatar_url: null },
  ],
  'sub-3': [
    { user_id: 'user-admin-2', display_name: 'Stijn Claes', avatar_url: null },
    { user_id: 'user-11', display_name: 'Emma Willems', avatar_url: null },
    { user_id: 'user-12', display_name: 'Robbe Jacobs', avatar_url: null },
    { user_id: 'user-13', display_name: 'Noor Van Damme', avatar_url: null },
  ],
  'sub-4': [
    { user_id: 'user-admin-2', display_name: 'Stijn Claes', avatar_url: null },
    { user_id: 'user-12', display_name: 'Robbe Jacobs', avatar_url: null },
  ],
  'sub-5': [
    { user_id: 'user-11', display_name: 'Emma Willems', avatar_url: null },
    { user_id: 'user-13', display_name: 'Noor Van Damme', avatar_url: null },
  ],
  'sub-6': [
    { user_id: 'user-admin-3', display_name: 'Maria Garcia', avatar_url: null },
    { user_id: 'user-21', display_name: 'Lukas Schmidt', avatar_url: null },
    { user_id: 'user-22', display_name: 'Chiara Rossi', avatar_url: null },
  ],
}
