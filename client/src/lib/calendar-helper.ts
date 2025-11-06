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
  const localDateTimeString = `${apartment.cleaning_date} ${apartment.start_time}`;
  
  // 2. Analizza la stringa come data/ora LOCALE
  const localDate = parse(localDateTimeString, "yyyy-MM-dd HH:mm", new Date());
  
  // 3. Calcola la data di fine (assumiamo 1 ora di durata)
  const localEndDate = addHours(localDate, 1);

  // 4. Formatta le date per il file
  const icsStartDate = formatICSDate(localDate);
  const icsEndDate = formatICSDate(localEndDate);

  // 5. Crea la descrizione (invariato)
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
  ].join("\r\n"); // <-- CORRETTO (era "\r_ \n" prima)

  return icsContent;
}

/**
 * === SEZIONE MODIFICATA ===
 * Tenta di APRIRE l'evento .ics direttamente, invece di scaricarlo.
 * @param icsContent Il contenuto generato da generateICSContent.
 */
export function downloadICSFile(icsContent: string) {
  
  // 1. Crea il file in memoria (Blob) con il MIME type corretto
  // che i telefoni riconoscono per "aprire".
  const blob = new Blob([icsContent], { type: "text/calendar" });
  
  // 2. Crea un URL per questo file in memoria
  const url = URL.createObjectURL(blob);

  // 3. Usa window.open() per dire al browser "Apri questo URL".
  // Se il browser (specialmente su mobile) riconosce "text/calendar",
  // chiederà all'app calendario di aprirlo.
  // Su PC desktop, potrebbe comunque scaricarlo se non ha un'app associata.
  window.open(url);

  // 4. Rilascia l'URL dalla memoria dopo un breve ritardo.
  // Non possiamo rilasciarlo subito, altrimenti window.open fallisce.
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000); // 1 secondo è più che sufficiente
}

// Nota: Abbiamo rimosso 'apartmentName' perché window.open()
// non usa il nome del file.
