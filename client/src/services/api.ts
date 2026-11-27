import type { LoginRequest, RegisterRequest, AuthResponse, User } from '../types/user'
import type { Task, CreateTaskRequest, UpdateTaskRequest } from '../types/task'

export type AdminStats = {
  totalUsers: number
  totalTasks: number
  completedTasks: number
  completionRate: number
}
export type AdminTask = Pick<
  Task,
  'id' | 'title' | 'userId' | 'priority' | 'done' | 'createdAt'
> & { userName: string }

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'

async function request<TResponse>(path: string, options: RequestInit = {}): Promise<TResponse> {
  const method = options.method ?? 'GET'
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    })
  } catch (error) {
    console.error(`[API] ${method} ${path} failed to connect`, error)
    throw error
  }

  if (import.meta.env.DEV) {
    console.log(`[API] ${method} ${path} -> ${response.status}`)
  }

  const isJson = response.headers.get('content-type')?.includes('application/json')

  if (!response.ok) {
    let errorMessage = 'Request failed'
    if (isJson) {
      const data = await response.json().catch(() => null)
      if (data && typeof data.message === 'string') {
        errorMessage = data.message
      }
    }
    throw new ApiError(response.status, errorMessage)
  }

  if (!isJson) {
    // @ts-expect-error - callers using TResponse should not request non-JSON types
    return undefined
  }

  return (await response.json()) as TResponse
}

function adminRequest<T>(token: string, path: string, method = 'GET') {
  return request<T>(`/admin${path}`, { method, headers: { Authorization: `Bearer ${token}` } })
}

export const api = {
  getAdminStats: (token: string) => adminRequest<AdminStats>(token, '/stats'),
  getAdminUsers: (token: string) => adminRequest<User[]>(token, '/users'),
  getAdminTasks: (token: string) => adminRequest<AdminTask[]>(token, '/tasks'),
  adminDeleteUser: (token: string, id: number) =>
    adminRequest<void>(token, `/users/${id}`, 'DELETE'),
  adminDeleteTask: (token: string, id: number) =>
    adminRequest<void>(token, `/tasks/${id}`, 'DELETE'),

  login(body: LoginRequest): Promise<AuthResponse> {
    return request<AuthResponse>('/login', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },

  register(body: RegisterRequest): Promise<User> {
    return request<User>('/register', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },

  getProfile(token: string): Promise<User> {
    return request<User>('/user/profile', { headers: { Authorization: `Bearer ${token}` } })
  },

  updateProfile(token: string, name: string): Promise<User> {
    return request<User>('/user/profile', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name }),
    })
  },

  changePassword(token: string, currentPassword: string, newPassword: string) {
    return request<{ message: string }>('/user/password', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ currentPassword, newPassword }),
    })
  },

  getTasks(token: string): Promise<Task[]> {
    return request<Task[]>('/tasks', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  },

  createTask(token: string, body: CreateTaskRequest): Promise<Task> {
    return request<Task>('/tasks', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    })
  },

  updateTask(token: string, id: number, body: UpdateTaskRequest): Promise<Task> {
    return request<Task>(`/tasks/${id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    })
  },

  deleteTask(token: string, id: number): Promise<void> {
    return request<void>(`/tasks/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  },
}
