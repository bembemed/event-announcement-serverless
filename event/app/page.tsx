"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { api, type Event } from "@/lib/api"
import Layout from "@/components/layout"
import EventCard from "@/components/event-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Mail, Plus } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function HomePage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState("")
  const [subscribing, setSubscribing] = useState(false)
  const [subscribeMessage, setSubscribeMessage] = useState<string | null>(null)
  const { isAuthenticated } = useAuth()
  const [subscribers, setSubscribers] = useState<string[]>([])

  useEffect(() => {
    loadEvents()
    loadSubscribers()
  }, [])

  const loadEvents = async () => {
    try {
      setLoading(true)
      setError(null)
      const eventsData = await api.getEvents()
      setEvents(eventsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load events")
    } finally {
      setLoading(false)
    }
  }

  const loadSubscribers = async () => {
    try {
      const eventsData = await api.getEvents()
      const uniqueOrganizers = [...new Set(eventsData.map((event) => event.submittedBy).filter(Boolean))] as string[]
      setSubscribers(uniqueOrganizers)
    } catch (err) {
      console.error("Failed to load subscribers:", err)
    }
  }

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    try {
      setSubscribing(true)
      setSubscribeMessage(null)
      const response = await api.subscribe(email)
      setSubscribeMessage(response.message)
      setEmail("")
    } catch (err) {
      setSubscribeMessage(err instanceof Error ? err.message : "Failed to subscribe")
    } finally {
      setSubscribing(false)
    }
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">Discover Amazing Events</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Find and join events in your area. Stay updated with the latest happenings.
          </p>

          {isAuthenticated && (
            <Link href="/submit-event">
              <Button size="lg" className="mt-4">
                <Plus className="h-5 w-5 mr-2" />
                Submit New Event
              </Button>
            </Link>
          )}
        </div>

        {/* Email Subscription */}
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mail className="h-5 w-5 mr-2" />
              Stay Updated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubscribe} className="space-y-4">
              <Select value={email} onValueChange={setEmail}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a subscriber" />
                </SelectTrigger>
                <SelectContent>
                  {subscribers.map((subscriber) => (
                    <SelectItem key={subscriber} value={subscriber}>
                      {subscriber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="submit" className="w-full" disabled={subscribing}>
                {subscribing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Subscribe to Updates
              </Button>
            </form>
            {subscribeMessage && (
              <Alert className="mt-4">
                <AlertDescription>{subscribeMessage}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Events List */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Upcoming Events</h2>
            <Button onClick={loadEvents} variant="outline" size="sm">
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
              <p className="text-gray-500">No events found. Be the first to submit one!</p>
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
