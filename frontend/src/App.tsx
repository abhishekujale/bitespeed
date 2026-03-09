import { useState, type KeyboardEvent } from 'react'
import axios from 'axios'
import './App.css'

interface ContactResult {
  primaryContatctId: number
  emails: string[]
  phoneNumbers: string[]
  secondaryContactIds: number[]
}

export default function App() {
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ContactResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function identify() {
    if (!email.trim() && !phone.trim()) {
      setError('Please enter at least an email or phone number.')
      setResult(null)
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    const body: Record<string, string> = {}
    if (email.trim()) body.email = email.trim()
    if (phone.trim()) body.phoneNumber = phone.trim()

    try {
      const { data } = await axios.post('/identify', body)
      setResult(data.contact)
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || 'Something went wrong.')
      } else {
        setError('Could not reach the server.')
      }
    } finally {
      setLoading(false)
    }
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') identify()
  }

  return (
    <>
      <div className="header">
        <div className="logo">👁</div>
        <h1>Identity Reconciliation</h1>
        <p>Bitespeed — link customer identities across purchases</p>
      </div>

      <div className="card">
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            placeholder="lorraine@hillvalley.edu"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={onKeyDown}
          />
        </div>

        <div className="form-group">
          <label htmlFor="phone">Phone Number</label>
          <input
            id="phone"
            type="text"
            placeholder="123456"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            onKeyDown={onKeyDown}
          />
          <div className="hint">At least one of email or phone is required.</div>
        </div>

        <button className="submit-btn" onClick={identify} disabled={loading}>
          {loading && <span className="spinner" />}
          {loading ? 'Identifying...' : 'Identify Contact'}
        </button>

        {(result || error) && (
          <>
            <hr className="divider" />
            <div className="result-label">Result</div>

            {error && <div className="error-box">{error}</div>}

            {result && (
              <div className="result-grid">
                <div className="result-item">
                  <div className="key">Primary Contact ID</div>
                  <div className="value">#{result.primaryContatctId}</div>
                </div>
                <div className="result-item">
                  <div className="key">Secondary Count</div>
                  <div className="value">{result.secondaryContactIds.length}</div>
                </div>
                <div className="result-item full">
                  <div className="key">Emails</div>
                  <div className="badge-list">
                    {result.emails.length ? result.emails.map((e, i) => (
                      <span key={e} className={`badge ${i === 0 ? 'primary' : ''}`}>{e}</span>
                    )) : <span className="empty">none</span>}
                  </div>
                </div>
                <div className="result-item full">
                  <div className="key">Phone Numbers</div>
                  <div className="badge-list">
                    {result.phoneNumbers.length ? result.phoneNumbers.map((p, i) => (
                      <span key={p} className={`badge ${i === 0 ? 'primary' : ''}`}>{p}</span>
                    )) : <span className="empty">none</span>}
                  </div>
                </div>
                <div className="result-item full">
                  <div className="key">Secondary Contact IDs</div>
                  <div className="badge-list">
                    {result.secondaryContactIds.length ? result.secondaryContactIds.map(id => (
                      <span key={id} className="badge">{id}</span>
                    )) : <span className="empty">none</span>}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
