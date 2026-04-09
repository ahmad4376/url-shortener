'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { io, Socket } from 'socket.io-client'
import api from '@/lib/api'
import { getUser, logout } from '@/lib/auth'

// TypeScript type for a URL object
type Url = {
    _id: string
    longUrl: string
    slug: string
    clicks: number
    isActive: boolean
    createdAt: string
}

export default function DashboardPage() {
    const router = useRouter()
    const user = getUser()

    const [urls, setUrls] = useState<Url[]>([])
    const [longUrl, setLongUrl] = useState('')
    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(true)
    const [error, setError] = useState('')
    const [copied, setCopied] = useState<string | null>(null)
    const [useAI, setUseAI] = useState(false)

    // Redirect if not logged in
    useEffect(() => {
        if (!user) {
            router.push('/login')
        }
    }, [])

    // Fetch URLs on mount
    useEffect(() => {
        fetchUrls()
    }, [])

    // Connect to WebSocket for live click updates
    useEffect(() => {
        const socket: Socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000')

        socket.on('new-click', (data: { urlId: string; clicks: number }) => {
            setUrls((prev) =>
                prev.map((url) =>
                    url._id === data.urlId
                        ? { ...url, clicks: data.clicks }
                        : url
                )
            )
        })

        return () => {
            socket.disconnect()
        }
    }, [])

    const fetchUrls = async () => {
        try {
            const response = await api.get('/api/urls')
            setUrls(response.data.urls)
        } catch (err) {
            console.error(err)
        } finally {
            setFetching(false)
        }
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const response = await api.post('/api/urls', { longUrl, useAI })
            setUrls([response.data.urlobject, ...urls])
            setLongUrl('')
        } catch (err: any) {
            setError(err.response?.data?.error || 'Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string, slug: string) => {
        if (!confirm('Delete this link?')) return
        try {
            await api.delete(`/api/urls/${id}`)
            setUrls(urls.filter((url) => url._id !== id))
        } catch (err) {
            console.error(err)
        }
    }

    const handleToggle = async (id: string) => {
        try {
            const response = await api.patch(`/api/urls/${id}`)
            setUrls(urls.map((url) =>
                url._id === id ? response.data.url : url
            ))
        } catch (err) {
            console.error(err)
        }
    }

    const handleCopy = (slug: string) => {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
        navigator.clipboard.writeText(`${baseUrl}/${slug}`)
        setCopied(slug)
        setTimeout(() => setCopied(null), 2000)
    }

    if (fetching) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <p className="text-gray-400">Loading...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            {/* Header */}
            <header className="border-b border-gray-800 px-6 py-4 flex justify-between items-center">
                <h1 className="text-xl font-bold text-blue-400">Shortly</h1>
                <div className="flex items-center gap-4">
                    <span className="text-gray-400 text-sm">{user?.email}</span>
                    <button
                        onClick={logout}
                        className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                        Logout
                    </button>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-8">
                {/* Create URL form */}
                <div className="bg-gray-900 rounded-xl p-6 mb-8">
                    <h2 className="text-lg font-semibold mb-4">Shorten a URL</h2>
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-4">
                            {error}
                        </div>
                    )}
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="flex gap-3">
                            <input
                                type="url"
                                value={longUrl}
                                onChange={(e) => setLongUrl(e.target.value)}
                                placeholder="Paste your long URL here..."
                                className="flex-1 bg-gray-800 text-white px-4 py-2.5 rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500"
                                required
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
                            >
                                {loading ? 'Shortening...' : 'Shorten'}
                            </button>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer w-fit">
                            <input
                                type="checkbox"
                                checked={useAI}
                                onChange={(e) => setUseAI(e.target.checked)}
                                className="w-4 h-4 accent-blue-500"
                            />
                            <span className="text-gray-400 text-sm">
                                ✨ Generate smart slug with AI
                            </span>
                        </label>
                    </form>
                </div>

                {/* URLs list */}
                <div className="space-y-3">
                    {urls.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            No links yet. Create your first one above.
                        </div>
                    ) : (
                        urls.map((url) => (
                            <div
                                key={url._id}
                                className={`bg-gray-900 rounded-xl p-5 flex items-center justify-between gap-4 ${!url.isActive ? 'opacity-50' : ''}`}
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-blue-400 font-medium">
                                            {(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000')}/{url.slug}
                                        </span>
                                        {!url.isActive && (
                                            <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">
                                                Inactive
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-gray-500 text-sm truncate">
                                        {url.longUrl}
                                    </p>
                                </div>

                                <div className="flex items-center gap-3 shrink-0">
                                    <span className="text-gray-400 text-sm">
                                        {url.clicks} clicks
                                    </span>

                                    <button
                                        onClick={() => handleCopy(url.slug)}
                                        className="text-xs bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg transition-colors"
                                    >
                                        {copied === url.slug ? '✓ Copied' : 'Copy'}
                                    </button>

                                    <button
                                        onClick={() => handleToggle(url._id)}
                                        className="text-xs bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg transition-colors"
                                    >
                                        {url.isActive ? 'Deactivate' : 'Activate'}
                                    </button>

                                    <button
                                        onClick={() => handleDelete(url._id, url.slug)}
                                        className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg transition-colors"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>
        </div>
    )
}