import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Mail, Copy, CheckCircle, XCircle } from 'lucide-react'

export const ParticipantList = ({
  participants,
  onUpdate,
  courseId,
}) => {
  const [selectedEmails, setSelectedEmails] = useState(new Set())
  const [filterConfirmed, setFilterConfirmed] = useState('all') // 'all', 'confirmed', 'unconfirmed'

  const handleToggleSelect = (email) => {
    const newSelected = new Set(selectedEmails)
    if (newSelected.has(email)) {
      newSelected.delete(email)
    } else {
      newSelected.add(email)
    }
    setSelectedEmails(newSelected)
  }

  const handleSelectAll = () => {
    const filtered = getFilteredParticipants()
    const allEmails = new Set(filtered.map((p) => p.email))
    if (selectedEmails.size === filtered.length) {
      setSelectedEmails(new Set())
    } else {
      setSelectedEmails(allEmails)
    }
  }

  const handleSendEmail = () => {
    if (selectedEmails.size === 0) return

    const emailList = Array.from(selectedEmails).join(',')
    const mailtoLink = `mailto:?bcc=${encodeURIComponent(emailList)}`
    window.location.href = mailtoLink
  }

  const handleCopyEmails = async () => {
    if (selectedEmails.size === 0) return

    const emailList = Array.from(selectedEmails).join(', ')
    try {
      await navigator.clipboard.writeText(emailList)
      alert('Email адреса скопированы в буфер обмена')
    } catch (error) {
      console.error('Error copying to clipboard:', error)
      alert('Ошибка при копировании в буфер обмена')
    }
  }

  const handleToggleConfirmation = async (userCourseId, currentStatus) => {
    try {
      const updateData = {
        confirmed: !currentStatus,
        confirmed_at: !currentStatus ? new Date().toISOString() : null,
      }

      const { error } = await supabase
        .from('user_courses')
        .update(updateData)
        .eq('id', userCourseId)

      if (error) throw error

      if (onUpdate) {
        onUpdate()
      }
    } catch (error) {
      console.error('Error updating confirmation:', error)
      alert('Ошибка при обновлении статуса подтверждения')
    }
  }

  const getFilteredParticipants = () => {
    if (filterConfirmed === 'all') return participants
    if (filterConfirmed === 'confirmed') {
      return participants.filter((p) => p.confirmed)
    }
    return participants.filter((p) => !p.confirmed)
  }

  const filteredParticipants = getFilteredParticipants()

  return (
    <div>
      <div className="mb-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">
            Фильтр по статусу:
          </label>
          <select
            value={filterConfirmed}
            onChange={(e) => setFilterConfirmed(e.target.value)}
            className="block rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="all">Все</option>
            <option value="confirmed">Подтвержденные</option>
            <option value="unconfirmed">Неподтвержденные</option>
          </select>
        </div>

        {selectedEmails.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">
              Выбрано: {selectedEmails.size}
            </span>
            <button
              onClick={handleSendEmail}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              <Mail className="w-4 h-4" />
              Отправить email
            </button>
            <button
              onClick={handleCopyEmails}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              <Copy className="w-4 h-4" />
              Копировать
            </button>
          </div>
        )}
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={
                filteredParticipants.length > 0 &&
                selectedEmails.size === filteredParticipants.length
              }
              onChange={handleSelectAll}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="ml-2 text-sm text-gray-700">
              Выбрать все ({filteredParticipants.length})
            </span>
          </label>
        </div>

        <ul className="divide-y divide-gray-200">
          {filteredParticipants.length === 0 ? (
            <li className="px-6 py-4 text-center text-gray-500">
              Нет участников
            </li>
          ) : (
            filteredParticipants.map((participant) => (
              <li
                key={participant.user_course_id}
                className="px-6 py-4 hover:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center flex-1">
                    <input
                      type="checkbox"
                      checked={selectedEmails.has(participant.email)}
                      onChange={() => handleToggleSelect(participant.email)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mr-3"
                    />
                    <div className="flex-1">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-gray-900">
                          {participant.first_name} {participant.last_name}
                        </p>
                        {participant.confirmed ? (
                          <CheckCircle className="h-4 w-4 text-green-500 ml-2" />
                        ) : (
                          <XCircle className="h-4 w-4 text-gray-400 ml-2" />
                        )}
                      </div>
                      <div className="mt-1 text-sm text-gray-500">
                        {participant.email}
                      </div>
                      {participant.mobile_number && (
                        <div className="mt-1 text-sm text-gray-500">
                          {participant.mobile_number}
                        </div>
                      )}
                      {participant.confirmed_at && (
                        <div className="mt-1 text-xs text-green-600">
                          Подтверждено:{' '}
                          {new Date(participant.confirmed_at).toLocaleString('ru-RU')}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      handleToggleConfirmation(
                        participant.user_course_id,
                        participant.confirmed
                      )
                    }
                    className={`ml-4 px-3 py-1 text-sm rounded-md ${
                      participant.confirmed
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {participant.confirmed ? 'Подтверждено' : 'Подтвердить'}
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  )
}
