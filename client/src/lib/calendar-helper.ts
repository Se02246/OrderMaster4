import { ApartmentWithAssignedEmployees } from "@shared/schema";
import { parse, format, addHours } from "date-fns";
// NESSUNA importazione di date-fns-tz

/**
 * Formatta una data per il formato ICS LOCALE (senza la 'Z' UTC).
 */
function formatICSDate(date: Date): string {
  // 'yyyyMMdd'T'HHmmss' (SENZA la 'Z' alla fine)
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

  // 3. Formatta la data per il file (sarà in formato locale)
  const icsStartDate = formatICSDate(localDate);
  const icsStamp = formatICSDate(new Date()); // Timestamp di creazione

  // 4. Crea la descrizione (invariato)
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

  // 5. Crea un UID univoco (invariato)
  const uid = `apartment-${apartment.id}-${Date.now()}@gestoreordini.app`;

  // === INIZIO MODIFICA ===
  // 6. Assembla il file .ics (con i due allarmi)
  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//GestoreOrdini//App v1.0//IT",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${icsStamp}`,
    `DTSTART:${icsStartDate}`, // Orario dell'evento (es. 07:00)
    `SUMMARY:${apartment.name}`, 
    `DESCRIPTION:${description}`,
    
    // --- Allarme 1 (30 minuti prima) ---
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${apartment.name} (fra 30 minuti)`,
    "TRIGGER;RELATED=START:-PT30M", // 30 Minuti Prima
    "END:VALARM",
    
    // --- Allarme 2 (All'ora dell'evento) ---
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${apartment.name} (Adesso)`,
    "TRIGGER;RELATED=START:PT0M", // All'orario di inizio
    "END:VALARM",
    
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  // === FINE MODIFICA ===

  return icsContent;
}

/**
 * Tenta di APRIRE l'evento .ics direttamente, invece di scaricarlo.
 * @param icsContent Il contenuto generato da generateICSContent.
 */
export function downloadICSFile(icsContent: string) {
  
  // 1. Crea il file in memoria (Blob)
  const blob = new Blob([icsContent], { type: "text/calendar" });
  
  // 2. Crea un URL per questo file in memoria
  const url = URL.createObjectURL(blob);

  // 3. Usa window.open() per dire al browser "Apri questo URL".
  window.open(url);

  // 4. Rilascia l'URL dalla memoria dopo un breve ritardo.
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}
