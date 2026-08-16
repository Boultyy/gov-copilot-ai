import { createFileRoute } from '@tanstack/react-router'
import { supabase } from '@/integrations/supabase/client'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { User, Mail, Shield, Calendar } from 'lucide-react'
import { format } from 'date-fns'

export const Route = createFileRoute('/_authenticated/profile')({
  component: ProfilePage,
})

function ProfilePage() {
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      return { ...profile, email: user.email, created_at: user.created_at }
    }
  })

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading profile...</div>
  }

  if (!profile) {
    return <div className="p-8 text-center text-destructive">Profile not found.</div>
  }

  return (
    <div className="container max-w-4xl py-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-display font-bold tracking-tight">Citizen Profile</h1>
        <p className="text-muted-foreground">Manage your government digital identity and account settings.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-none shadow-xl shadow-primary/5 overflow-hidden">
          <CardHeader className="gradient-primary text-white">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Full Name</p>
              <p className="text-lg font-medium">{profile.full_name || 'Not provided'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email Address</p>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <p className="text-lg font-medium">{profile.email}</p>
              </div>
            </div>
            {profile.avatar_url && (
               <div className="space-y-1 pt-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Avatar</p>
                <img src={profile.avatar_url} alt="Profile" className="h-16 w-16 rounded-2xl object-cover border-2 border-primary/10" />
               </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl shadow-primary/5 overflow-hidden">
          <CardHeader className="bg-muted/50 border-b">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Shield className="h-5 w-5 text-primary" />
              Account Security
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
             <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Citizen ID</p>
              <code className="text-sm bg-muted px-2 py-1 rounded-lg break-all font-mono">{profile.id}</code>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Registration Date</p>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <p className="text-lg font-medium">
                  {profile.created_at ? format(new Date(profile.created_at), 'PPP') : 'N/A'}
                </p>
              </div>
            </div>
            <div className="pt-4">
              <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-emerald-50 text-emerald-700">
                Verified Digital Citizen
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
