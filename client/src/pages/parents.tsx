import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users, Calendar, Edit, Trash2, Phone, Mail, MapPin } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ParentForm } from "@/components/ui/parent-form.tsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProgressIndicator } from "@/components/ui/progress-indicator";
import { useLoadingProgress } from "@/hooks/use-progress";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { isUnauthorizedError } from "@/lib/authUtils";
import { type InsertParent } from "@shared/schema";

interface Parent {
  id: string;
  userId: string;
  fullName: string;
  cpf?: string;
  rg?: string;
  dateOfBirth?: string;
  profession?: string;
  maritalStatus?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export default function Parents() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingParent, setEditingParent] = useState<Parent | null>(null);
  const { toast } = useToast();
  const { progressState, simulateProgress } = useLoadingProgress();

  const { data: parents = [], isLoading } = useQuery<Parent[]>({
    queryKey: ["/api/parents"],
    retry: false,
  });

  // Simular progresso quando carregando dados
  useEffect(() => {
    if (isLoading) {
      simulateProgress(1200, "Carregando informações dos pais...");
    }
  }, [isLoading, simulateProgress]);

  const createParentMutation = useMutation({
    mutationFn: async (data: InsertParent) => {
      await apiRequest("POST", "/api/parents", data);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/parents"] });
      await queryClient.refetchQueries({ queryKey: ["/api/parents"] });
      setIsAddDialogOpen(false);
      toast({
        title: "Sucesso",
        description: "Pai/Mãe adicionado com sucesso!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Não autorizado",
          description: "Você foi desconectado. Redirecionando...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Erro",
        description: "Erro ao adicionar pai/mãe. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const updateParentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertParent> }) => {
      await apiRequest("PUT", `/api/parents/${id}`, data);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/parents"] });
      await queryClient.refetchQueries({ queryKey: ["/api/parents"] });
      setEditingParent(null);
      toast({
        title: "Sucesso",
        description: "Informações do pai/mãe atualizadas com sucesso!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Não autorizado",
          description: "Você foi desconectado. Redirecionando...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Erro",
        description: "Erro ao atualizar informações. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const deleteParentMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/parents/${id}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/parents"] });
      await queryClient.refetchQueries({ queryKey: ["/api/parents"] });
      toast({
        title: "Sucesso",
        description: "Pai/Mãe removido com sucesso!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Não autorizado",
          description: "Você foi desconectado. Redirecionando...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Erro",
        description: "Erro ao remover pai/mãe. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (parent: Parent) => {
    setEditingParent(parent);
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja remover este pai/mãe? Esta ação não pode ser desfeita.")) {
      deleteParentMutation.mutate(id);
    }
  };

  const formatBirthDate = (dateString?: string) => {
    if (!dateString) return null;
    try {
      return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch (error) {
      return null;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ProgressIndicator 
          progress={progressState.progress} 
          message={progressState.message} 
          showPercentage={true}
          className="max-w-md"
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" data-testid="text-parents-title">Pais</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Gerencie as informações dos pais das crianças
            </p>
          </div>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto" data-testid="button-add-parent">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Pai/Mãe
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Pai/Mãe</DialogTitle>
              <DialogDescription>
                Preencha as informações cadastrais do pai ou da mãe da criança.
              </DialogDescription>
            </DialogHeader>
            <ParentForm
              onSubmit={(data: InsertParent) => createParentMutation.mutate(data)}
              onCancel={() => setIsAddDialogOpen(false)}
              isLoading={createParentMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {parents.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              Nenhum pai/mãe cadastrado
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Adicione informações dos pais das crianças para usar nos relatórios.
            </p>
            <Button 
              data-testid="button-add-first-parent"
              onClick={() => setIsAddDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Primeiro Pai/Mãe
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {parents.map((parent) => (
            <Card key={parent.id} className="hover-elevate" data-testid={`card-parent-${parent.id}`}>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center gap-3 pb-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Avatar className="h-12 w-12 flex-shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {getInitials(parent.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate" data-testid={`text-parent-name-${parent.id}`}>
                      {parent.fullName}
                    </h3>
                    {parent.profession && (
                      <p className="text-sm text-muted-foreground truncate">
                        {parent.profession}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 sm:flex-shrink-0 justify-end sm:justify-start">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleEdit(parent)}
                    data-testid={`button-edit-parent-${parent.id}`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(parent.id)}
                    data-testid={`button-delete-parent-${parent.id}`}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {parent.dateOfBirth && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{formatBirthDate(parent.dateOfBirth)}</span>
                  </div>
                )}
                
                {parent.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{parent.phone}</span>
                  </div>
                )}
                
                {parent.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{parent.email}</span>
                  </div>
                )}
                
                {parent.city && parent.state && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{parent.city}, {parent.state}</span>
                  </div>
                )}

                {parent.cpf && (
                  <div className="text-xs text-muted-foreground">
                    CPF: {parent.cpf}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog de edição */}
      <Dialog open={editingParent !== null} onOpenChange={() => setEditingParent(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Informações</DialogTitle>
            <DialogDescription>
              Atualize as informações cadastrais do pai/mãe.
            </DialogDescription>
          </DialogHeader>
          {editingParent && (
            <ParentForm
              initialData={editingParent}
              onSubmit={(data: InsertParent) => updateParentMutation.mutate({ id: editingParent.id, data })}
              onCancel={() => setEditingParent(null)}
              isLoading={updateParentMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}