// se02246/ordermaster4/OrderMaster4-impl_login/client/src/App.tsx
import { useState } from 'react'; 
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import {
  SignedIn,
  SignedOut,
  RedirectToSignIn,
} from '@clerk/clerk-react';
import Header from './components/ui/layout/Header';
import Sidebar from './components/ui/layout/Sidebar';
import HomePage from './pages/home';
import CalendarPage from './pages/calendar';
import EmployeesPage from './pages/employees';
import StatisticsPage from './pages/statistics';
import NotFoundPage from './pages/not-found';
import CalendarDayPage from './pages/calendar-day';
import EmployeeDetailPage from './pages/employee-detail';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';

// Layout per pagine pubbliche (centrato)
const PublicLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex min-h-screen w-full items-center justify-center bg-muted/40">
    {children}
  </div>
);

// Layout per pagine protette (con sidebar e header)
const ProtectedAppLayout = () => {
  // QUI GESTIAMO LO STATO DELLA SIDEBAR
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Passiamo lo stato alla Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      {/* 'md:ml-64' fa spazio per la sidebar fissa su desktop */}
      <div className="flex-1 flex flex-col md:ml-64"> 
        {/* Passiamo la funzione di toggle all'Header */}
        <Header toggleSidebar={toggleSidebar} />
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-gray-100">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/calendar/:date" element={<CalendarDayPage />} />
            <Route path="/employees" element={<EmployeesPage />} />
            <Route path="/employees/:id" element={<EmployeeDetailPage />} />
            <Route path="/statistics" element={<StatisticsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rotte Pubbliche */}
        <Route
          path="/sign-in"
          element={
            <PublicLayout>
              <SignedOut>
                <SignInPage />
              </SignedOut>
              <SignedIn>
                <Navigate to="/" />
              </SignedIn>
            </PublicLayout>
          }
        />
        <Route
          path="/sign-up"
          element={
            <PublicLayout>
              <SignedOut>
                <SignUpPage />
              </SignedOut>
              <SignedIn>
                <Navigate to="/" />
              </SignedIn>
            </PublicLayout>
          }
        />

        {/* Rotte Protette */}
        <Route
          path="/*"
          element={
            <>
              <SignedIn>
                <ProtectedAppLayout />
              </SignedIn>
              <SignedOut>
                <RedirectToSignIn />
              </SignedOut>
            </>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
