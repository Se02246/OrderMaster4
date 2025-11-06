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
  // Combina la data (YYYY-MM-DD) e l'ora (HH:MM)
  const localDateTimeString = `${apartment.cleaning_date} ${apartment.start_time}`;
  
  // 2. Analizza la stringa come data/ora LOCALE
  // 'parse' di date-fns usa il fuso orario del browser.
  // Es: "2025-11-10 14:00" in Italia (GMT+1) diventa un oggetto data
  // che rappresenta "14:00 in GMT+1" (ovvero 13:00 UTC).
  const localDate = parse(localDateTimeString, "yyyy-MM-dd HH:mm", new Date());

  // 3. Formatta le date per il file
  // formatICSDate convertirà automaticamente da locale a UTC.
  const icsStartDate = formatICSDate(localDate);
  const icsEndDate = formatICSDate(localEndDate);

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

  // 6. Crea un UID univoco (invariato)
  const uid = `apartment-${apartment.id}-${Date.now()}@gestoreordini.app`;

  // 7. Assembla il file .ics (invariato)
  const icsContent = [
    "BEGIN:VCALENDAR",//
    "VERSION:2.0",//
    "PRODID:-//GestoreOrdini//App v1.0//IT",//
    "CALSCALE:GREGORIAN",//
    "BEGIN:VEVENT",//
    `UID:${uid}`,//
    `DTSTAMP:${formatICSDate(new Date())}`, 
    `DTSTART:${icsStartDate}`, // Es: 20251110T130000    // Es: 20251110T140000Z
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

  return icsContent;
}

/**
 * Avvia il download di un file .ics.
 * @param apartmentName Il nome dell'evento, usato per il nome del file.
 * @param icsContent Il contenuto generato da generateICSContent.
 */
export function downloadICSFile(apartmentName: string, icsContent: string) {
  // Cambiato MIME type per maggiore compatibilità
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8;" }); 
  
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  
  const fileName = `${apartmentName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
  
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}
