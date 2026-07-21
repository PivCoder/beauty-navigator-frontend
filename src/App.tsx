import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import AppLayout from "@/components/layout/AppLayout"
import ProtectedRoute from "@/components/layout/ProtectedRoute"
import { Toaster } from "@/components/ui/toaster"
import AuthPage from "@/pages/AuthPage"
import BagPage from "@/pages/BagPage"
import BagsListPage from "@/pages/BagsListPage"
import DashboardPage from "@/pages/DashboardPage"
import GeneratePage from "@/pages/GeneratePage"
import OnboardingPage from "@/pages/OnboardingPage"
import ProfilePage from "@/pages/ProfilePage"

const qc = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
})

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <Toaster />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route element={<AppLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/bags" element={<BagsListPage />} />
              <Route path="/bags/:bagId" element={<BagPage />} />
              <Route path="/generate" element={<GeneratePage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
