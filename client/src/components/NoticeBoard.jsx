/** (developed by @neelotpal.dey) **/
import React, { useEffect, useState } from 'react'
import { useAuthStore } from '../store/auth'

const LOCAL_PLATFORM_KEY = 'ge_local_platform'

const loadLocalNotices = () => {
  try {
    const raw = localStorage.getItem(LOCAL_PLATFORM_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && Array.isArray(parsed.notices)) {
        return parsed.notices
      }
    }
  } catch {}
  return null
}

const applyFilter = (list, audience) => {
  return list.filter((n) => {
    if (!n || n.isActive !== true) return false
    if (audience === 'all' || n.audience === 'all' || n.audience === audience) return true
    return false
  })
}

export default function NoticeBoard({ audience = 'all', compact = false }) {
  const [items, setItems] = useState([])

  useEffect(() => {
    let cancelled = false
    const isLocalAuth = useAuthStore.getState().isLocalUser()

    fetch(`/api/platform/notices?audience=${encodeURIComponent(audience)}`)
      .then((r) => {
        if (!r.ok) throw new Error('notices fetch failed')
        return r.json()
      })
      .then((d) => {
        if (!cancelled) {
          const list = Array.isArray(d.notices) ? d.notices : []
          setItems(applyFilter(list, audience))
        }
      })
      .catch(() => {
        if (!cancelled && isLocalAuth) {
          const lp = loadLocalNotices()
          if (lp) setItems(applyFilter(lp, audience))
        }
      })
    return () => { cancelled = true }
  }, [audience])

  if (!items.length) return null

  return (
    <div className={'ge-notice-board' + (compact ? ' compact' : '')}>
      {items.map((n) => (
        <div key={n.id} className={'ge-notice-item ' + (n.kind === 'ad' ? 'ad' : 'notice')}>
          <span className="ge-notice-kind">{n.kind === 'ad' ? 'Ad' : 'Notice'}</span>
          <div>
            <strong>{n.title}</strong>
            {n.body ? <p>{n.body}</p> : null}
          </div>
        </div>
      ))}
    </div>
  )
}
