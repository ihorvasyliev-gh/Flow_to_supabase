import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Users, BookOpen, LogOut, BarChart3 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useEffect, useState } from 'react'

export const Dashboard = () => {
  const { user, signOut } = useAuth()
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalRegistrations: 0,
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersResult, coursesResult, registrationsResult] = await Promise.all([
          supabase.from('users').select('id', { count: 'exact', head: true }),
          supabase.from('courses').select('id', { count: 'exact', head: true }),
          supabase.from('user_courses').select('id', { count: 'exact', head: true }),
        ])

        setStats({
          totalUsers: usersResult.count || 0,
          totalCourses: coursesResult.count || 0,
          totalRegistrations: registrationsResult.count || 0,
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
      }
    }

    fetchStats()
  }, [])

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">FlowTo</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-700">{user?.email}</span>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
              >
                <LogOut className="w-4 h-4" />
                Выйти
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Панель управления</h2>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Всего пользователей
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.totalUsers}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <BookOpen className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Всего курсов
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.totalCourses}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <BarChart3 className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Всего регистраций
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.totalRegistrations}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Link
              to="/users"
              className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="p-5">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-indigo-600" />
                  <div className="ml-5">
                    <h3 className="text-lg font-medium text-gray-900">
                      Управление пользователями
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Просмотр и редактирование записей пользователей
                    </p>
                  </div>
                </div>
              </div>
            </Link>

            <Link
              to="/courses"
              className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="p-5">
                <div className="flex items-center">
                  <BookOpen className="h-8 w-8 text-indigo-600" />
                  <div className="ml-5">
                    <h3 className="text-lg font-medium text-gray-900">
                      Управление курсами
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Просмотр курсов и регистраций
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
