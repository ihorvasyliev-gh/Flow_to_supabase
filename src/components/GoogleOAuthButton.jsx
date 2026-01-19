import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { LogIn } from 'lucide-react'

export const GoogleOAuthButton = () => {
  const { signInWithGoogle } = useAuth()
  const [loading, setLoading] = useState(false)

  const handleGoogleSignIn = async () => {
    setLoading(true)
    try {
      await signInWithGoogle()
    } catch (error) {
      console.error('Error signing in with Google:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleGoogleSignIn}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <LogIn className="w-5 h-5" />
      {loading ? 'Вход...' : 'Войти через Google'}
    </button>
  )
}
