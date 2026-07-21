import { create } from "zustand"

type ToastType = "success" | "error" | "info"

interface ToastItem {
  id: string
  message: string
  type: ToastType
}

interface ToastStore {
  toasts: ToastItem[]
  push: (t: Omit<ToastItem, "id">) => void
  remove: (id: string) => void
}

const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  push: (t) =>
    set((s) => ({ toasts: [...s.toasts, { ...t, id: crypto.randomUUID() }] })),
  remove: (id) =>
    set((s) => ({ toasts: s.toasts.filter((item) => item.id !== id) })),
}))

export { useToastStore }

export const toast = {
  success: (message: string) =>
    useToastStore.getState().push({ message, type: "success" }),
  error: (message: string) =>
    useToastStore.getState().push({ message, type: "error" }),
  info: (message: string) =>
    useToastStore.getState().push({ message, type: "info" }),
}
