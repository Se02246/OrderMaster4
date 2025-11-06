import { useState, useEffect } from "react"; // <-- ASSICURATI CHE QUESTA RIGA SIA PRESENTE E COMPLETA
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
import { AlertTriangle, Eye, EyeOff, Download } from "lucide-react"; 
import { Alert, AlertDescription } from "@/components/ui/alert";

// --- VARIABILE GLOBALE PERSISTENTE PER EVENTO PWA ---
let deferredInstallPrompt: any = null;

// --- TIPO DEFINITO IN MODO PIÙ SICURO (o omesso, usiamo 'any' qui) ---
type InstallPromptEvent = any;

const loginSchema = z.object({
  email: z.string().email("Email non valida"),
  password: z.string().min(1, "La password è obbligatoria"),
});

const registerSchema = z.object({
  email: z.string().email("Email non valida"),
  password: z.string().min(6, "La password deve essere di almeno 6 caratteri"),
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
  
  // Stato PWA con tipo generico
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [isPwaInstalled, setIsPwaInstalled] = useState(false);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Al montaggio, verifica se l'evento è già stato catturato precedentemente
    if (deferredInstallPrompt) {
      setInstallPrompt(deferredInstallPrompt);
    }

    // Check if installed (PWA mode check)
    if (window.matchMedia('(display-mode: standalone)').matches || ('standalone' in window.navigator && (window.navigator as any).standalone)) {
      setIsPwaInstalled(true);
    }
    
    // Handler per catturare l'evento di installazione
    const handler = (e: Event | any) => {
      e.preventDefault();
      if (typeof e.prompt === 'function') {
        // 2. Aggiorna sia la variabile esterna persistente che lo stato locale
        deferredInstallPrompt = e; 
        setInstallPrompt(e);
      }
    };

    // Handler per nascondere il pulsante dopo l'installazione riuscita
    const handleAppInstalled = () => {
      // 3. Cancella la referenza ovunque se l'installazione ha successo
      deferredInstallPrompt = null;
      setInstallPrompt(null);
      setIsPwaInstalled(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []); // Esegue solo al montaggio/smontaggio

  const handleInstallClick = () => {
    if (installPrompt && typeof installPrompt.prompt === 'function') {
      installPrompt.prompt();
      
      installPrompt.userChoice.then((choiceResult: { outcome: 'accepted' | 'dismissed' }) => {
        if (choiceResult.outcome === 'accepted') {
          toast({ title: "Installazione Avviata", description: "L'app si sta installando sul tuo dispositivo." });
        } else {
          toast({ title: "Installazione Annullata", description: "L'installazione è stata annullata dall'utente.", variant: "destructive" });
        }
        
        // 4. Se l'utente rifiuta, l'oggetto prompt non è più utilizzabile, quindi lo resettiamo
        if (choiceResult.outcome === 'dismissed') {
             deferredInstallPrompt = null;
             setInstallPrompt(null);
        }
      });
    }
  };

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "" },
  });

  const onLoginSubmit = async (data: LoginFormValues) => {
    setIsLoginPending(true);
    try {
      const res = await apiRequest("POST", "/api/auth/login", data);
      const user = (await res.json()) as SafeUser;
      login(user); // Aggiorna il contesto di autenticazione
      toast({ title: "Accesso effettuato", description: `Bentornato, ${user.email}!` });
    } catch (error: any) {
      toast({
        title: "Errore di accesso",
        description: error.message || "Credenziali errate.",
        variant: "destructive",
      });
    }
    setIsLoginPending(false);
  };

  const onRegisterSubmit = async (data: RegisterFormValues) => {
    setIsRegisterPending(true);
    try {
      const res = await apiRequest("POST", "/api/auth/register", data);
      const user = (await res.json()) as SafeUser;
      login(user); // Aggiorna il contesto e fa il login automatico
      toast({ title: "Registrazione completata", description: `Benvenuto, ${user.email}!` });
    } catch (error: any) {
      toast({
        title: "Errore di registrazione",
        description: error.message || "Impossibile registrarsi. L'email potrebbe essere già in uso.",
        variant: "destructive",
      });
    }
    setIsRegisterPending(false);
  };

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
              {/* Pulsante Installa App (Visibile solo se disponibile) */}
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
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Attenzione: al momento non è disponibile il recupero password. Assicurati di salvare le tue credenziali!
                </AlertDescription>
              </Alert>
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="tua@email.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showLoginPassword ? "text" : "password"}
                              placeholder="••••••••"
                              className="pr-10" 
                              {...field}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:bg-transparent"
                              onClick={() => setShowLoginPassword((prev) => !prev)}
                              tabIndex={-1} 
                            >
                              {showLoginPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isLoginPending}>
                    {isLoginPending ? "Accesso in corso..." : "Accedi"}
                  </Button>
                </form>
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
              {/* Pulsante Installa App (anche qui) */}
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
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Attenzione: al momento non è disponibile il recupero password. Assicurati di salvare le tue credenziali!
                </AlertDescription>
              </Alert>
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                  <FormField
                    control={registerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="tua@email.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showRegisterPassword ? "text" : "password"}
                              placeholder="Min. 6 caratteri"
                              className="pr-10" 
                              {...field}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:bg-transparent"
                              onClick={() => setShowRegisterPassword((prev) => !prev)}
                              tabIndex={-1} 
                            >
                              {showRegisterPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isRegisterPending}>
                    {isRegisterPending ? "Registrazione..." : "Registrati"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
