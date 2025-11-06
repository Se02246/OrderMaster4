// client/src/pages/login.tsx

// --- NUOVA VARIABILE GLOBALE PER PERSISTENZA ---
let deferredInstallPrompt: any = null;

// ... (omitted imports and schemas)

export default function LoginPage() {
  // ... (omitted form initialization and other states)
  
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
      // IMPORTANTE: Non cancelliamo deferredInstallPrompt qui, 
      // altrimenti non persisterebbe al prossimo montaggio
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

  // ... (omitted rest of the component JSX)
}
