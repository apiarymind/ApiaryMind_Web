import { getUserTasks } from '@/app/actions/get-tasks'
import TasksCalendarClient from './TasksCalendarClient'

export default async function CalendarPage() {
  const { data: tasks, error } = await getUserTasks()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-amber-700 dark:text-amber-50">Kalendarz Zadań</h1>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-500/20 border border-red-300 dark:border-red-500/50 rounded-lg p-4 text-red-800 dark:text-red-200 shadow-md dark:shadow-none">
          Błąd podczas ładowania zadań: {error}
        </div>
      )}

      <TasksCalendarClient initialTasks={tasks || []} />
    </div>
  )
}
