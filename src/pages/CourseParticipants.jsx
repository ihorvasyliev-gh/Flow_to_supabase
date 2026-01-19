import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { ParticipantList } from '../components/ParticipantList'
import { ArrowLeft, BookOpen, LogOut } from 'lucide-react'

export const CourseParticipants = () => {
  const { courseId } = useParams()
  const { signOut } = useAuth()
  const [course, setCourse] = useState(null)
  const [participants, setParticipants] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (courseId) {
      fetchCourse()
      fetchParticipants()
    }
  }, [courseId])

  const fetchCourse = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single()

      if (error) throw error
      setCourse(data)
    } catch (error) {
      console.error('Error fetching course:', error)
      alert('Ошибка при загрузке курса')
    }
  }

  const fetchParticipants = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('user_courses')
        .select(
          `
          id,
          confirmed,
          confirmed_at,
          created_at,
          users (
            id,
            first_name,
            last_name,
            email,
            mobile_number
          )
        `
        )
        .eq('course_id', courseId)
        .order('created_at', { ascending: false })

      if (error) throw error

      const formattedParticipants = (data || []).map((uc) => ({
        user_course_id: uc.id,
        confirmed: uc.confirmed,
        confirmed_at: uc.confirmed_at,
        first_name: uc.users.first_name,
        last_name: uc.users.last_name,
        email: uc.users.email,
        mobile_number: uc.users.mobile_number,
      }))

      setParticipants(formattedParticipants)
    } catch (error) {
      console.error('Error fetching participants:', error)
      alert('Ошибка при загрузке участников')
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
  }

  if (loading && !course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                to="/courses"
                className="flex items-center text-gray-700 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Назад к курсам
              </Link>
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-gray-400" />
                <h1 className="text-xl font-bold text-gray-900">
                  {course?.name || 'Курс'}
                </h1>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
            >
              <LogOut className="w-4 h-4" />
              Выйти
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Участники курса
            </h2>
            <p className="text-gray-600">
              Всего участников: {participants.length}
            </p>
            <p className="text-gray-600">
              Подтверждено:{' '}
              {participants.filter((p) => p.confirmed).length}
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Загрузка участников...</p>
            </div>
          ) : (
            <ParticipantList
              participants={participants}
              onUpdate={fetchParticipants}
              courseId={courseId}
            />
          )}
        </div>
      </main>
    </div>
  )
}
