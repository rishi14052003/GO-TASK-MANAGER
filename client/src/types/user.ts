export type User = {
  id: number
  name: string
  email: string
  createdAt: string
}

export type AuthTokens = {
  token: string
}

export type LoginRequest = {
  email: string
  password: string
}

export type RegisterRequest = {
  name: string
  email: string
  password: string
}

export type AuthResponse = {
  user: User
  token: string
}
