export type Priority = 'low' | 'medium' | 'high'

export type Task = {
  id: number
  title: string
  description?: string
  done: boolean
  priority: Priority
  dueDate?: string | null
  userId: number
  createdAt: string
}

export type CreateTaskRequest = {
  title: string
  description?: string
  priority?: Priority
  dueDate?: string
}

export type UpdateTaskRequest = {
  title?: string
  description?: string
  done?: boolean
  priority?: Priority
  dueDate?: string | null
}
