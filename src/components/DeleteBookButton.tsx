'use client'

interface Props {
  action: (_formData: FormData) => Promise<void>
}

export default function DeleteBookButton({ action }: Props) {
  return (
    <form action={action}>
      <button
        type="submit"
        className="px-5 py-2.5 border border-red-300 dark:border-red-700 text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg font-medium text-sm transition-colors"
        onClick={(e) => {
          if (!confirm('Bu kitabı silmek istediğine emin misin?')) {
            e.preventDefault()
          }
        }}
      >
        Sil
      </button>
    </form>
  )
}
