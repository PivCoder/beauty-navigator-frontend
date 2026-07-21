import { useEffect } from "react"
import { createPortal } from "react-dom"
import { useToastStore } from "@/lib/toast"

const TYPE_CLASSES: Record<string, string> = {
  success: "bg-green-600",
  error: "bg-destructive",
  info: "bg-primary",
}

function ToastItem({
  id,
  message,
  type,
}: {
  id: string
  message: string
  type: string
}) {
  const remove = useToastStore((s) => s.remove)

  useEffect(() => {
    const timer = setTimeout(() => remove(id), 3500)
    return () => clearTimeout(timer)
  }, [id, remove])

  return (
    <div
      className={`${TYPE_CLASSES[type] ?? "bg-primary"} text-white px-4 py-3 rounded-xl shadow-lg text-sm max-w-sm w-full animate-in fade-in slide-in-from-bottom-2 duration-200`}
      onClick={() => remove(id)}
    >
      {message}
    </div>
  )
}

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts)

  return createPortal(
    <div className="fixed bottom-20 inset-x-0 flex flex-col items-center gap-2 z-50 pointer-events-none px-4 max-w-lg mx-auto">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto w-full">
          <ToastItem {...t} />
        </div>
      ))}
    </div>,
    document.body,
  )
}
