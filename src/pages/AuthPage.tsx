import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { login, register, getMyProfile } from "@/api/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuthStore } from "@/store/auth"

export default function AuthPage() {
  const setToken = useAuthStore((s) => s.setToken)
  const navigate = useNavigate()
  const [loginError, setLoginError] = useState("")
  const [loginLoading, setLoginLoading] = useState(false)
  const [registerError, setRegisterError] = useState("")
  const [registerLoading, setRegisterLoading] = useState(false)

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setLoginError("")
    setLoginLoading(true)
    try {
      const token = await login(fd.get("email") as string, fd.get("password") as string)
      setToken(token)
      const profile = await getMyProfile()
      navigate(profile.onboarding_done ? "/" : "/onboarding", { replace: true })
    } catch {
      setLoginError("Неверный email или пароль")
    } finally {
      setLoginLoading(false)
    }
  }

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const email = fd.get("email") as string
    const password = fd.get("password") as string
    const confirm = fd.get("confirm") as string
    if (password !== confirm) {
      setRegisterError("Пароли не совпадают")
      return
    }
    setRegisterError("")
    setRegisterLoading(true)
    let registered = false
    try {
      await register(email, password)
      registered = true
      const token = await login(email, password)
      setToken(token)
      navigate("/onboarding", { replace: true })
    } catch (err: unknown) {
      if (!registered) {
        const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
        setRegisterError(typeof msg === "string" ? msg : "Ошибка регистрации")
      } else {
        setRegisterError("Аккаунт создан — войдите через форму входа")
      }
    } finally {
      setRegisterLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-gradient-to-b from-rose-50 to-background">
      <div className="mb-8 text-center">
        <div className="text-4xl mb-2">💄</div>
        <h1 className="text-2xl font-bold text-primary">Beauty Navigator</h1>
        <p className="text-sm text-muted-foreground mt-1">AI-подбор схем макияжа</p>
      </div>

      <div className="w-full max-w-sm">
        <Tabs defaultValue="login" onValueChange={() => { setLoginError(""); setRegisterError("") }}>
          <TabsList className="w-full mb-6">
            <TabsTrigger value="login" className="flex-1">Войти</TabsTrigger>
            <TabsTrigger value="register" className="flex-1">Регистрация</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="login-email">Email</Label>
                <Input id="login-email" name="email" type="email" required placeholder="you@example.com" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="login-password">Пароль</Label>
                <Input id="login-password" name="password" type="password" required placeholder="••••••••" />
              </div>
              {loginError && <p className="text-sm text-destructive">{loginError}</p>}
              <Button type="submit" className="w-full" disabled={loginLoading}>
                {loginLoading ? "Вход..." : "Войти"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="register">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="reg-email">Email</Label>
                <Input id="reg-email" name="email" type="email" required placeholder="you@example.com" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reg-password">Пароль</Label>
                <Input id="reg-password" name="password" type="password" required minLength={8} placeholder="Минимум 8 символов" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reg-confirm">Повторите пароль</Label>
                <Input id="reg-confirm" name="confirm" type="password" required placeholder="••••••••" />
              </div>
              {registerError && <p className="text-sm text-destructive">{registerError}</p>}
              <Button type="submit" className="w-full" disabled={registerLoading}>
                {registerLoading ? "Регистрация..." : "Создать аккаунт"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
