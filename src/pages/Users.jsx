import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { UserForm } from '../components/UserForm'
import { Search, Edit, Plus, ArrowLeft, LogOut } from 'lucide-react'

export const Users = () => {
  const { signOut } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingUser, setEditingUser] = useState(null)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
      alert('Ошибка при загрузке пользователей')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (formData) => {
    try {
      if (editingUser?.id) {
        const { error } = await supabase
          .from('users')
          .update(formData)
          .eq('id', editingUser.id)

        if (error) throw error
      } else {
        const { error } = await supabase.from('users').insert([formData])
        if (error) throw error
      }

      setShowForm(false)
      setEditingUser(null)
      fetchUsers()
    } catch (error) {
      console.error('Error saving user:', error)
      alert('Ошибка при сохранении пользователя')
    }
  }

  const handleEdit = (user) => {
    setEditingUser(user)
    setShowForm(true)
  }

  const handleAdd = () => {
    setEditingUser(null)
    setShowForm(true)
  }

  const filteredUsers = users.filter(
    (user) =>
      user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.mobile_number?.includes(searchTerm)
  )

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
              <h1 className="text-xl font-bold text-gray-900">Пользователи</h1>
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
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Поиск по имени, email или телефону..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <button
              onClick={handleAdd}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              <Plus className="w-5 h-5" />
              Добавить пользователя
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Загрузка...</p>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {filteredUsers.length === 0 ? (
                  <li className="px-6 py-4 text-center text-gray-500">
                    {searchTerm ? 'Пользователи не найдены' : 'Нет пользователей'}
                  </li>
                ) : (
                  filteredUsers.map((user) => (
                    <li key={user.id} className="px-6 py-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <p className="text-sm font-medium text-gray-900">
                              {user.first_name} {user.last_name}
                            </p>
                          </div>
                          <div className="mt-2 flex items-center text-sm text-gray-500">
                            <span className="mr-4">{user.email}</span>
                            {user.mobile_number && (
                              <span>{user.mobile_number}</span>
                            )}
                          </div>
                          {(user.address || user.eircode) && (
                            <div className="mt-1 text-sm text-gray-500">
                              {user.address}
                              {user.address && user.eircode && ', '}
                              {user.eircode}
                            </div>
                          )}
                          {user.date_of_birth && (
                            <div className="mt-1 text-sm text-gray-500">
                              Дата рождения: {new Date(user.date_of_birth).toLocaleDateString('ru-RU')}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleEdit(user)}
                          className="ml-4 flex items-center gap-2 px-3 py-2 text-sm text-indigo-600 hover:text-indigo-900"
                        >
                          <Edit className="w-4 h-4" />
                          Редактировать
                        </button>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </div>
      </main>

      {showForm && (
        <UserForm
          user={editingUser}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false)
            setEditingUser(null)
          }}
        />
      )}
    </div>
  )
}
