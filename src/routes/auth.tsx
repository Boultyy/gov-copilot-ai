import { createFileRoute, redirect } from '@tanstack/react-router'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '@/integrations/supabase/client'
import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles } from 'lucide-react'

export const Route = createFileRoute('/auth')({
  component: AuthPage,
})

function AuthPage() {
  const navigate = useNavigate()
  const search = Route.useSearch() as { redirect?: string }

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
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
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
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
          />
        </CardContent>
      </Card>
    </div>
  )
}
