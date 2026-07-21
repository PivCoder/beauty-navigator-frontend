import { api } from "./client"
import type { UserProfileRead, UserRead } from "@/types"

export async function login(email: string, password: string): Promise<string> {
  const form = new URLSearchParams({ username: email, password })
  const { data } = await api.post<{ access_token: string }>("/auth/token", form, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  })
  return data.access_token
}

export async function register(email: string, password: string): Promise<void> {
  await api.post("/auth/register", { email, password })
}

export async function getMe(): Promise<UserRead> {
  const { data } = await api.get<UserRead>("/users/me")
  return data
}

export async function getMyProfile(): Promise<UserProfileRead> {
  const { data } = await api.get<UserProfileRead>("/users/me/profile")
  return data
}

export async function updateProfile(patch: Partial<UserProfileRead>): Promise<UserProfileRead> {
  const { data } = await api.patch<UserProfileRead>("/users/me/profile", patch)
  return data
}
