import React, { useState } from "react"; 
import { useForm } from "react-hook-form";
// ... (omitted imports)

type FormValues = z.infer<typeof apartmentWithEmployeesSchema>;

type ApartmentModalProps = ModalProps<ApartmentWithAssignedEmployees>;

export function ApartmentModal({
  mode,
  data: apartment,
  isOpen,
  onClose,
}: ApartmentModalProps) {
// ... (omitted code)
  
  // Mutazione per creare/aggiornare l'appartamento
  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      // === INIZIO CORREZIONE BUG 'id' UNDEFINED ===
      if (mode === "edit") {
        // Recuperiamo l'ID in modo sicuro.
        const id = apartment?.id; 
        if (!id) {
          // Se siamo in edit mode ma l'ID non è disponibile, interrompiamo con un errore.
          throw new Error("ID ordine non disponibile per la modifica.");
        }
        const url = `/api/apartments/${id}`;
        const method = "PUT";
        return apiRequest(method, url, values);
      }
      
      // Modalità 'create'
      const url = "/api/apartments";
      const method = "POST";
      return apiRequest(method, url, values);
      // === FINE CORREZIONE BUG 'id' UNDEFINED ===
    },
    onSuccess: () => {
// ... (omitted code)
