import { ApartmentWithAssignedEmployees } from "@shared/schema";
import { parse, format, addHours } from "date-fns";
// NESSUNA importazione di date-fns-tz

/**
 * Formatta una data per il formato ICS (UTC: YYYYMMDDTHHmmssZ).
 * La 'Z' alla fine del formato indica a 'format' di convertire
 * la data (che è nel fuso orario locale) nel fuso orario UTC.
 */
function formatICSDate(date: Date): string {
  // 'yyyyMMdd'T'HHmmss'Z' è il formato standard UTC per ICS
  return format(date, "yyyyMMdd'T'HHmmss'");
}

/**
 * Genera il contenuto testuale di un file .ics per un dato appartamento.
 * @param apartment L'oggetto Apartment con tutti i dati.
 * @returns Una stringa con il contenuto del file .ics.
 */
export function generateICSContent(apartment: ApartmentWithAssignedEmployees): string {
  
  // 1. Costruisci la data di inizio
  const localDateTimeString = `${apartment.cleaning_date} ${apartment.start_time}`;
  
  // 2. Analizza la stringa come data/ora LOCALE
  const localDate = parse(localDateTimeString, "yyyy-MM-dd HH:mm", new Date());
  
  // 3. Calcola la data di fine (assumiamo 1 ora di durata)
  const localEndDate = addHours(localDate, 1);

  // 4. Formatta le date per il file
  const icsStartDate = formatICSDate(localDate);
  const icsEndDate = formatICSDate(localEndDate);

  // 5. Crea la descrizione
  let description = "";
  if (apartment.notes) {
    description += `Note: ${apartment.notes.replace(/\n/g, "\\n")}`;
  }
  
  if (apartment.employees.length > 0) {
    const employeeNames = apartment.employees
      .map((e) => `${e.first_name} ${e.last_name}`)
      .join(", ");
    description += `\\n\\nClienti Assegnati: ${employeeNames}`;
  }
  
  if (apartment.price) {
     description += `\\n\\nPrezzo: ${apartment.price} €`;
  }

  // 6. Crea un UID univoco
  const uid = `apartment-${apartment.id}-${Date.now()}@gestoreordini.app`;

  // 7. Assembla il file .ics (con il fix \r\n corretto)
  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//GestoreOrdini//App v1.0//IT",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${formatICSDate(new Date())}`, 
    `DTSTART:${icsStartDate}`,
    `DTEND:${icsEndDate}`,
    `SUMMARY:${apartment.name}`, 
    `DESCRIPTION:${description}`, 
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n"); // <-- Questo era il fix precedente, ed è corretto.

  return icsContent;
}

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
  
  // 7. Rimuovi il link dal documento e rilascia l'URL
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
