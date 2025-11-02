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

// Importa le nuove pagine di accesso
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';

// Layout per le pagine protette (con Header e Sidebar)
const ProtectedLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex min-h-screen w-full flex-col bg-muted/40">
    <Sidebar />
    <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
      <Header />
      <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
        {children}
      </main>
    </div>
  </div>
);

// Layout per le pagine pubbliche (centrate, senza navigazione)
const PublicLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex min-h-screen w-full items-center justify-center bg-muted/40">
    {children}
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rotte Pubbliche (Login e Registrazione) */}
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
                <ProtectedLayout>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/calendar" element={<CalendarPage />} />
                    <Route path="/calendar/:date" element={<CalendarDayPage />} />
                    <Route path="/employees" element={<EmployeesPage />} />
                    <Route path="/employees/:id" element={<EmployeeDetailPage />} />
                    <Route path="/statistics" element={<StatisticsPage />} />
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </ProtectedLayout>
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
