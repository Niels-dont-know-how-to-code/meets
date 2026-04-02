import { useState, useEffect } from 'react';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('meets_cookie_consent');
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('meets_cookie_consent', 'accepted');
    setVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('meets_cookie_consent', 'declined');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 bg-white shadow-overlay
        rounded-t-2xl animate-slide-up"
    >
      <div className="max-w-lg mx-auto px-5 py-4 flex flex-col sm:flex-row items-center gap-3">
        <p className="font-body text-sm text-ink-secondary text-center sm:text-left flex-1">
          We use cookies to keep you logged in and improve your experience.
        </p>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleDecline}
            className="text-sm font-display font-medium text-ink-secondary hover:text-ink transition-colors px-3 py-1.5"
          >
            Decline
          </button>
          <button
            onClick={handleAccept}
            className="btn-primary text-sm px-5 py-2"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
