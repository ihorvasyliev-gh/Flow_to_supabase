import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { ArrowLeft, BookOpen, Users, LogOut } from 'lucide-react'

export const Courses = () => {
  const { signOut } = useAuth()
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          user_courses(count)
        `)
        .order('name', { ascending: true })

      if (error) throw error

      // Get actual counts
      const coursesWithCounts = await Promise.all(
        (data || []).map(async (course) => {
          const { count } = await supabase
            .from('user_courses')
            .select('*', { count: 'exact', head: true })
            .eq('course_id', course.id)

          return {
            ...course,
            participantCount: count || 0,
          }
        })
      )

      setCourses(coursesWithCounts)
    } catch (error) {
      console.error('Error fetching courses:', error)
      alert('Ошибка при загрузке курсов')
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                to="/dashboard"
                className="flex items-center text-gray-700 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Назад
              </Link>
              <h1 className="text-xl font-bold text-gray-900">Курсы</h1>
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
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Загрузка...</p>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {courses.length === 0 ? (
                  <li className="px-6 py-4 text-center text-gray-500">
                    Нет курсов
                  </li>
                ) : (
                  courses.map((course) => (
                    <li key={course.id} className="px-6 py-4 hover:bg-gray-50">
                      <Link
                        to={`/courses/${course.id}/participants`}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center">
                          <BookOpen className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {course.name}
                            </p>
                            <div className="mt-1 flex items-center text-sm text-gray-500">
                              <Users className="h-4 w-4 mr-1" />
                              {course.participantCount} участников
                            </div>
                          </div>
                        </div>
                        <span className="text-indigo-600 hover:text-indigo-900">
                          Просмотр →
                        </span>
                      </Link>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
