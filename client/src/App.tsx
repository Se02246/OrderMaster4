// se02246/ordermaster4/OrderMaster4-impl_login/client/src/App.tsx

import { useState } from 'react'; // Importa useState per la sidebar
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

// Importa le pagine di accesso
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';

// Layout per pagine pubbliche (centrato)
// Risolve il problema della pagina di login allineata a sinistra
const PublicLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex min-h-screen w-full items-center justify-center bg-muted/40">
    {children}
  </div>
);

/**
 * Layout per pagine protette (con sidebar e header)
 * Risolve il problema della dashboard scombussolata
 */
const ProtectedAppLayout = () => {
  // Reintroduce la logica di stato per la sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Questa è la struttura di layout corretta 
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      {/* (md:ml-64) assicura che il contenuto principale 
          si sposti quando la sidebar è presente su desktop */}
      <div className="flex-1 flex flex-col md:ml-64"> 
        <Header toggleSidebar={toggleSidebar} />
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-gray-100">
          {/* Le rotte protette vengono renderizzate qui dentro */}
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
        {/* Rotte Pubbliche (Sign In / Sign Up) */}
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

        {/* Rotte Protette (l'app principale) */}
        <Route
          path="/*"
          element={
            <>
              <SignedIn>
                {/* Usa il layout protetto corretto */}
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
