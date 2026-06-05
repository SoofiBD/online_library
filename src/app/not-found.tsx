import Link from 'next/link'

export default function NotFoundPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <p className="text-5xl mb-5">🔍</p>
      <h1 className="text-xl font-bold mb-2">Page not found</h1>
      <Link href="/" className="text-amber-500 hover:underline text-sm">
        Back to home
      </Link>
    </div>
  )
}
