'use client'

import { useState } from 'react'

interface Props {
  action: (_formData: FormData) => Promise<void>
}

export default function DeleteBookButton({ action }: Props) {
  const [confirming, setConfirming] = useState(false)

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="cursor-pointer bg-transparent border border-[color:var(--color-line)] text-[color:var(--color-muted)] text-sm font-semibold px-[22px] py-3 rounded-[11px] transition-colors hover:border-[#c46a5a] hover:text-[#a8432f]"
      >
        Remove
      </button>
    )
  }

  return (
    <form
      action={action}
      className="flex items-center gap-2.5 flex-wrap bg-[#f7e7e1] border border-[#e8c6bb] rounded-xl px-4 py-3"
      style={{ animation: 'popIn .25s ease both' }}
    >
      <span className="text-[13.5px] text-[#8a3526] font-semibold">Remove this from your library?</span>
      <div className="flex gap-2 ml-auto">
        <button type="submit" className="cursor-pointer border-0 bg-[#a8432f] text-white text-[13px] font-semibold px-[18px] py-[9px] rounded-[9px]">
          Delete
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="cursor-pointer bg-transparent border border-[#d8b8ae] text-[#8a3526] text-[13px] font-semibold px-4 py-[9px] rounded-[9px]"
        >
          Keep
        </button>
      </div>
    </form>
  )
}
