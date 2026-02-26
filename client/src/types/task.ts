export type Task = {
  id: number
  title: string
  description?: string
  done: boolean
  userId: number
  createdAt: string
}

export type CreateTaskRequest = {
  title: string
  description?: string
}

export type UpdateTaskRequest = {
  title?: string
  description?: string
  done?: boolean
}
