import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { authAPI, setOrganizationId } from '../services/api'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            const response = await authAPI.login({ email, password })

            // Store organization ID if available
            if (response.data.user.organizationId) {
                setOrganizationId(response.data.user.organizationId)
            } else if (response.data.user.organization_id) {
                setOrganizationId(response.data.user.organization_id)
            }

            toast.success('Successfully logged in')
            navigate('/')
        } catch (error) {
            console.error('Login error:', error)
            toast.error(error.response?.data?.message || 'Failed to login')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Sign in to your account
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        ChiroClick CRM
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <input type="hidden" name="remember" value="true" />
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="email-address" className="sr-only">
                                Email address
                            </label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {loading ? 'Signing in...' : 'Sign in'}
                        </button>
                    </div>

                    {/* Dev Mode - Quick Login */}
                    {import.meta.env.DEV && (
                        <div className="mt-4 border-t pt-4">
                            <button
                                type="button"
                                onClick={async () => {
                                    setLoading(true)
                                    try {
                                        const response = await authAPI.devLogin()
                                        if (response.data.user.organizationId) {
                                            setOrganizationId(response.data.user.organizationId)
                                        } else if (response.data.user.organization_id) {
                                            setOrganizationId(response.data.user.organization_id)
                                        }
                                        toast.success('Dev Login Successful')
                                        navigate('/')
                                    } catch (error) {
                                        console.error('Dev login failed', error)
                                        toast.error('Dev Login Failed')
                                    } finally {
                                        setLoading(false)
                                    }
                                }}
                                disabled={loading}
                                className="w-full flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                ⚡ Quick Dev Login
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </div>
    )
}
