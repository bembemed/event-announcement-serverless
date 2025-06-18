const API_BASE_URL = "https://el4jwj55k4.execute-api.eu-west-1.amazonaws.com/Prod"

export interface Event {
  title: string
  date: string
  location: string
  description?: string
  submittedBy?: string
  organizerName?: string
  createdAt?: string
}

export interface EventInput {
  title: string
  date: string
  location: string
  description?: string
}

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

import { getAuthToken } from './auth';

async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`
  const token = await getAuthToken();
  
  const config: RequestInit = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  }

  try {
    const response = await fetch(url, config)

    if (!response.ok) {
      const errorText = await response.text()
      throw new ApiError(response.status, errorText || `HTTP ${response.status}`)
    }

    const contentType = response.headers.get("content-type")
    if (contentType && contentType.includes("application/json")) {
      return await response.json()
    }

    return await response.text()
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new ApiError(0, "Network error occurred")
  }
}

export const api = {
  // Public endpoints
  getEvents: (): Promise<Event[]> => apiRequest("/events"),

  subscribe: (email: string): Promise<{ message: string }> =>
    apiRequest("/subscribe", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  // Authenticated endpoints
  submitEvent: (event: EventInput): Promise<{ message: string }> =>
    apiRequest("/event", {
      method: "POST",
      body: JSON.stringify(event),
    }),

  subscribeToOrganizer: (organizerEmail: string): Promise<{ message: string }> =>
    apiRequest("/subscribe-organizer", {
      method: "POST",
      body: JSON.stringify({ organizerEmail }),
    }),

  getMyEvents: (): Promise<Event[]> => apiRequest("/my/events"),

  getMySubscriptions: (): Promise<string[]> => apiRequest("/my/subscriptions"),

  getMyFeed: (): Promise<Event[]> => apiRequest("/my/feed"),
}
