import React, { useState, useEffect } from 'react'
import { supabase, supabaseConfigured } from './lib/supabase'
import Auth from './Auth'
import AdminPanel from './AdminPanel'
import CampaignDashboard from './CampaignDashboard'

const SetupScreen = () => (
  <div style={{
    minHeight: '100vh', background: '#040b14', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontFamily: 'Space Mono, monospace',
    backgroundImage: 'linear-gradient(#00F5FF06 1px,transparent 1px),linear-gradient(90deg,#00F5FF06 1px,transparent 1px)',
    backgroundSize: '40px 40px',
  }}>
    <div style={{ maxWidth: 480, background: '#0a1628', border: '1px solid #FFD70033', borderRadius: 16, padding: '40px', textAlign: 'center' }}>
      <div style={{ fontSize: 36, marginBottom: 16 }}>⚙️</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: '#FFD700', letterSpacing: 2, marginBottom: 12 }}>SETUP REQUIRED</div>
      <p style={{ fontSize: 11, color: '#4a7a9b', lineHeight: 1.8, marginBottom: 24 }}>
        Supabase environment variables are not set.<br />
        Go to <span style={{ color: '#FFD700' }}>Vercel → Your Project → Settings → Environment Variables</span> and add:
      </p>
      <div style={{ background: '#060f1e', border: '1px solid #FFD70022', borderRadius: 8, padding: '16px', textAlign: 'left', fontSize: 11, lineHeight: 2, color: '#e2e8f0' }}>
        <div><span style={{ color: '#FFD700' }}>VITE_SUPABASE_URL</span> = your project URL</div>
        <div><span style={{ color: '#FFD700' }}>VITE_SUPABASE_ANON_KEY</span> = your anon key</div>
      </div>
      <p style={{ fontSize: 10, color: '#2a4a6b', marginTop: 16, lineHeight: 1.8 }}>
        Get these from supabase.com → your project → Settings → API.<br />
        Then redeploy on Vercel.
      </p>
    </div>
  </div>
)

export default function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('dashboard')

  useEffect(() => {
    if (!supabaseConfigured) { setLoading(false); return }

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
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
      setProfile(data)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  if (!supabaseConfigured) return <SetupScreen />

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
