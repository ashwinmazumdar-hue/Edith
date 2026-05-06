import React, { useState } from 'react'
import { supabase } from './lib/supabase'

const fontLink = document.createElement('link')
fontLink.href = 'https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap'
fontLink.rel = 'stylesheet'
if (!document.head.querySelector('link[href*="Space+Mono"]')) document.head.appendChild(fontLink)

export default function Auth() {
  const [mode, setMode] = useState('login')   // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handle = async () => {
    if (!email || !password) { setError('Email and password required'); return }
    setLoading(true); setError(''); setSuccess('')
    try {
      if (mode === 'login') {
        const { data, error: err } = await supabase.auth.signInWithPassword({ email, password })
        if (err) throw err
        // Check if blocked
        const { data: profile } = await supabase.from('profiles').select('is_blocked').eq('id', data.user.id).single()
        if (profile?.is_blocked) {
          await supabase.auth.signOut()
          throw new Error('Your account has been suspended. Contact your administrator.')
        }
      } else {
        const { error: err } = await supabase.auth.signUp({ email, password })
        if (err) throw err
        setSuccess('Account created! Check your email to confirm, then log in.')
        setMode('login')
      }
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#040b14', display: 'flex',
      alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne, sans-serif',
      backgroundImage: 'linear-gradient(#00F5FF06 1px,transparent 1px),linear-gradient(90deg,#00F5FF06 1px,transparent 1px)',
      backgroundSize: '40px 40px',
    }}>
      <div style={{
        width: 400, background: 'linear-gradient(135deg,#0a1628,#071020)',
        border: '1px solid #00F5FF22', borderRadius: 16, padding: '48px 40px',
        boxShadow: '0 0 60px #00F5FF08',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontFamily: 'Space Mono', fontSize: 28, fontWeight: 700, color: '#00F5FF', letterSpacing: 4 }}>EDITH</div>
          <div style={{ fontFamily: 'Space Mono', fontSize: 9, color: '#2a4a6b', letterSpacing: 4, marginTop: 4 }}>CAMPAIGN INTELLIGENCE</div>
        </div>

        {/* Toggle */}
        <div style={{ display: 'flex', background: '#060f1e', borderRadius: 8, padding: 3, marginBottom: 28, border: '1px solid #00F5FF14' }}>
          {['login','signup'].map(m => (
            <button key={m} onClick={() => { setMode(m); setError(''); setSuccess('') }} style={{
              flex: 1, padding: '8px 0', border: 'none', cursor: 'pointer', borderRadius: 6,
              background: mode === m ? '#00F5FF18' : 'transparent',
              color: mode === m ? '#00F5FF' : '#4a7a9b',
              fontFamily: 'Space Mono', fontSize: 11, fontWeight: 700, letterSpacing: 1,
              borderBottom: mode === m ? '1px solid #00F5FF55' : '1px solid transparent',
              transition: 'all .15s', textTransform: 'uppercase',
            }}>{m}</button>
          ))}
        </div>

        {/* Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontFamily: 'Space Mono', fontSize: 9, color: '#4a7a9b', letterSpacing: 2, display: 'block', marginBottom: 6 }}>EMAIL</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handle()}
              placeholder="you@company.com"
              style={{
                width: '100%', padding: '11px 14px', background: '#060f1e',
                border: '1px solid #00F5FF22', borderRadius: 8, color: '#e2e8f0',
                fontFamily: 'Space Mono', fontSize: 12, boxSizing: 'border-box',
              }} />
          </div>
          <div>
            <label style={{ fontFamily: 'Space Mono', fontSize: 9, color: '#4a7a9b', letterSpacing: 2, display: 'block', marginBottom: 6 }}>PASSWORD</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handle()}
              placeholder="••••••••"
              style={{
                width: '100%', padding: '11px 14px', background: '#060f1e',
                border: '1px solid #00F5FF22', borderRadius: 8, color: '#e2e8f0',
                fontFamily: 'Space Mono', fontSize: 12, boxSizing: 'border-box',
              }} />
          </div>
        </div>

        {error && <div style={{ marginTop: 14, padding: '10px 14px', background: '#FF2D7815', border: '1px solid #FF2D7833', borderRadius: 8, fontFamily: 'Space Mono', fontSize: 10, color: '#FF2D78', lineHeight: 1.6 }}>{error}</div>}
        {success && <div style={{ marginTop: 14, padding: '10px 14px', background: '#39FF1415', border: '1px solid #39FF1433', borderRadius: 8, fontFamily: 'Space Mono', fontSize: 10, color: '#39FF14', lineHeight: 1.6 }}>{success}</div>}

        <button onClick={handle} disabled={loading} style={{
          width: '100%', marginTop: 24, padding: '13px 0',
          background: loading ? '#0a1628' : 'linear-gradient(135deg,#00F5FF,#0099AA)',
          border: 'none', borderRadius: 8, color: '#040b14',
          fontFamily: 'Syne', fontWeight: 800, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer',
          letterSpacing: 1, transition: 'opacity .15s',
        }}>
          {loading ? '⏳ Please wait…' : mode === 'login' ? '→ Sign In' : '→ Create Account'}
        </button>

        <p style={{ fontFamily: 'Space Mono', fontSize: 9, color: '#2a4a6b', textAlign: 'center', marginTop: 20, lineHeight: 1.8 }}>
          Access is managed by your administrator.
        </p>
      </div>
    </div>
  )
}
