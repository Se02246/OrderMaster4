import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Apartment } from '@/../../shared/schema';
import { ModalProps } from './types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/lib/api'; // Importa il nuovo hook
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

// Schema di validazione per il form
const apartmentSchema = z.object({
  name: z.string().min(1, 'Il nome è obbligatorio'),
  address: z.string().min(1, 'L\'indirizzo è obbligatorio'),
});

export type ApartmentFormData = z.infer<typeof apartmentSchema>;

// Rimuovi onSubmit dalle props se non è più usato
type ApartmentModalProps = ModalProps & {
  defaultValues?: Apartment | null;
};

const ApartmentModal = ({
  isOpen,
  onClose,
  defaultValues,
}: ApartmentModalProps) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { apiRequest } = useApi(); // Usa il nuovo hook

  const form = useForm<ApartmentFormData>({
    resolver: zodResolver(apartmentSchema),
    defaultValues: {
      name: '',
      address: '',
    },
  });

  // Aggiorna i valori del form quando `defaultValues` cambia (per la modifica)
  useEffect(() => {
    if (defaultValues) {
      form.reset({
        name: defaultValues.name,
        address: defaultValues.address,
      });
    } else {
      form.reset({
        name: '',
        address: '',
      });
    }
  }, [defaultValues, form, isOpen]); // Resetta anche quando si apre

  // Mutazione per creare/aggiornare l'appartamento
  const mutation = useMutation({
    mutationFn: (data: ApartmentFormData) => {
      if (defaultValues) {
        // Modalità modifica
        return apiRequest('PUT', `/apartments/${defaultValues.id}`, data);
      } else {
        // Modalità creazione
        return apiRequest('POST', '/apartments', data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apartments'] });
      toast({
        title: 'Successo',
        description: `Appartamento ${defaultValues ? 'aggiornato' : 'creato'} con successo.`,
      });
      onClose(); // Chiudi il modale al successo
    },
    onError: (error) => {
      toast({
        title: 'Errore',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Gestore del submit del form
  const handleFormSubmit = (data: ApartmentFormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {defaultValues ? 'Modifica Appartamento' : 'Aggiungi Appartamento'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleFormSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Appartamento</FormLabel>
                  <FormControl>
                    <Input placeholder="Es. Appartamento 101" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Indirizzo</FormLabel>
                  <FormControl>
                    <Input placeholder="Es. Via Roma 1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={mutation.isPending}
              >
                Annulla
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Salvataggio...' : 'Salva'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ApartmentModal;
