import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { SafeUser } from "@shared/schema";
// --- MODIFICA 1: Aggiunto l'icona Download ---
import { AlertTriangle, Eye, EyeOff, Download } from "lucide-react"; 
import { Alert, AlertDescription } from "@/components/ui/alert";

// --- NUOVO TIPO PER EVENTO PWA ---
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}
// --- FINE NUOVO TIPO ---

const loginSchema = z.object({
// ... (omitted schemas)
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const { toast } = useToast();
  const [isLoginPending, setIsLoginPending] = useState(false);
  const [isRegisterPending, setIsRegisterPending] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  
  // --- MODIFICA 2: Stati PWA ---
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isPwaInstalled, setIsPwaInstalled] = useState(false);
  
  useEffect(() => {
    // Controllo basato su media query per stimare se è già PWA
    if (window.matchMedia('(display-mode: standalone)').matches || ('standalone' in window.navigator && (window.navigator as any).standalone)) {
      setIsPwaInstalled(true);
    }
    
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstallClick = () => {
    if (installPrompt) {
      installPrompt.prompt();
      installPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          toast({ title: "Installazione Avviata", description: "L'app si sta installando sul tuo dispositivo." });
          setIsPwaInstalled(true); 
        } else {
          toast({ title: "Installazione Annullata", description: "L'installazione è stata annullata dall'utente.", variant: "secondary" });
        }
        setInstallPrompt(null);
      });
    }
  };
  // --- FINE MODIFICA 2 ---

  const loginForm = useForm<LoginFormValues>({
  // ... (omitted form initialization)
  });

  const registerForm = useForm<RegisterFormValues>({
  // ... (omitted form initialization)
  });

  // ... (omitted submit handlers)

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-100 p-4">
      <Tabs defaultValue="login" className="w-full max-w-md">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Accedi</TabsTrigger>
          <TabsTrigger value="register">Registrati</TabsTrigger>
        </TabsList>
        <TabsContent value="login">
          <Card>
            <CardHeader>
              <CardTitle>Accedi al tuo account</CardTitle>
            </CardHeader>
            <CardContent>
              {/* --- MODIFICA 3: Pulsante Installa App (Visibile solo se disponibile) --- */}
              {installPrompt && !isPwaInstalled && (
                <Button 
                  onClick={handleInstallClick} 
                  variant="secondary" 
                  className="w-full mb-4 group"
                  aria-label="Installa l'applicazione sul dispositivo"
                >
                  <Download className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                  Installa App
                </Button>
              )}
              {/* --- FINE MODIFICA 3 --- */}
              <Alert variant="destructive" className="mb-4">
              {/* ... (omitted Alert) */}
              </Alert>
              <Form {...loginForm}>
              {/* ... (omitted login form) */}
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="register">
          <Card>
            <CardHeader>
              <CardTitle>Crea un nuovo account</CardTitle>
            </CardHeader>
            <CardContent>
              {/* --- MODIFICA 3: Pulsante Installa App (anche qui) --- */}
              {installPrompt && !isPwaInstalled && (
                <Button 
                  onClick={handleInstallClick} 
                  variant="secondary" 
                  className="w-full mb-4 group"
                  aria-label="Installa l'applicazione sul dispositivo"
                >
                  <Download className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                  Installa App
                </Button>
              )}
              {/* --- FINE MODIFICA 3 --- */}
              <Alert variant="destructive" className="mb-4">
              {/* ... (omitted Alert) */}
              </Alert>
              <Form {...registerForm}>
              {/* ... (omitted register form) */}
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
