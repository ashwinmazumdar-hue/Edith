import React, { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { Shield, Users, RefreshCw, Ban, CheckCircle, Trash2, Crown } from 'lucide-react'

export default function AdminPanel({ onBack }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [toast, setToast] = useState('')

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const loadUsers = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) setUsers(data || [])
    setLoading(false)
  }

  useEffect(() => { loadUsers() }, [])

  const toggleBlock = async (user) => {
    setActionLoading(user.id)
    const { error } = await supabase
      .from('profiles')
      .update({ is_blocked: !user.is_blocked })
      .eq('id', user.id)
    if (!error) {
      showToast(`✓ ${user.email} ${!user.is_blocked ? 'blocked' : 'unblocked'}`)
      loadUsers()
    } else {
      showToast(`✗ ${error.message}`)
    }
    setActionLoading(null)
  }

  const toggleAdmin = async (user) => {
    setActionLoading(user.id)
    const newRole = user.role === 'admin' ? 'user' : 'admin'
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', user.id)
    if (!error) {
      showToast(`✓ ${user.email} is now ${newRole}`)
      loadUsers()
    } else {
      showToast(`✗ ${error.message}`)
    }
    setActionLoading(null)
  }

  const stats = {
    total: users.length,
    active: users.filter(u => !u.is_blocked).length,
    blocked: users.filter(u => u.is_blocked).length,
    admins: users.filter(u => u.role === 'admin').length,
  }

  return (
    <div style={{ minHeight: '100vh', background: '#040b14', fontFamily: 'Syne, sans-serif', padding: 32,
      backgroundImage: 'linear-gradient(#00F5FF06 1px,transparent 1px),linear-gradient(90deg,#00F5FF06 1px,transparent 1px)',
      backgroundSize: '40px 40px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
        <button onClick={onBack} style={{ background: 'none', border: '1px solid #00F5FF22', borderRadius: 8, padding: '8px 14px', color: '#4a7a9b', cursor: 'pointer', fontFamily: 'Space Mono', fontSize: 11 }}>← Back</button>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Shield size={20} color="#00F5FF" />
            <h1 style={{ fontFamily: 'Space Mono', fontWeight: 700, fontSize: 18, color: '#00F5FF', letterSpacing: 2 }}>ADMIN PANEL</h1>
          </div>
          <p style={{ fontFamily: 'Space Mono', fontSize: 10, color: '#4a7a9b', marginTop: 4 }}>User management & access control</p>
        </div>
        <div style={{ flex: 1 }} />
        <button onClick={loadUsers} style={{ background: 'none', border: '1px solid #00F5FF22', borderRadius: 8, padding: '8px 14px', color: '#00F5FF', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Space Mono', fontSize: 11 }}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Total Users', val: stats.total, color: '#00F5FF' },
          { label: 'Active', val: stats.active, color: '#39FF14' },
          { label: 'Blocked', val: stats.blocked, color: '#FF2D78' },
          { label: 'Admins', val: stats.admins, color: '#FFD700' },
        ].map(({ label, val, color }) => (
          <div key={label} style={{ background: '#0a1628', border: `1px solid ${color}22`, borderRadius: 12, padding: '20px 24px' }}>
            <div style={{ fontFamily: 'Space Mono', fontSize: 9, color: '#4a7a9b', letterSpacing: 2, marginBottom: 8 }}>{label.toUpperCase()}</div>
            <div style={{ fontFamily: 'Space Mono', fontSize: 28, fontWeight: 700, color }}>{val}</div>
          </div>
        ))}
      </div>

      {/* User table */}
      <div style={{ background: '#0a1628', border: '1px solid #00F5FF18', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #00F5FF14', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Users size={15} color="#00F5FF" />
          <span style={{ fontFamily: 'Space Mono', fontWeight: 700, fontSize: 12, color: '#00F5FF', letterSpacing: 1 }}>ALL USERS</span>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', fontFamily: 'Space Mono', fontSize: 11, color: '#4a7a9b' }}>Loading users…</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#060f1e' }}>
                {['Email', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontFamily: 'Space Mono', fontSize: 9, color: '#4a7a9b', letterSpacing: 2, borderBottom: '1px solid #00F5FF10' }}>{h.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} style={{ borderBottom: '1px solid #00F5FF08' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#00F5FF04'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '14px 20px', fontFamily: 'Space Mono', fontSize: 11, color: '#e2e8f0' }}>
                    {user.email}
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{
                      fontFamily: 'Space Mono', fontSize: 9, letterSpacing: 1,
                      color: user.role === 'admin' ? '#FFD700' : '#4a7a9b',
                      background: user.role === 'admin' ? '#FFD70015' : '#ffffff08',
                      border: `1px solid ${user.role === 'admin' ? '#FFD70033' : '#ffffff10'}`,
                      borderRadius: 20, padding: '3px 10px',
                    }}>
                      {user.role === 'admin' ? '👑 ADMIN' : 'USER'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{
                      fontFamily: 'Space Mono', fontSize: 9, letterSpacing: 1,
                      color: user.is_blocked ? '#FF2D78' : '#39FF14',
                      background: user.is_blocked ? '#FF2D7815' : '#39FF1415',
                      border: `1px solid ${user.is_blocked ? '#FF2D7833' : '#39FF1433'}`,
                      borderRadius: 20, padding: '3px 10px',
                    }}>
                      {user.is_blocked ? '⛔ BLOCKED' : '● ACTIVE'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px', fontFamily: 'Space Mono', fontSize: 10, color: '#4a7a9b' }}>
                    {new Date(user.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {/* Block / Unblock */}
                      <button
                        onClick={() => toggleBlock(user)}
                        disabled={actionLoading === user.id}
                        title={user.is_blocked ? 'Unblock user' : 'Block user'}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
                          background: 'transparent',
                          border: `1px solid ${user.is_blocked ? '#39FF1444' : '#FF2D7844'}`,
                          borderRadius: 6, cursor: 'pointer',
                          color: user.is_blocked ? '#39FF14' : '#FF2D78',
                          fontFamily: 'Space Mono', fontSize: 9,
                        }}>
                        {user.is_blocked ? <><CheckCircle size={11} /> Unblock</> : <><Ban size={11} /> Block</>}
                      </button>
                      {/* Make admin / Remove admin */}
                      <button
                        onClick={() => toggleAdmin(user)}
                        disabled={actionLoading === user.id}
                        title={user.role === 'admin' ? 'Remove admin' : 'Make admin'}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
                          background: 'transparent',
                          border: `1px solid ${user.role === 'admin' ? '#4a7a9b44' : '#FFD70044'}`,
                          borderRadius: 6, cursor: 'pointer',
                          color: user.role === 'admin' ? '#4a7a9b' : '#FFD700',
                          fontFamily: 'Space Mono', fontSize: 9,
                        }}>
                        <Crown size={11} /> {user.role === 'admin' ? 'Demote' : 'Make Admin'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 28, right: 28, padding: '12px 20px',
          background: '#0a1628', border: '1px solid #00F5FF44', borderRadius: 8,
          fontFamily: 'Space Mono', fontSize: 11, color: '#00F5FF',
          boxShadow: '0 0 20px #00F5FF22', zIndex: 999,
        }}>{toast}</div>
      )}
    </div>
  )
}
