import axios from "axios"
import { useAuthStore } from "@/store/auth"

export const api = axios.create({ baseURL: "/api/v1" })

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const url: string = err.config?.url ?? ""
    if (err.response?.status === 401 && !url.startsWith("/auth/")) {
      useAuthStore.getState().clearToken()
      window.location.href = "/auth"
    }
    return Promise.reject(err)
  }
)
