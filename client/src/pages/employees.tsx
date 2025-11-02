import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';
import EmployeeCard from '@/components/ui/data-display/EmployeeCard';
import { Employee } from '@/../../shared/schema';
import { useApi } from '@/lib/api'; // Importa il nuovo hook
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import EmployeeModal, {
  EmployeeFormData,
} from '@/components/ui/modals/EmployeeModal';
import ConfirmDeleteModal from '@/components/ui/modals/ConfirmDeleteModal';
import { Link } from 'react-router-dom';

const EmployeesPage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { apiRequest } = useApi(); // Usa il nuovo hook

  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null,
  );

  // Query per ottenere i dipendenti
  const { data: employees, isLoading } = useQuery<Employee[]>({
    queryKey: ['employees'],
    queryFn: () => apiRequest('GET', '/employees'),
    enabled: !!apiRequest, // Attendi che apiRequest sia pronto
  });

  // Mutazione per creare un dipendente
  const createEmployeeMutation = useMutation({
    mutationFn: (data: EmployeeFormData) =>
      apiRequest('POST', '/employees', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast({
        title: 'Successo',
        description: 'Cliente creato con successo',
      });
      setIsEmployeeModalOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Errore',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutazione per aggiornare un dipendente
  const updateEmployeeMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: EmployeeFormData }) =>
      apiRequest('PUT', `/employees/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast({
        title: 'Successo',
        description: 'Cliente aggiornato con successo',
      });
      setIsEmployeeModalOpen(false);
      setSelectedEmployee(null);
    },
    onError: (error) => {
      toast({
        title: 'Errore',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutazione per eliminare un dipendente
  const deleteEmployeeMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/employees/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast({
        title: 'Successo',
        description: 'Cliente eliminato con successo',
      });
      setIsDeleteModalOpen(false);
      setSelectedEmployee(null);
    },
    onError: (error) => {
      toast({
        title: 'Errore',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Gestori modali
  const handleOpenNewEmployeeModal = () => {
    setSelectedEmployee(null);
    setIsEmployeeModalOpen(true);
  };

  const handleOpenEditEmployeeModal = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsEmployeeModalOpen(true);
  };

  const handleOpenDeleteModal = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsDeleteModalOpen(true);
  };

  // Gestore submit form
  const handleEmployeeSubmit = (data: EmployeeFormData) => {
    if (selectedEmployee) {
      updateEmployeeMutation.mutate({ id: selectedEmployee.id, data });
    } else {
      createEmployeeMutation.mutate(data);
    }
  };

  // Gestore conferma eliminazione
  const handleDeleteConfirm = () => {
    if (selectedEmployee) {
      deleteEmployeeMutation.mutate(selectedEmployee.id);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Clienti</CardTitle>
        <Button onClick={handleOpenNewEmployeeModal}>
          <PlusCircle className="mr-2 h-4 w-4" /> Aggiungi Cliente
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-40 w-full rounded-lg" />
            <Skeleton className="h-40 w-full rounded-lg" />
            <Skeleton className="h-40 w-full rounded-lg" />
          </div>
        )}
        {!isLoading && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {employees?.map((employee) => (
              <EmployeeCard
                key={employee.id}
                employee={employee}
                onEdit={(e) => {
                  e.stopPropagation(); // Impedisci la navigazione
                  handleOpenEditEmployeeModal(employee);
                }}
                onDelete={(e) => {
                  e.stopPropagation(); // Impedisci la navigazione
                  handleOpenDeleteModal(employee);
                }}
              />
            ))}
          </div>
        )}
      </CardContent>

      <EmployeeModal
        isOpen={isEmployeeModalOpen}
        onClose={() => setIsEmployeeModalOpen(false)}
        onSubmit={handleEmployeeSubmit}
        defaultValues={selectedEmployee}
      />

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Elimina Cliente"
        description="Sei sicuro di voler eliminare questo cliente? Questa azione non può essere annullata."
      />
    </Card>
  );
};

export default EmployeesPage;
