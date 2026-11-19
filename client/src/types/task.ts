export type Priority = 'low' | 'medium' | 'high'

export type Task = {
  id: number
  title: string
  description?: string
  done: boolean
  priority: Priority
  userId: number
  createdAt: string
}

export type CreateTaskRequest = {
  title: string
  description?: string
  priority?: Priority
}

export type UpdateTaskRequest = {
  title?: string
  description?: string
  done?: boolean
  priority?: Priority
}