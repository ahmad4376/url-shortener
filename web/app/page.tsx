import Link from 'next/link'

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-gray-950 text-white">
            {/* Navbar */}
            <nav className="border-b border-gray-800 px-6 py-4 flex justify-between items-center max-w-6xl mx-auto">
                <h1 className="text-xl font-bold text-blue-400">Shortly</h1>
                <div className="flex gap-4">
                    <Link
                        href="/login"
                        className="text-gray-400 hover:text-white transition-colors text-sm"
                    >
                        Sign in
                    </Link>
                    <Link
                        href="/register"
                        className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg transition-colors"
                    >
                        Get started
                    </Link>
                </div>
            </nav>

            {/* Hero */}
            <section className="max-w-4xl mx-auto px-6 py-24 text-center">
                <div className="inline-block bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm px-4 py-1.5 rounded-full mb-6">
                    Built with Redis, BullMQ, WebSockets & MongoDB
                </div>

                <h2 className="text-5xl font-bold mb-6 leading-tight">
                    Shorten URLs.
                    <br />
                    <span className="text-blue-400">Track them live.</span>
                </h2>

                <p className="text-gray-400 text-lg mb-10 max-w-2xl mx-auto">
                    A production-grade URL shortener built to handle millions of clicks.
                    Every redirect is cached in Redis, every click counted asynchronously —
                    and your analytics update in real time.
                </p>

                <div className="flex gap-4 justify-center">
                    <Link
                        href="/register"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
                    >
                        Start for free
                    </Link>
                    <a
                        href="https://github.com/ahmad4376/url-shortener"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="border border-gray-700 hover:border-gray-500 text-gray-300 px-8 py-3 rounded-lg font-medium transition-colors"
                    >
                        View on GitHub
                    </a>
                </div>
            </section>

            {/* How it works */}
            <section className="max-w-4xl mx-auto px-6 py-16">
                <h3 className="text-2xl font-bold text-center mb-12">How it works</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        {
                            step: '01',
                            title: 'Paste your URL',
                            description: 'Drop in any long URL — a form, a document, a product page.',
                        },
                        {
                            step: '02',
                            title: 'Get a short link',
                            description: 'We generate a unique slug and cache it in Redis for instant redirects.',
                        },
                        {
                            step: '03',
                            title: 'Track clicks live',
                            description: 'Every click updates your dashboard in real time via WebSockets.',
                        },
                    ].map((item) => (
                        <div
                            key={item.step}
                            className="bg-gray-900 rounded-xl p-6 border border-gray-800"
                        >
                            <div className="text-blue-400 font-bold text-sm mb-3">{item.step}</div>
                            <h4 className="font-semibold mb-2">{item.title}</h4>
                            <p className="text-gray-400 text-sm">{item.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Tech stack */}
            <section className="max-w-4xl mx-auto px-6 py-16">
                <h3 className="text-2xl font-bold text-center mb-12">Built for scale</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { name: 'Redis', desc: 'Sub-ms URL lookups' },
                        { name: 'BullMQ', desc: 'Async click processing' },
                        { name: 'Socket.io', desc: 'Real-time analytics' },
                        { name: 'MongoDB', desc: 'Persistent storage' },
                        { name: 'JWT + API Keys', desc: 'Dual authentication' },
                        { name: 'Rate Limiting', desc: 'Abuse protection' },
                        { name: 'Docker', desc: 'Containerized deploy' },
                        { name: 'Next.js', desc: 'Fast frontend' },
                    ].map((tech) => (
                        <div
                            key={tech.name}
                            className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center"
                        >
                            <div className="font-semibold text-sm mb-1">{tech.name}</div>
                            <div className="text-gray-500 text-xs">{tech.desc}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section className="max-w-4xl mx-auto px-6 py-16 text-center">
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12">
                    <h3 className="text-3xl font-bold mb-4">Ready to shorten?</h3>
                    <p className="text-gray-400 mb-8">
                        Free to use. No credit card required.
                    </p>
                    <Link
                        href="/register"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
                    >
                        Create your account
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-gray-800 px-6 py-6 text-center text-gray-500 text-sm">
                Built by Ahmad — {' '}
                <a
                    href="https://github.com/ahmad4376/url-shortener"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline"
                >
                    GitHub
                </a>
            </footer>
        </div>
    )
}