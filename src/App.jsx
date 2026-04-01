import { useState, useEffect, useMemo } from 'react'
import { Plus, Loader2, MapPin } from 'lucide-react'
import { useAuth } from './hooks/useAuth'
import ProfileSettingsModal from './components/Auth/ProfileSettingsModal'
import { useGeolocation } from './hooks/useGeolocation'
import { useEvents } from './hooks/useEvents'
import { useToast } from './hooks/useToast'
import { useReports } from './hooks/useReports'
import { DEFAULT_ZOOM } from './lib/constants'
import MapView from './components/Map/MapView'
import DateNavigator from './components/Layout/DateNavigator'
import CategoryFilter from './components/Layout/CategoryFilter'
import LoginButton from './components/Auth/LoginButton'
import AuthModal from './components/Auth/AuthModal'
import FloatingControls from './components/Layout/FloatingControls'
import ListOverlay from './components/List/ListOverlay'
import EventDetailModal from './components/Event/EventDetailModal'
import HostEventModal from './components/Event/HostEventModal'
import Toast from './components/Toast'
import { uploadEventImage, deleteEventImage } from './lib/imageUtils'
import InstallPrompt from './components/InstallPrompt'
import MapSkeleton from './components/Map/MapSkeleton'
import { useInstallPrompt } from './hooks/useInstallPrompt'

export default function App() {
  // Auth
  const { user, loading: authLoading, signOut, updateProfile, updatePassword, isAdmin, displayName, avatarUrl } = useAuth()

  // Auth modal state
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authInitialTab, setAuthInitialTab] = useState('login')

  // Geolocation
  const { position, loading: geoLoading } = useGeolocation()

  // Date state (midnight today)
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  })

  // Events
  const {
    events,
    loading: eventsLoading,
    error,
    userInterests,
    createEvent,
    updateEvent,
    deleteEvent,
    toggleInterest,
    refreshEvents,
  } = useEvents(selectedDate)

  // Toast notifications
  const { toast, showToast, hideToast } = useToast()

  // Reports
  const { userReports, fetchUserReports, reportEvent } = useReports()

  // PWA install prompt
  const { showPrompt: showInstallPrompt, install: installApp, dismiss: dismissInstall } = useInstallPrompt()

  // UI state
  const [showList, setShowList] = useState(false)
  const [showHostForm, setShowHostForm] = useState(false)
  const [showEventDetail, setShowEventDetail] = useState(null)
  const [editingEvent, setEditingEvent] = useState(null)
  const [mapBounds, setMapBounds] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [mapFlyTarget, setMapFlyTarget] = useState(null)
  const [pendingEventId, setPendingEventId] = useState(null)

  // Share link: read ?event=<id> from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const eventId = params.get('event')
    if (eventId) {
      window.history.replaceState({}, '', window.location.pathname)
      setPendingEventId(eventId)
    }
  }, [])

  // Fetch user reports when authenticated
  useEffect(() => {
    if (user) {
      fetchUserReports(user.id)
    }
  }, [user, fetchUserReports])

  // Open shared event once events are loaded
  useEffect(() => {
    if (pendingEventId && events.length > 0) {
      const found = events.find(e => e.id === pendingEventId)
      if (found) {
        setShowEventDetail(found)
        setPendingEventId(null)
      }
    }
  }, [events, pendingEventId])

  // Filtered events for list (by bounds and category)
  const filteredEvents = useMemo(() => {
    let filtered = events

    if (mapBounds) {
      filtered = filtered.filter((e) =>
        e.lat != null && e.lng != null && mapBounds.contains([e.lat, e.lng])
      )
    }

    if (selectedCategory) {
      filtered = filtered.filter((e) => e.category === selectedCategory)
    }

    return filtered
  }, [events, mapBounds, selectedCategory])

  // Events filtered by category only (for map pins, no bounds filter)
  const displayEvents = useMemo(() => {
    if (!selectedCategory) return events
    return events.filter((e) => e.category === selectedCategory)
  }, [events, selectedCategory])

  // Handlers
  const handleMarkerClick = (event) => {
    setShowEventDetail(event)
  }

  const handleEventCardClick = (event) => {
    setShowEventDetail(event)
    if (event.lat != null && event.lng != null) {
      setMapFlyTarget({ lat: event.lat, lng: event.lng, _t: Date.now() })
    }
  }

  const handleBoundsChange = (bounds) => {
    setMapBounds(bounds)
  }

  const handleDateChange = (date) => {
    setSelectedDate(date instanceof Date ? date : new Date(date))
    setShowList(false)
    setShowEventDetail(null)
    setSearchQuery('')
    setSelectedCategory(null)
  }

  const handleToggleList = () => {
    setShowList((prev) => !prev)
  }

  const openAuthModal = (tab = 'login') => {
    setAuthInitialTab(tab)
    setShowAuthModal(true)
  }

  const handleHostEvent = () => {
    if (user) {
      setShowHostForm(true)
    } else {
      openAuthModal('login')
    }
  }

  const handleCreateEvent = async (eventData) => {
    try {
      const { _imageFile, _existingImageUrl, ...fields } = eventData
      const payload = {
        ...fields,
        created_by_id: user.id,
        start_time: fields.start_time?.length === 5 ? fields.start_time + ':00' : fields.start_time,
        end_time: fields.end_time?.length === 5 ? fields.end_time + ':00' : fields.end_time,
      }
      const { data, error: err } = await createEvent(payload)
      if (err) throw err

      // Upload image after event is created (need the event ID)
      if (_imageFile && data?.id) {
        try {
          const imageUrl = await uploadEventImage(_imageFile, data.id)
          await updateEvent(data.id, { image_url: imageUrl })
        } catch (imgErr) {
          console.error('Image upload failed:', imgErr)
          // Event still created, just without image
        }
      }

      setShowHostForm(false)
      refreshEvents()
      showToast('Event created!')
    } catch (err) {
      showToast('Something went wrong', 'error')
      throw err
    }
  }

  const handleUpdateEvent = async (eventData) => {
    try {
      const { _imageFile, _existingImageUrl, ...fields } = eventData
      const payload = {
        ...fields,
        start_time: fields.start_time?.length === 5 ? fields.start_time + ':00' : fields.start_time,
        end_time: fields.end_time?.length === 5 ? fields.end_time + ':00' : fields.end_time,
      }

      // Handle image upload/change
      if (_imageFile) {
        try {
          const imageUrl = await uploadEventImage(_imageFile, editingEvent.id)
          payload.image_url = imageUrl
          // Delete old image if replacing
          if (_existingImageUrl) {
            deleteEventImage(_existingImageUrl)
          }
        } catch (imgErr) {
          console.error('Image upload failed:', imgErr)
        }
      }

      const { error: err } = await updateEvent(editingEvent.id, payload)
      if (err) throw err
      setShowHostForm(false)
      setEditingEvent(null)
      refreshEvents()
      showToast('Event updated!')
    } catch (err) {
      showToast('Something went wrong', 'error')
      throw err
    }
  }

  const handleDeleteEvent = async (eventId) => {
    const { error: err } = await deleteEvent(eventId)
    if (err) {
      console.error('Delete failed:', err)
      showToast('Something went wrong', 'error')
      return
    }
    setShowEventDetail(null)
    refreshEvents()
    showToast('Event deleted')
  }

  const handleReportEvent = async (eventId, reason) => {
    if (!user) {
      openAuthModal('login')
      return
    }
    return reportEvent(eventId, user.id, reason)
  }

  const handleToggleInterest = (eventId) => {
    if (user) {
      const isInterested = userInterests.has(eventId)
      toggleInterest(eventId, user.id, isInterested)
      showToast(isInterested ? 'Removed from interests' : 'Added to interests')
    } else {
      openAuthModal('login')
    }
  }

  return (
    <div className="relative w-full font-body" style={{ height: '100dvh' }}>
      {/* Map (full screen, behind everything) */}
      <MapView
        events={displayEvents}
        selectedEvent={showEventDetail}
        onMarkerClick={handleMarkerClick}
        onBoundsChange={handleBoundsChange}
        center={position}
        zoom={DEFAULT_ZOOM}
        flyTarget={mapFlyTarget}
      />

      {/* Skeleton pins while events are loading */}
      {eventsLoading && <MapSkeleton />}

      {/* Floating controls over the map */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 animate-fade-in flex-shrink-0">
        <DateNavigator selectedDate={selectedDate} onDateChange={handleDateChange} />
        <CategoryFilter selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} />
      </div>

      <div className="absolute top-4 right-4 z-10 flex items-center gap-2 animate-fade-in flex-shrink-0">
        <LoginButton user={user} onLoginClick={() => openAuthModal('login')} signOut={signOut} displayName={displayName} avatarUrl={avatarUrl} onSettingsClick={() => setShowSettings(true)} />
        <FloatingControls
          onToggleList={handleToggleList}
          onHostEvent={handleHostEvent}
          showList={showList}
        />
      </div>

      {/* Empty state overlay on map */}
      {!eventsLoading && events.length === 0 && !showList && !showHostForm && !showEventDetail && (
        <div className="absolute inset-0 z-[5] flex items-center justify-center pointer-events-none">
          <div className="card p-6 text-center max-w-xs pointer-events-auto animate-bounce-in">
            <div className="w-14 h-14 rounded-full bg-meets-50 flex items-center justify-center mx-auto mb-3">
              <MapPin size={24} className="text-meets-500" />
            </div>
            <h3 className="font-display font-bold text-base text-ink mb-1">Nothing here yet</h3>
            <p className="font-body text-sm text-ink-secondary mb-4">
              No events on this date. Why not create one?
            </p>
            <button onClick={handleHostEvent} className="btn-primary text-sm px-5 py-2">
              Host Event
            </button>
          </div>
        </div>
      )}

      {/* Host Event FAB at bottom */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
        <button
          onClick={handleHostEvent}
          className="fab-host flex items-center gap-2 px-7 py-3.5 rounded-full
            font-display font-bold text-white text-sm tracking-wide
            shadow-float-lg hover:shadow-[0_12px_40px_rgba(26,133,255,0.4)]
            transition-all duration-300 hover:scale-105 active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #1A85FF 0%, #0066E6 100%)',
          }}
        >
          <Plus size={20} strokeWidth={2.5} />
          <span>Host Event</span>
        </button>
      </div>

      {/* List Overlay */}
      <ListOverlay
        events={filteredEvents}
        show={showList}
        onClose={() => setShowList(false)}
        user={user}
        onEventClick={handleEventCardClick}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        userInterests={userInterests}
        onToggleInterest={handleToggleInterest}
        loading={eventsLoading}
        onRefresh={refreshEvents}
        onLoginRequired={() => openAuthModal('signup')}
        onHostEvent={handleHostEvent}
      />

      {/* Event Detail Modal */}
      {showEventDetail && (
        <EventDetailModal
          event={showEventDetail}
          user={user}
          onClose={() => setShowEventDetail(null)}
          onEdit={(event) => {
            setEditingEvent(event)
            setShowHostForm(true)
            setShowEventDetail(null)
          }}
          onDelete={handleDeleteEvent}
          isInterested={userInterests.has(showEventDetail.id)}
          interestedCount={events.find(e => e.id === showEventDetail.id)?.interested_count ?? showEventDetail.interested_count}
          onToggleInterest={() => handleToggleInterest(showEventDetail.id)}
          isAdmin={isAdmin}
          showToast={showToast}
          onReport={handleReportEvent}
          hasReported={userReports.has(showEventDetail.id)}
        />
      )}

      {/* Host Event Modal */}
      {showHostForm && (
        <HostEventModal
          user={user}
          onClose={() => {
            setShowHostForm(false)
            setEditingEvent(null)
          }}
          onSuccess={editingEvent ? handleUpdateEvent : handleCreateEvent}
          editingEvent={editingEvent}
        />
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialTab={authInitialTab}
      />

      {/* Profile Settings Modal */}
      {showSettings && (
        <ProfileSettingsModal
          user={user}
          displayName={displayName}
          avatarUrl={avatarUrl}
          onClose={() => setShowSettings(false)}
          updateProfile={updateProfile}
          updatePassword={updatePassword}
          showToast={showToast}
        />
      )}

      {/* PWA Install Prompt */}
      {showInstallPrompt && (
        <InstallPrompt onInstall={installApp} onDismiss={dismissInstall} />
      )}

      {/* Toast notifications */}
      {toast && (
        <Toast
          key={toast.id}
          id={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}

      {/* Loading overlay */}
      {(authLoading || geoLoading) && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-meets-500 mx-auto" />
            <p className="mt-3 font-display text-ink-secondary">Loading Meets...</p>
          </div>
        </div>
      )}
    </div>
  )
}
