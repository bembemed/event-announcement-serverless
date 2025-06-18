"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { api, type Event } from "@/lib/api"
import Layout from "@/components/layout"
import EventCard from "@/components/event-card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Plus } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"

export default function MyEventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
      return
    }
    loadMyEvents()
  }, [isAuthenticated, router])

  const loadMyEvents = async () => {
    try {
      setLoading(true)
      setError(null)
      const eventsData = await api.getMyEvents()
      setEvents(eventsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load your events")
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">My Events</h1>
          <Link href="/submit-event">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add New Event
            </Button>
          </Link>
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        )}

        {error && (
          <Alert>
            <AlertDescription className="text-red-600">{error}</AlertDescription>
          </Alert>
        )}

        {!loading && !error && events.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">You haven't submitted any events yet.</p>
            <Link href="/submit-event">
              <Button>Submit Your First Event</Button>
            </Link>
          </div>
        )}

        {!loading && events.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event, index) => (
              <EventCard key={index} event={event} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
