import { createFileRoute, redirect } from '@tanstack/react-router'
import { supabase } from '@/integrations/supabase/client'
import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, Loader2 } from 'lucide-react'
import React from 'react'

const Auth = React.lazy(() => import('@supabase/auth-ui-react').then(m => ({ default: m.Auth })));
const ThemeSupa = React.lazy(() => import('@supabase/auth-ui-shared').then(m => ({ default: m.ThemeSupa })));

export const Route = createFileRoute('/auth')({
  component: AuthPage,
})

function AuthPage() {
  const navigate = useNavigate()
  const search = Route.useSearch() as { redirect?: string }

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
        navigate({ to: search.redirect || '/' })
      }
    })

    return () => subscription.unsubscribe()
  }, [navigate, search.redirect])

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md border-none shadow-2xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="font-display text-2xl font-bold">Welcome to GovCopilot</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">Sign in to access your secure government assistant</p>
        </CardHeader>
        <CardContent>
          {typeof window !== 'undefined' ? (
            <React.Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
              <Auth
                supabaseClient={supabase}
                appearance={{
                  theme: ThemeSupa as any,
                  variables: {
                    default: {
                      colors: {
                        brand: 'oklch(0.55 0.15 250)',
                        brandAccent: 'oklch(0.45 0.15 250)',
                      },
                    },
                  },
                  className: {
                    button: 'rounded-xl font-bold py-2',
                    input: 'rounded-xl bg-muted/50 border-border',
                  }
                }}
                providers={['google', 'apple']}
                redirectTo={`${window.location.origin}/auth`}
                localization={{
                  variables: {
                    sign_in: {
                      social_provider_text: 'Sign in with {{provider}} (Dev Mode)',
                    },
                  },
                }}
              />
            </React.Suspense>
          ) : (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          <p className="text-[10px] text-muted-foreground mt-4 text-center px-4">
            Note: Google and Apple sign-in require manual configuration. If you see a configuration error, please use Email and Password to test the application.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
