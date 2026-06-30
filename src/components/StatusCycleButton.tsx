'use client'

import { cycleStatus } from '@/actions/books'
import { statusOf } from '@/lib/theme/covers'
import type { BookStatus } from '@/generated/prisma/client'

export default function StatusCycleButton({ id, status }: { id: string; status: BookStatus }) {
  const st = statusOf(status)
  return (
    <button
      onClick={() => cycleStatus(id)}
      className="inline-flex items-center gap-2 text-xs font-bold tracking-[.6px] uppercase px-3.5 py-[7px] rounded-full transition-transform active:scale-95 hover:-translate-y-px mb-4 cursor-pointer border-0"
      style={{ background: st.soft, color: st.color }}
    >
      <span className="w-[7px] h-[7px] rounded-full" style={{ background: st.color }} />
      {st.label}
      <span className="opacity-55 text-[13px]">↻</span>
    </button>
  )
}
