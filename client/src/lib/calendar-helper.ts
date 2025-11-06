/**
 * Forza il download o l'apertura di un file .ics.
 * Questo metodo (tramite link 'a') è più affidabile di 'window.open()'.
 * @param icsContent Il contenuto generato da generateICSContent.
 */
export function downloadICSFile(icsContent: string) {
  
  // 1. Crea il file in memoria (Blob)
  const blob = new Blob([icsContent], { type: "text/calendar" });
  
  // 2. Crea un URL per questo file in memoria
  const url = URL.createObjectURL(blob);

  // 3. Crea un elemento link 'a' invisibile
  const link = document.createElement("a");
  link.href = url;
  
  // 4. Imposta il nome del file (importante per il download)
  link.download = "appuntamento.ics"; 

  // 5. Aggiungi il link al corpo del documento (necessario per Firefox)
  document.body.appendChild(link);
  
  // 6. Simula un clic sul link
  link.click();
  
  // 7. Rimuovi il link dal documento
  document.body.removeChild(link);
  
  // 8. Rilascia l'URL dalla memoria
  URL.revokeObjectURL(url);
}
