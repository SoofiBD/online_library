'use client'

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <p className="text-5xl mb-5">😕</p>
      <h1 className="text-xl font-bold mb-2">Something went wrong</h1>
      <p className="text-gray-400 text-sm mb-6">An unexpected error occurred.</p>
      <button
        onClick={reset}
        className="text-amber-500 hover:underline text-sm"
      >
        Try again
      </button>
    </div>
  )
}
