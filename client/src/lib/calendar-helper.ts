import { ApartmentWithAssignedEmployees } from "@shared/schema";
import { parse, format, addHours } from "date-fns";
// === 1. PRIMA MODIFICA: Cambia questa riga ===
import * as dateFnsTz from "date-fns-tz";
// === FINE MODIFICA ===

/**
 * Formatta una data per il formato ICS (UTC: YYYYMMDDTHHmmssZ).
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
  
  // Analizza la stringa come data/ora locale
  // Usiamo una data base (es. "new Date()") per il parsing
  const localDate = parse(localDateTimeString, "yyyy-MM-dd HH:mm", new Date());

  // Ottieni il fuso orario corrente del browser (es. "Europe/Rome")
  const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  // Converti l'ora locale in UTC per il file ICS (fondamentale!)
  // === 2. SECONDA MODIFICA: Aggiungi "dateFnsTz." qui ===
  const utcStartDate = dateFnsTz.zonedTimeToUtc(localDate, localTimeZone);
  // === FINE MODIFICA ===
  
  // 2. Calcola la data di fine (assumiamo 1 ora di durata)
  const utcEndDate = addHours(utcStartDate, 1);

  // 3. Formatta le date per il file
  const icsStartDate = formatICSDate(utcStartDate);
  const icsEndDate = formatICSDate(utcEndDate);

  // 4. Crea la descrizione
  let description = "";
  if (apartment.notes) {
    // Sostituisce i newline con \n (necessario per ICS)
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

  // 5. Crea un UID univoco per l'evento
  // Usiamo l'ID dell'app e un timestamp per renderlo univoco in caso di modifiche
  const uid = `apartment-${apartment.id}-${Date.now()}@gestoreordini.app`;

  // 6. Assembla il file .ics
  // \r\n è il terminatore di riga standard per ICS
  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//GestoreOrdini//App v1.0//IT",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${formatICSDate(new Date())}`, // Data di creazione del file
    `DTSTART:${icsStartDate}`, // Inizio evento (UTC)
    `DTEND:${icsEndDate}`,     // Fine evento (UTC)
    `SUMMARY:${apartment.name}`, // Titolo
    `DESCRIPTION:${description}`, // Descrizione
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
  // Crea un "Blob" (Binary Large Object) con il contenuto
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8;" });
  
  // Crea un link temporaneo in memoria
  const link = document.createElement("a");
  
  // Crea un URL per il Blob
  link.href = URL.createObjectURL(blob);
  
  // Pulisce il nome del file (rimuove caratteri non validi)
  const fileName = `${apartmentName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
  
  link.setAttribute("download", fileName);
  
  // Aggiungi il link al documento (necessario per Firefox)
  document.body.appendChild(link);
  
  // Simula il click per avviare il download
  link.click();
  
  // Rimuovi il link dal documento
  document.body.removeChild(link);
  
  // Rilascia l'URL del Blob (libera memoria)
  URL.revokeObjectURL(link.href);
}
