"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { api, type Event } from "@/lib/api"
import Layout from "@/components/layout"
import EventCard from "@/components/event-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Bell, UserPlus } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

export default function MyFeedPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [subscriptions, setSubscriptions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [organizerEmail, setOrganizerEmail] = useState("")
  const [subscribing, setSubscribing] = useState(false)
  const [subscribeMessage, setSubscribeMessage] = useState<string | null>(null)
  const { isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
      return
    }
    loadFeedData()
  }, [isAuthenticated, router])

  const loadFeedData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [feedData, subscriptionsData] = await Promise.all([api.getMyFeed(), api.getMySubscriptions()])
      setEvents(feedData)
      setSubscriptions(subscriptionsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load feed data")
    } finally {
      setLoading(false)
    }
  }

  const handleSubscribeToOrganizer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!organizerEmail) return

    try {
      setSubscribing(true)
      setSubscribeMessage(null)
      const response = await api.subscribeToOrganizer(organizerEmail)
      setSubscribeMessage(response.message)
      setOrganizerEmail("")
      // Reload subscriptions
      const subscriptionsData = await api.getMySubscriptions()
      setSubscriptions(subscriptionsData)
    } catch (err) {
      setSubscribeMessage(err instanceof Error ? err.message : "Failed to subscribe")
    } finally {
      setSubscribing(false)
    }
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Feed</h1>
          <p className="text-gray-600">Events from organizers you follow</p>
        </div>

        {/* Subscribe to Organizer */}
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserPlus className="h-5 w-5 mr-2" />
              Follow an Organizer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubscribeToOrganizer} className="space-y-4">
              <Input
                type="email"
                placeholder="Organizer's email"
                value={organizerEmail}
                onChange={(e) => setOrganizerEmail(e.target.value)}
                required
              />
              <Button type="submit" className="w-full" disabled={subscribing}>
                {subscribing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Follow Organizer
              </Button>
            </form>
            {subscribeMessage && (
              <Alert className="mt-4">
                <AlertDescription>{subscribeMessage}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Current Subscriptions */}
        {subscriptions.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Following ({subscriptions.length})</h2>
            <div className="flex flex-wrap gap-2">
              {subscriptions.map((email, index) => (
                <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  {email}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Feed Events */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Bell className="h-6 w-6 mr-2" />
              Latest Events
            </h2>
            <Button onClick={loadFeedData} variant="outline" size="sm">
              Refresh
            </Button>
          </div>

          {loading && (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}

          {error && (
            <Alert className="mb-6">
              <AlertDescription className="text-red-600">{error}</AlertDescription>
            </Alert>
          )}

          {!loading && !error && events.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">
                {subscriptions.length === 0
                  ? "You're not following any organizers yet. Follow some organizers to see their events here!"
                  : "No events from your followed organizers yet."}
              </p>
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
      </div>
    </Layout>
  )
}
