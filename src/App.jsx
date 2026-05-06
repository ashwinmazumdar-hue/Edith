import React, { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Auth from './Auth'
import AdminPanel from './AdminPanel'
import CampaignDashboard from './CampaignDashboard'

export default function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('dashboard') // 'dashboard' | 'admin'

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) loadProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) loadProfile(session.user.id)
      else { setProfile(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadProfile = async (userId) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    setProfile(data)
    setLoading(false)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#040b14', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 12, color: '#00F5FF', letterSpacing: 3 }}>LOADING EDITH…</div>
    </div>
  )

  if (!session) return <Auth />

  if (profile?.is_blocked) return (
    <div style={{ minHeight: '100vh', background: '#040b14', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
      <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 32, color: '#FF2D78' }}>⛔</div>
      <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 14, color: '#FF2D78', letterSpacing: 2 }}>ACCOUNT SUSPENDED</div>
      <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: '#4a7a9b' }}>Contact your administrator.</div>
      <button onClick={() => supabase.auth.signOut()} style={{ marginTop: 12, padding: '10px 24px', background: 'transparent', border: '1px solid #FF2D7844', borderRadius: 8, color: '#FF2D78', fontFamily: 'Space Mono', fontSize: 11, cursor: 'pointer' }}>Sign Out</button>
    </div>
  )

  if (view === 'admin' && profile?.role === 'admin') return <AdminPanel onBack={() => setView('dashboard')} />

  return (
    <CampaignDashboard
      user={session.user}
      profile={profile}
      onSignOut={() => supabase.auth.signOut()}
      onAdmin={profile?.role === 'admin' ? () => setView('admin') : null}
    />
  )
}
