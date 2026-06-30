'use client'

import { useState } from 'react'

const PRESET_TAGS = [
  'Fiction',
  'Non-fiction',
  'Fantasy',
  'Sci-Fi',
  'Mystery',
  'Thriller',
  'Romance',
  'Horror',
  'Historical',
  'Biography',
  'Poetry',
  'Classic',
  'Gothic',
  'Self-help',
]

interface Props {
  name: string
  defaultValue?: string[]
}

export default function TagInput({ name, defaultValue = [] }: Props) {
  const [selected, setSelected] = useState<string[]>(defaultValue)
  const [draft, setDraft] = useState('')

  function toggle(tag: string) {
    setSelected((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    )
  }

  function addCustom() {
    const tag = draft.trim()
    if (!tag) return
    if (!selected.some((t) => t.toLowerCase() === tag.toLowerCase())) {
      setSelected((prev) => [...prev, tag])
    }
    setDraft('')
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addCustom()
    }
  }

  // Presets not yet selected stay as suggestion chips
  const suggestions = PRESET_TAGS.filter((t) => !selected.includes(t))

  const chipBase =
    'cursor-pointer text-[13px] font-semibold px-[13px] py-[7px] rounded-[10px] border transition-transform active:scale-95'

  return (
    <div>
      <input type="hidden" name={name} value={selected.join(', ')} />

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2.5">
          {selected.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggle(tag)}
              className={`${chipBase} bg-[color:var(--color-accent)] text-[color:var(--color-accent-fg)] border-[color:var(--color-accent)]`}
              title="Remove"
            >
              {tag} ×
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-2.5">
        {suggestions.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => toggle(tag)}
            className={`${chipBase} bg-transparent text-[color:var(--color-muted)] border-[color:var(--color-line)] hover:border-[color:var(--color-accent)]`}
          >
            {tag}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add your own tag, press Enter"
          className="flex-1 px-[15px] py-[11px] border border-[color:var(--color-line)] bg-[color:var(--color-card)] rounded-[11px] text-[15px] text-[color:var(--color-ink)] outline-none focus:border-[color:var(--color-accent)]"
        />
        <button
          type="button"
          onClick={addCustom}
          className="cursor-pointer text-[13px] font-semibold px-[16px] rounded-[11px] border border-[color:var(--color-line)] text-[color:var(--color-muted)] hover:border-[color:var(--color-accent)] transition-transform active:scale-95"
        >
          Add
        </button>
      </div>
    </div>
  )
}
