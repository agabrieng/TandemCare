import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users, Calendar, Edit, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ChildForm } from "@/components/ui/child-form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format, differenceInYears } from "date-fns";
import { ptBR } from "date-fns/locale";
import { isUnauthorizedError } from "@/lib/authUtils";

interface Child {
  id: string;
  firstName: string;
  lastName?: string;
  dateOfBirth?: string;
  profileImageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export default function Children() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const { toast } = useToast();

  const { data: children = [], isLoading } = useQuery<Child[]>({
    queryKey: ["/api/children"],
    retry: false,
  });

  const createChildMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/children", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/children"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setIsAddDialogOpen(false);
      toast({
        title: "Sucesso",
        description: "Filho adicionado com sucesso!",
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
        description: "Erro ao adicionar filho. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const updateChildMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      await apiRequest("PUT", `/api/children/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/children"] });
      setEditingChild(null);
      toast({
        title: "Sucesso",
        description: "Dados do filho atualizados com sucesso!",
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
        description: "Erro ao atualizar dados. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const deleteChildMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/children/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/children"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Sucesso",
        description: "Filho removido com sucesso!",
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
        description: "Erro ao remover filho. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleCreateChild = async (data: any, uploadedPhoto?: any) => {
    try {
      let childData = { ...data };
      
      // Handle profile photo upload
      if (uploadedPhoto) {
        if (uploadedPhoto.objectPath) {
          // Photo was already processed during upload
          childData.profileImageUrl = uploadedPhoto.objectPath;
        } else {
          // Fallback: process photo if not already done
          const photoResponse = await apiRequest('POST', '/api/profile-photos', {
            photoURL: uploadedPhoto.uploadURL,
            fileName: uploadedPhoto.fileName,
            fileType: uploadedPhoto.fileType,
          });
          const photoData = await photoResponse.json();
          childData.profileImageUrl = photoData.objectPath;
        }
      }
      
      createChildMutation.mutate(childData);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao processar foto. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateChild = async (data: any, uploadedPhoto?: any) => {
    if (!editingChild) return;
    
    try {
      let childData = { ...data };
      
      // Handle profile photo upload
      if (uploadedPhoto) {
        if (uploadedPhoto.objectPath) {
          // Photo was already processed during upload
          childData.profileImageUrl = uploadedPhoto.objectPath;
        } else {
          // Fallback: process photo if not already done
          const photoResponse = await apiRequest('POST', '/api/profile-photos', {
            photoURL: uploadedPhoto.uploadURL,
            fileName: uploadedPhoto.fileName,
            fileType: uploadedPhoto.fileType,
          });
          const photoData = await photoResponse.json();
          childData.profileImageUrl = photoData.objectPath;
        }
      }
      
      updateChildMutation.mutate({ id: editingChild.id, data: childData });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao processar foto. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteChild = (child: Child) => {
    if (window.confirm(`Tem certeza que deseja remover ${child.firstName}? Esta ação não pode ser desfeita.`)) {
      deleteChildMutation.mutate(child.id);
    }
  };

  const getChildInitials = (firstName: string, lastName?: string) => {
    const first = firstName.charAt(0) || "";
    const last = lastName?.charAt(0) || "";
    return (first + last).toUpperCase();
  };

  const getChildAvatarColor = (name: string) => {
    const colors = ['bg-blue-100', 'bg-purple-100', 'bg-green-100', 'bg-yellow-100', 'bg-pink-100'];
    const textColors = ['text-blue-800', 'text-purple-800', 'text-green-800', 'text-yellow-800', 'text-pink-800'];
    const index = name.charCodeAt(0) % colors.length;
    return `${colors[index]} ${textColors[index]}`;
  };

  const calculateAge = (dateOfBirth?: string) => {
    if (!dateOfBirth) return null;
    try {
      const birthDate = new Date(dateOfBirth);
      const age = differenceInYears(new Date(), birthDate);
      return age;
    } catch {
      return null;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      // Para datas de nascimento (formato YYYY-MM-DD), adicionar horário brasileiro para evitar problemas de fuso horário
      if (dateString.includes('-') && dateString.length === 10) {
        // Para datas de nascimento, criar data local sem conversão de fuso horário
        const [year, month, day] = dateString.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        return format(date, 'dd/MM/yyyy', { locale: ptBR });
      } else {
        // Para timestamps completos, usar normalmente
        const date = new Date(dateString);
        return format(date, 'dd/MM/yyyy', { locale: ptBR });
      }
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="animate-pulse space-y-4 sm:space-y-6">
          <div className="h-8 bg-muted rounded w-48"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-48 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Page Header */}
      <div className="bg-card border-b border-border px-4 sm:px-6 py-4">
        <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground" data-testid="title-children">Filhos</h1>
            <p className="text-muted-foreground text-sm sm:text-base">Gerencie os dados dos seus filhos</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="sm:size-default" data-testid="button-add-child">
                <Plus className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Adicionar Filho</span>
                <span className="sm:hidden">Adicionar</span>
              </Button>
            </DialogTrigger>
            <DialogContent data-testid="dialog-add-child">
              <DialogHeader>
                <DialogTitle>Adicionar Novo Filho</DialogTitle>
                <DialogDescription>
                  Preencha os dados do seu filho para começar a registrar as despesas.
                </DialogDescription>
              </DialogHeader>
              <ChildForm
                onSubmit={handleCreateChild}
                isLoading={createChildMutation.isPending}
                onCancel={() => setIsAddDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <main className="p-4 sm:p-6">
        {children && children.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {children.map((child: Child) => {
              const age = calculateAge(child.dateOfBirth);
              
              return (
                <Card key={child.id} className="hover-elevate" data-testid={`card-child-${child.id}`}>
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-12 h-12">
                          <AvatarImage
                            src={child.profileImageUrl ? `/api/object-storage/image?path=${child.profileImageUrl}&t=${new Date(child.updatedAt).getTime()}` : undefined}
                            alt={`Foto de ${child.firstName}`}
                          />
                          <AvatarFallback className={getChildAvatarColor(child.firstName)}>
                            {getChildInitials(child.firstName, child.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg" data-testid={`text-child-name-${child.id}`}>
                            {child.firstName} {child.lastName || ""}
                          </CardTitle>
                          {age !== null && (
                            <CardDescription data-testid={`text-child-age-${child.id}`}>
                              {age} anos
                            </CardDescription>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <Dialog open={editingChild?.id === child.id} onOpenChange={(open) => {
                          if (!open) setEditingChild(null);
                        }}>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingChild(child)}
                              data-testid={`button-edit-child-${child.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent data-testid={`dialog-edit-child-${child.id}`}>
                            <DialogHeader>
                              <DialogTitle>Editar Dados do Filho</DialogTitle>
                              <DialogDescription>
                                Atualize os dados de {child.firstName}.
                              </DialogDescription>
                            </DialogHeader>
                            <ChildForm
                              initialData={child}
                              onSubmit={handleUpdateChild}
                              isLoading={updateChildMutation.isPending}
                              onCancel={() => setEditingChild(null)}
                            />
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteChild(child)}
                          data-testid={`button-delete-child-${child.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {child.dateOfBirth && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span data-testid={`text-child-birthdate-${child.id}`}>
                            {formatDate(child.dateOfBirth)}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Users className="w-4 h-4 mr-2" />
                        <span>Cadastrado em {formatDate(child.createdAt)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2" data-testid="text-no-children">
              Nenhum filho cadastrado
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Adicione os dados dos seus filhos para começar a registrar e organizar as despesas relacionadas a eles.
            </p>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-first-child">
                  <Plus className="mr-2 w-4 h-4" />
                  Adicionar Primeiro Filho
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Novo Filho</DialogTitle>
                  <DialogDescription>
                    Preencha os dados do seu filho para começar a registrar as despesas.
                  </DialogDescription>
                </DialogHeader>
                <ChildForm
                  onSubmit={handleCreateChild}
                  isLoading={createChildMutation.isPending}
                  onCancel={() => setIsAddDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        )}
      </main>
    </div>
  );
}
