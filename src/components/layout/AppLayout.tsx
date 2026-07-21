import { Home, Sparkles, User, ShoppingBag } from "lucide-react"
import { NavLink, Outlet } from "react-router-dom"
import { cn } from "@/lib/utils"

const navItems = [
  { to: "/", icon: Home, label: "Главная" },
  { to: "/bags", icon: ShoppingBag, label: "Косметичка" },
  { to: "/generate", icon: Sparkles, label: "Образ" },
  { to: "/profile", icon: User, label: "Профиль" },
]

export default function AppLayout() {
  return (
    <div className="flex flex-col min-h-screen max-w-lg mx-auto bg-background">
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur-sm max-w-lg mx-auto">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg transition-colors text-xs",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={cn("h-5 w-5", isActive && "fill-current")} strokeWidth={isActive ? 2.5 : 1.5} />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
