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
  return format(date, "yyyyMMdd'T'HHmmss'Z'");
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
  const localDate = parse(localDateTimeString, "yyyy-MM-dd HH:mm", new Date());
  
  // 3. Calcola la data di fine (assumiamo 1 ora di durata)
  const localEndDate = addHours(localDate, 1);

  // 4. Formatta le date per il file
  // formatICSDate convertirà automaticamente da locale a UTC.
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

  // 7. Assembla il file .ics
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
  ].join("\r\n");

  return icsContent;
}

/**
 * === SEZIONE MODIFICATA ===
 * Tenta di APRIRE l'evento .ics direttamente usando un Data URI
 * e navigando la pagina ad esso.
 * @param icsContent Il contenuto generato da generateICSContent.
 */
export function downloadICSFile(icsContent: string) {
  
  // Crea un Data URI. Questo è come un "file" incorporato in un link.
  const dataUri = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(icsContent);

  // Tenta di navigare la finestra corrente verso il Data URI.
  // Su iOS e Android, questo viene intercettato dal sistema
  // che chiede all'utente se vuole aprire l'app Calendario.
  // Su desktop, probabilmente scaricherà ancora il file,
  // ma questo è il massimo che possiamo fare senza violare la sicurezza del browser.
  try {
     window.location.href = dataUri;
  } catch (e) {
     console.error("Impossibile aprire il link del calendario", e);
  }
}
