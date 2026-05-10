import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import LoginPage from "@/pages/Login"
import DashboardPage from "@/pages/Dashboard"
import InventoryPage from "@/pages/Inventory"
import FinancePage from "@/pages/Finance"
import PersonnelPage from "@/pages/Personnel"
import ContractsPage from "@/pages/documents/Contracts"
import InvoicesPage from "@/pages/documents/Invoices"
import ReportsPage from "@/pages/documents/Reports"
import PermissionsPage from "@/pages/documents/Permissions"
import OthersPage from "@/pages/documents/Others"
import { AuthProvider, useAuth } from "@/contexts/AuthContext"

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-foreground uppercase font-black tracking-widest animate-pulse">
        Cargando FishFlow...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-foreground uppercase font-black tracking-widest animate-pulse">
        Cargando FishFlow...
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardPage />
        </ProtectedRoute>
      } />
      
      <Route path="/inventory" element={
        <ProtectedRoute>
          <InventoryPage />
        </ProtectedRoute>
      } />
      
      <Route path="/finance" element={
        <ProtectedRoute>
          <FinancePage />
        </ProtectedRoute>
      } />

      <Route path="/personnel" element={
        <ProtectedRoute>
          <PersonnelPage />
        </ProtectedRoute>
      } />

      {/* Document Management Routes */}
      <Route path="/documents/contracts" element={<ProtectedRoute><ContractsPage /></ProtectedRoute>} />
      <Route path="/documents/invoices" element={<ProtectedRoute><InvoicesPage /></ProtectedRoute>} />
      <Route path="/documents/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
      <Route path="/documents/permissions" element={<ProtectedRoute><PermissionsPage /></ProtectedRoute>} />
      <Route path="/documents/others" element={<ProtectedRoute><OthersPage /></ProtectedRoute>} />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
