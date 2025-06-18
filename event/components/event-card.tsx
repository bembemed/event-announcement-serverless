import type { Event } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, User } from "lucide-react"

interface EventCardProps {
  event: Event
}

export default function EventCard({ event }: EventCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <Card className="h-full hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="text-lg">{event.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center text-sm text-gray-600">
          <Calendar className="h-4 w-4 mr-2" />
          {formatDate(event.date)}
        </div>

        <div className="flex items-center text-sm text-gray-600">
          <MapPin className="h-4 w-4 mr-2" />
          {event.location}
        </div>

        {event.description && <p className="text-sm text-gray-700 line-clamp-3">{event.description}</p>}

        {event.submittedBy && (
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center text-xs text-gray-500">
              <User className="h-3 w-3 mr-1" />
              {event.submittedBy}
            </div>
            {event.createdAt && (
              <Badge variant="secondary" className="text-xs">
                {new Date(event.createdAt).toLocaleDateString()}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
