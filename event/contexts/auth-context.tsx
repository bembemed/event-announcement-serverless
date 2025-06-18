"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { Amplify } from 'aws-amplify'
import { signIn, signOut, getCurrentUser, confirmSignUp as confirmSignUpAuth, signUp as signUpAuth } from '@aws-amplify/auth'
import { fetchAuthSession } from '@aws-amplify/auth'
import awsConfig from '@/lib/aws-config'

// Initialize Amplify and Auth
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: 'eu-west-1_YLxnh9hcD',
      userPoolClientId: '3q9aj2dg61h7nmqphnmu7ipqgs',
      signUpVerificationMethod: 'code'
    }
  }
})

interface AuthContextType {
  isAuthenticated: boolean
  userEmail: string | null
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  loading: boolean
  signUp: (username: string, password: string) => Promise<void>
  confirmSignUp: (username: string, code: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuthState()
  }, [])

  const checkAuthState = async () => {
    try {
      const session = await fetchAuthSession()
      const user = await getCurrentUser()
      setIsAuthenticated(true)
      setUserEmail(user.username)
    } catch {
      setIsAuthenticated(false)
      setUserEmail(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (username: string, password: string) => {
    try {
      const { isSignedIn } = await signIn({ username, password })
      if (isSignedIn) {
        setIsAuthenticated(true)
        setUserEmail(username)
      }
    } catch (error) {
      console.error('Error signing in:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      await signOut()
      setIsAuthenticated(false)
      setUserEmail(null)
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
    }
  }

  const signUp = async (username: string, password: string) => {
    try {
      await signUpAuth({
        username,
        password,
        options: {
          userAttributes: {
            email: username,
          },
        },
      })
    } catch (error) {
      console.error('Error signing up:', error)
      throw error
    }
  }

  const confirmSignUp = async (username: string, code: string) => {
    try {
      await confirmSignUpAuth({ username, confirmationCode: code })
    } catch (error) {
      console.error('Error confirming sign up:', error)
      throw error
    }
  }

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      userEmail, 
      login, 
      logout, 
      loading,
      signUp,
      confirmSignUp
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
