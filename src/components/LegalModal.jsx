import { X } from 'lucide-react'

const PRIVACY_POLICY = {
  title: 'Privacy Policy',
  lastUpdated: 'April 3, 2026',
  sections: [
    {
      heading: 'What We Collect',
      body: `When you create an account, we store your email address, display name, username, and avatar. When you create events, we store the event details including the location you choose. We also store your friend connections, followed users, and event interests.`,
    },
    {
      heading: 'How We Use Your Data',
      body: `We use your data solely to provide the Meets service: showing events on the map, managing your social connections, and sending you in-app notifications. We do not sell your data to third parties. We do not use your data for advertising.`,
    },
    {
      heading: 'Cookies & Local Storage',
      body: `We use Supabase authentication cookies to keep you logged in. We also store your cookie consent preference and UI settings in your browser's local storage. No third-party tracking cookies are used.`,
    },
    {
      heading: 'Location Data',
      body: `If you grant permission, we access your device's location to center the map and enable distance-based filtering. Your location is never stored on our servers — it is only used client-side in your browser.`,
    },
    {
      heading: 'Data Storage',
      body: `Your data is stored securely on Supabase (powered by PostgreSQL) with row-level security policies. Data is hosted in the EU. Event images are stored in Supabase Storage.`,
    },
    {
      heading: 'Your Rights',
      body: `Under GDPR, you have the right to access, correct, or delete your personal data. You can delete your account by contacting us. You can remove individual events, friend connections, and interests at any time through the app.`,
    },
    {
      heading: 'Contact',
      body: `For privacy-related questions, reach out to the Meets team through the app or via the contact information on our website.`,
    },
  ],
}

const TERMS_OF_SERVICE = {
  title: 'Terms of Service',
  lastUpdated: 'April 3, 2026',
  sections: [
    {
      heading: 'Acceptance',
      body: `By creating an account or using Meets, you agree to these terms. If you do not agree, please do not use the service.`,
    },
    {
      heading: 'The Service',
      body: `Meets is a platform for discovering and hosting local events. Users can create events, mark interest, follow other users, and connect with friends. The service is provided as-is without warranty.`,
    },
    {
      heading: 'User Accounts',
      body: `You must provide a valid email address to create an account. You are responsible for maintaining the security of your account. Usernames must be 3-20 characters and may contain letters, numbers, dots, and underscores.`,
    },
    {
      heading: 'Content Rules',
      body: `You are responsible for the events you create. Events must not contain illegal, harmful, or misleading content. We reserve the right to remove events that violate these rules or receive multiple reports from the community.`,
    },
    {
      heading: 'Event Visibility',
      body: `Events can be set to public (visible to all users) or friends-only (visible only to your accepted friends). Public events appear on the map for everyone. You are responsible for choosing the appropriate visibility for your events.`,
    },
    {
      heading: 'Rate Limits',
      body: `To prevent abuse, users are limited to creating 5 events per 24-hour period. Events that receive 3 or more reports are automatically hidden from the map.`,
    },
    {
      heading: 'Termination',
      body: `We may suspend or terminate accounts that violate these terms. You may stop using the service at any time.`,
    },
    {
      heading: 'Changes',
      body: `We may update these terms from time to time. Continued use of the service after changes constitutes acceptance of the updated terms.`,
    },
  ],
}

export default function LegalModal({ type, onClose }) {
  const content = type === 'privacy' ? PRIVACY_POLICY : TERMS_OF_SERVICE

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center md:justify-center">
      <div onClick={onClose} className="absolute inset-0 bg-black/50 animate-fade-in" />
      <div className="relative w-full md:max-w-lg md:rounded-2xl rounded-t-3xl bg-white max-h-[90vh] overflow-y-auto animate-slide-up shadow-overlay">
        <div className="sticky top-0 bg-white z-10 px-6 pt-6 pb-3 flex items-center justify-between border-b border-surface-secondary">
          <h2 className="font-display text-xl font-bold text-ink">{content.title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-surface-secondary transition-colors text-ink-secondary"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6 pt-4">
          <p className="text-xs text-ink-tertiary font-body mb-4">
            Last updated: {content.lastUpdated}
          </p>
          {content.sections.map((section, i) => (
            <div key={i} className="mb-5">
              <h3 className="font-display font-bold text-sm text-ink mb-1.5">
                {section.heading}
              </h3>
              <p className="text-sm text-ink-secondary font-body leading-relaxed">
                {section.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
