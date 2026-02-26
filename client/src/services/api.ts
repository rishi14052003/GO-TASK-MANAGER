import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
} from '../types/user'
import type {
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
} from '../types/task'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'

async function request<TResponse>(
  path: string,
  options: RequestInit = {},
): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  })

  const isJson =
    response.headers.get('content-type')?.includes('application/json')

  if (!response.ok) {
    let errorMessage = 'Request failed'
    if (isJson) {
      const data = await response.json().catch(() => null)
      if (data && typeof data.message === 'string') {
        errorMessage = data.message
      }
    }
    throw new Error(errorMessage)
  }

  if (!isJson) {
    return undefined
  }

  return (await response.json()) as TResponse
}

export const api = {
  login(body: LoginRequest): Promise<AuthResponse> {
    return request<AuthResponse>('/login', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },

  register(body: RegisterRequest): Promise<AuthResponse> {
    return request<AuthResponse>('/register', {
      method: 'POST',
      body: JSON.stringify(body),
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

  updateTask(
    token: string,
    id: number,
    body: UpdateTaskRequest,
  ): Promise<Task> {
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

