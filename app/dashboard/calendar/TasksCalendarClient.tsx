'use client'

import { useState, useTransition } from 'react'
import { updateTaskStatus } from '@/app/actions/get-tasks'
import { ApiaryTask } from '@/app/actions/get-tasks'
import { Calendar, Check, ShoppingCart, Syringe, Move, AlertCircle } from 'lucide-react'
import { format, parseISO, isPast, isToday } from 'date-fns'
import { pl } from 'date-fns/locale'

interface TasksCalendarClientProps {
  initialTasks: ApiaryTask[]
}

export default function TasksCalendarClient({ initialTasks }: TasksCalendarClientProps) {
  const [tasks, setTasks] = useState<ApiaryTask[]>(initialTasks)
  const [isPending, startTransition] = useTransition()

  const handleToggleTask = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'DONE' ? 'TODO' : 'DONE'
    const actionLabel = newStatus === 'DONE' ? 'anulować/oznaczyć jako wykonane' : 'przywrócić'
    const confirmed = window.confirm(
      `Czy na pewno chcesz ${actionLabel} to zadanie? Tej operacji nie można cofnąć.`
    )
    if (!confirmed) {
      return
    }

    startTransition(async () => {
      const result = await updateTaskStatus(taskId, newStatus)
      
      if (result.success) {
        setTasks(prevTasks => 
          prevTasks.map(task => 
            task.id === taskId ? { ...task, status: newStatus } : task
          )
        )
      }
    })
  }

  // Filtruj zadania - ukryj DONE
  const activeTasks = tasks.filter(task => task.status !== 'DONE')
  
  // Grupuj zadania po dacie
  const tasksByDate = activeTasks.reduce((acc, task) => {
    const dateKey = task.due_date 
      ? format(parseISO(task.due_date), 'yyyy-MM-dd')
      : 'bez-daty'
    
    if (!acc[dateKey]) {
      acc[dateKey] = []
    }
    acc[dateKey].push(task)
    return acc
  }, {} as Record<string, ApiaryTask[]>)

  // Sortuj daty
  const sortedDates = Object.keys(tasksByDate).sort((a, b) => {
    if (a === 'bez-daty') return 1
    if (b === 'bez-daty') return -1
    return a.localeCompare(b)
  })

  const getTaskType = (description: string): 'treatment' | 'purchase' | 'move' | 'other' => {
    const desc = description.toLowerCase()
    if (desc.includes('zakup') || desc.includes('kup') || desc.startsWith('zakup:')) {
      return 'purchase'
    }
    // Detect treatment reminders (including auto-scheduled medication doses)
    if (desc.includes('przypomnienie') || desc.includes('dawka') || desc.includes('leczenie') || desc.includes('kwas') || desc.includes('apiwarol') || desc.includes('biowar')) {
      return 'treatment'
    }
    if (desc.includes('przeniesienie') || desc.includes('przenieś')) {
      return 'move'
    }
    return 'other'
  }

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'treatment':
        return <Syringe className="w-4 h-4" />
      case 'purchase':
        return <ShoppingCart className="w-4 h-4" />
      case 'move':
        return <Move className="w-4 h-4" />
      default:
        return <AlertCircle className="w-4 h-4" />
    }
  }

  const getTaskColor = (type: string) => {
    switch (type) {
      case 'treatment':
        return 'border-red-300 dark:border-red-500/50 bg-white dark:bg-white/5 text-red-900 dark:text-red-200'
      case 'purchase':
        return 'border-blue-300 dark:border-blue-500/50 bg-white dark:bg-white/5 text-blue-900 dark:text-blue-200'
      case 'move':
        return 'border-green-300 dark:border-green-500/50 bg-white dark:bg-white/5 text-green-900 dark:text-green-200'
      default:
        return 'border-amber-300 dark:border-amber-500/50 bg-white dark:bg-white/5 text-amber-900 dark:text-amber-200'
    }
  }

  const getPriorityColor = (priority: string | null) => {
    switch (priority?.toUpperCase()) {
      case 'HIGH':
        return 'text-red-600 dark:text-red-400 font-bold'
      case 'MEDIUM':
        return 'text-amber-600 dark:text-yellow-400'
      case 'LOW':
        return 'text-green-600 dark:text-green-400'
      default:
        return 'text-gray-700 dark:text-white/60'
    }
  }

  const getDateStatus = (dateStr: string | null) => {
    if (!dateStr) return 'no-date'
    const date = parseISO(dateStr)
    if (isPast(date) && !isToday(date)) return 'past'
    if (isToday(date)) return 'today'
    return 'future'
  }

  if (activeTasks.length === 0) {
    return (
      <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-300 dark:border-white/10 rounded-2xl p-12 text-center shadow-lg dark:shadow-none">
        <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-white/40" />
        <p className="text-gray-800 dark:text-white/60 text-lg">Brak aktywnych zadań</p>
        <p className="text-gray-600 dark:text-white/40 text-sm mt-2">Wszystkie zadania zostały ukończone lub nie masz żadnych zaplanowanych zadań.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {sortedDates.map(dateKey => {
        const dateTasks = tasksByDate[dateKey]
        const dateStatus = getDateStatus(dateKey !== 'bez-daty' ? dateKey : null)
        
        return (
          <div
            key={dateKey}
            className={`bg-white dark:bg-white/5 backdrop-blur-xl border rounded-2xl overflow-hidden ${
              dateStatus === 'past' 
                ? 'border-red-300 dark:border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.2)] dark:shadow-[0_0_20px_rgba(239,68,68,0.2)]' 
                : dateStatus === 'today'
                ? 'border-amber-400 dark:border-primary/50 shadow-lg dark:shadow-lg shadow-amber-500/20 dark:shadow-primary/20'
                : 'border-green-300 dark:border-white/10 shadow-[0_0_20px_rgba(34,197,94,0.2)] dark:shadow-[0_0_20px_rgba(34,197,94,0.2)]'
            }`}
          >
            <div className={`px-6 py-4 border-b ${
              dateStatus === 'past' 
                ? 'bg-white dark:bg-white/5 border-red-200 dark:border-red-500/20' 
                : dateStatus === 'today'
                ? 'bg-white dark:bg-white/5 border-amber-200 dark:border-primary/30'
                : 'bg-white dark:bg-white/5 border-green-200 dark:border-white/10'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar className={`w-5 h-5 ${
                    dateStatus === 'past' 
                      ? 'text-red-600 dark:text-red-400' 
                      : dateStatus === 'today'
                      ? 'text-amber-600 dark:text-primary'
                      : 'text-gray-700 dark:text-white/60'
                  }`} />
                  <h2 className="text-xl font-bold text-gray-900 dark:text-amber-50">
                    {dateKey === 'bez-daty' 
                      ? 'Bez terminu' 
                      : format(parseISO(dateKey), 'EEEE, d MMMM yyyy', { locale: pl })
                    }
                  </h2>
                  {dateStatus === 'today' && (
                    <span className="px-3 py-1 bg-amber-500/30 dark:bg-primary/30 text-amber-800 dark:text-primary font-semibold rounded-full text-xs">
                      DZISIAJ
                    </span>
                  )}
                  {dateStatus === 'past' && (
                    <span className="px-3 py-1 bg-red-500/30 dark:bg-red-500/30 text-red-800 dark:text-red-300 font-semibold rounded-full text-xs">
                      PRZETERMINOWANE
                    </span>
                  )}
                </div>
                <span className="text-gray-600 dark:text-white/40 text-sm">
                  {dateTasks.length} {dateTasks.length === 1 ? 'zadanie' : 'zadań'}
                </span>
              </div>
            </div>

            <div className="p-6 space-y-3">
              {dateTasks.map(task => {
                const taskType = getTaskType(task.task_description)
                const taskColor = getTaskColor(taskType)
                
                // Zmień obramowanie i poświatę w zależności od statusu daty
                let borderClass = ''
                const glowClass = dateStatus === 'past' 
                  ? 'shadow-[0_0_20px_rgba(239,68,68,0.2)] dark:shadow-[0_0_20px_rgba(239,68,68,0.2)]'
                  : dateStatus === 'future'
                  ? 'shadow-[0_0_20px_rgba(34,197,94,0.2)] dark:shadow-[0_0_20px_rgba(34,197,94,0.2)]'
                  : ''
                
                if (dateStatus === 'past') {
                  // Przeterminowane - czerwone obramowanie
                  borderClass = '!border-red-300 dark:!border-red-500/50'
                } else if (dateStatus === 'future') {
                  // Przyszłe - zielone obramowanie
                  borderClass = '!border-green-300 dark:!border-green-500/50'
                }
                // Dla 'today' i 'no-date' zostaje domyślne obramowanie z taskColor
                
                return (
                  <div
                    key={task.id}
                    className={`border rounded-xl p-4 transition-all duration-200 hover:shadow-lg ${taskColor} ${borderClass} ${glowClass}`}
                  >
                    <div className="flex items-start gap-4">
                      <button
                        onClick={() => handleToggleTask(task.id, task.status || 'TODO')}
                        disabled={isPending}
                        className={`mt-1 flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                          task.status === 'DONE'
                            ? 'bg-amber-500 dark:bg-primary border-amber-500 dark:border-primary'
                            : 'border-gray-300 dark:border-white/30 hover:border-amber-500 dark:hover:border-primary'
                        }`}
                      >
                        {task.status === 'DONE' && (
                          <Check className="w-4 h-4 text-brown-900" />
                        )}
                      </button>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {getTaskIcon(taskType)}
                              <p className={`font-semibold ${
                                task.status === 'DONE' ? 'line-through text-gray-400 dark:text-white/40' : 'text-gray-900 dark:text-white'
                              }`}>
                                {task.task_description}
                              </p>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-gray-700 dark:text-white/60">
                              {task.priority && (
                                <span className={getPriorityColor(task.priority)}>
                                  Priorytet: {task.priority}
                                </span>
                              )}
                              <span className="text-gray-600 dark:text-white/40">
                                Utworzono: {format(parseISO(task.created_at), 'd MMM yyyy', { locale: pl })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
