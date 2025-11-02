import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Order, Employee, Apartment } from '@shared/schema'; // Usa l'alias @shared
import { ModalProps } from './types';
import { useEffect } from 'react';

// Schema di validazione per il form
const orderSchema = z.object({
  employeeId: z.string().min(1, 'Devi selezionare un cliente'),
  apartmentId: z.string().min(1, 'Devi selezionare un appartamento'),
  details: z.string().optional(),
  isCompleted: z.boolean().default(false),
});

export type OrderFormData = z.infer<typeof orderSchema>;

type OrderModalProps = ModalProps<OrderFormData> & {
  defaultValues?: Order | null;
  employees: Employee[];
  apartments: Apartment[];
};

const OrderModal = ({
  isOpen,
  onClose,
  onSubmit,
  defaultValues,
  employees,
  apartments,
}: OrderModalProps) => {
  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      employeeId: '',
      apartmentId: '',
      details: '',
      isCompleted: false,
    },
  });

  // Aggiorna i valori del form quando `defaultValues` cambia (per la modifica)
  useEffect(() => {
    if (defaultValues) {
      form.reset({
        employeeId: String(defaultValues.employeeId || ''),
        apartmentId: String(defaultValues.apartmentId || ''),
        details: defaultValues.details || '',
        isCompleted: defaultValues.isCompleted || false,
      });
    } else {
      form.reset({
        employeeId: '',
        apartmentId: '',
        details: '',
        isCompleted: false,
      });
    }
  }, [defaultValues, form, isOpen]); // Resetta anche quando si apre

  // Gestore del submit del form
  const handleFormSubmit = (data: OrderFormData) => {
    // Passa i dati al genitore (calendar-day.tsx) per la mutazione
    onSubmit(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {defaultValues ? 'Modifica Ordine' : 'Aggiungi Ordine'}
          </DialogTitle>
          <DialogDescription>
            Compila i dettagli per l'intervento.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleFormSubmit)}
            className="space-y-4"
          >
            {/* Campo Cliente */}
            <FormField
              control={form.control}
              name="employeeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona un cliente" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={String(employee.id)}>
                          {employee.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Campo Appartamento */}
            <FormField
              control={form.control}
              name="apartmentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Appartamento</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona un appartamento" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {apartments.map((apartment) => (
                        <SelectItem
                          key={apartment.id}
                          value={String(apartment.id)}
                        >
                          {apartment.name} ({apartment.address})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Campo Dettagli */}
            <FormField
              control={form.control}
              name="details"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dettagli</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descrivi l'intervento..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Campo Completato */}
            <FormField
              control={form.control}
              name="isCompleted"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Completato</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Annulla
              </Button>
              <Button type="submit">
                {defaultValues ? 'Salva Modifiche' : 'Crea Ordine'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default OrderModal;
