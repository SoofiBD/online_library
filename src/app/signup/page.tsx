'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const label = 'block text-[12.5px] font-bold tracking-[.5px] text-[#6f6253] mb-[7px]'
const field =
  'w-full px-[15px] py-[13px] border border-[color:var(--color-line)] bg-[color:var(--color-card)] rounded-[11px] text-[15px] text-[color:var(--color-ink)] outline-none focus:border-[color:var(--color-accent)]'

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setPending(true)
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name || null, email, password }),
    })
    setPending(false)
    if (res.ok) {
      router.push('/')
      router.refresh()
      return
    }
    const { error: message } = await res.json().catch(() => ({ error: 'Signup failed' }))
    setError(message)
  }

  return (
    <div className="px-[clamp(14px,4vw,40px)] pt-[clamp(18px,4vw,46px)] pb-[90px]">
      <div className="max-w-[420px] mx-auto">
        <h1 className="font-serif-display font-semibold text-[clamp(28px,5vw,40px)] leading-[1.05] tracking-[-.5px] mb-[30px]">
          Sign up
        </h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-[18px]">
          <div>
            <label className={label} htmlFor="name">Name (optional)</label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              className={field}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className={label} htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              className={field}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className={label} htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              className={field}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-[13.5px] text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={pending}
            className="w-full py-[13px] rounded-[11px] bg-[color:var(--color-accent)] text-white font-semibold text-[15px] disabled:opacity-60"
          >
            {pending ? 'Creating account…' : 'Sign up'}
          </button>
        </form>
        <p className="mt-[18px] text-[13.5px] text-[color:var(--color-muted)]">
          Already have an account?{' '}
          <Link href="/login" className="text-[color:var(--color-accent)] font-semibold">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
