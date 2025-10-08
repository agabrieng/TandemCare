import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Scale, 
  Phone, 
  Mail, 
  Edit, 
  Trash2, 
  Calendar, 
  MapPin,
  Briefcase,
  Users,
  DollarSign,
  Clock,
  FileText
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LawyerForm } from "@/components/ui/lawyer-form";
import { LegalCaseForm } from "@/components/ui/legal-case-form";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { isUnauthorizedError } from "@/lib/authUtils";

interface Lawyer {
  id: string;
  fullName: string;
  oabNumber?: string;
  oabState?: string;
  lawFirm?: string;
  phone?: string;
  email?: string;
  address?: string;
  specializations?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface LegalCase {
  id: string;
  caseType: string;
  caseNumber?: string;
  courtName?: string;
  judgeName?: string;
  startDate?: string;
  expectedEndDate?: string;
  status: string;
  childrenInvolved?: string[];
  custodyType?: string;
  alimonyAmount?: string;
  visitationSchedule?: string;
  documents?: string[];
  notes?: string;
  lawyer?: Lawyer;
  createdAt: string;
  updatedAt: string;
}

interface Child {
  id: string;
  firstName: string;
  lastName?: string;
}

export default function LegalData() {
  const isMobile = useIsMobile();
  const [isAddLawyerDialogOpen, setIsAddLawyerDialogOpen] = useState(false);
  const [isAddCaseDialogOpen, setIsAddCaseDialogOpen] = useState(false);
  const [editingLawyer, setEditingLawyer] = useState<Lawyer | null>(null);
  const [editingCase, setEditingCase] = useState<LegalCase | null>(null);
  const { toast } = useToast();

  // Fetch lawyers
  const { data: lawyers = [], isLoading: loadingLawyers } = useQuery<Lawyer[]>({
    queryKey: ["/api/lawyers"],
    retry: false,
  });

  // Fetch legal cases
  const { data: legalCases = [], isLoading: loadingCases } = useQuery<LegalCase[]>({
    queryKey: ["/api/legal-cases"],
    retry: false,
  });

  // Fetch children for reference
  const { data: children = [] } = useQuery<Child[]>({
    queryKey: ["/api/children"],
    retry: false,
  });

  // Lawyer mutations
  const createLawyerMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/lawyers", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lawyers"] });
      setIsAddLawyerDialogOpen(false);
      toast({
        title: "Sucesso",
        description: "Advogado adicionado com sucesso!",
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
        description: "Erro ao adicionar advogado. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const updateLawyerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      await apiRequest("PUT", `/api/lawyers/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lawyers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/legal-cases"] });
      setEditingLawyer(null);
      toast({
        title: "Sucesso",
        description: "Dados do advogado atualizados com sucesso!",
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
        description: "Erro ao atualizar advogado. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const deleteLawyerMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/lawyers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lawyers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/legal-cases"] });
      toast({
        title: "Sucesso",
        description: "Advogado removido com sucesso!",
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
        description: "Erro ao remover advogado. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Legal case mutations
  const createCaseMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/legal-cases", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/legal-cases"] });
      setIsAddCaseDialogOpen(false);
      toast({
        title: "Sucesso",
        description: "Processo judicial adicionado com sucesso!",
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
        description: "Erro ao adicionar processo. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const updateCaseMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      await apiRequest("PUT", `/api/legal-cases/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/legal-cases"] });
      setEditingCase(null);
      toast({
        title: "Sucesso",
        description: "Processo judicial atualizado com sucesso!",
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
        description: "Erro ao atualizar processo. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const deleteCaseMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/legal-cases/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/legal-cases"] });
      toast({
        title: "Sucesso",
        description: "Processo judicial removido com sucesso!",
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
        description: "Erro ao remover processo. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Handler functions
  const handleCreateLawyer = (data: any) => {
    createLawyerMutation.mutate(data);
  };

  const handleUpdateLawyer = (data: any) => {
    if (!editingLawyer) return;
    updateLawyerMutation.mutate({ id: editingLawyer.id, data });
  };

  const handleDeleteLawyer = (lawyer: Lawyer) => {
    if (window.confirm(`Tem certeza que deseja remover ${lawyer.fullName}? Esta ação não pode ser desfeita.`)) {
      deleteLawyerMutation.mutate(lawyer.id);
    }
  };

  const handleCreateCase = (data: any) => {
    createCaseMutation.mutate(data);
  };

  const handleUpdateCase = (data: any) => {
    if (!editingCase) return;
    updateCaseMutation.mutate({ id: editingCase.id, data });
  };

  const handleDeleteCase = (legalCase: LegalCase) => {
    if (window.confirm(`Tem certeza que deseja remover este processo? Esta ação não pode ser desfeita.`)) {
      deleteCaseMutation.mutate(legalCase.id);
    }
  };

  // Helper functions
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      em_andamento: { label: "Em Andamento", variant: "default" as const },
      concluído: { label: "Concluído", variant: "secondary" as const },
      suspenso: { label: "Suspenso", variant: "destructive" as const },
      arquivado: { label: "Arquivado", variant: "outline" as const },
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, variant: "default" as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const getCaseTypeLabel = (caseType: string) => {
    const typeMap: Record<string, string> = {
      divórcio: "Divórcio",
      guarda_compartilhada: "Guarda Compartilhada",
      pensão_alimentícia: "Pensão Alimentícia",
      regulamentação_visitas: "Regulamentação de Visitas",
      investigação_paternidade: "Investigação de Paternidade",
      alteração_guarda: "Alteração de Guarda",
      união_estável: "União Estável",
      outros: "Outros",
    };
    return typeMap[caseType] || caseType;
  };

  const getChildrenNames = (childrenIds: string[]) => {
    if (!childrenIds || childrenIds.length === 0) return "Nenhum";
    
    return childrenIds.map(id => {
      const child = children.find(c => c.id === id);
      return child ? `${child.firstName} ${child.lastName || ""}`.trim() : "Desconhecido";
    }).join(", ");
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dados Jurídicos</h1>
          <p className="text-sm text-muted-foreground hidden sm:block">
            Gerencie informações de advogados e processos judiciais
          </p>
        </div>
      </div>

      <Tabs defaultValue="lawyers" className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="lawyers" className="flex items-center gap-1 sm:gap-2 text-sm sm:text-base" data-testid="tab-lawyers">
            <Scale className="w-4 h-4" />
            <span className="hidden sm:inline">Advogados</span>
            <span className="sm:hidden">Advogados</span>
          </TabsTrigger>
          <TabsTrigger value="cases" className="flex items-center gap-1 sm:gap-2 text-sm sm:text-base" data-testid="tab-cases">
            <Briefcase className="w-4 h-4" />
            <span className="hidden sm:inline">Processos Judiciais</span>
            <span className="sm:hidden">Processos</span>
          </TabsTrigger>
        </TabsList>

        {/* Lawyers Tab */}
        <TabsContent value="lawyers" className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
            <h2 className="text-lg sm:text-xl font-semibold">Advogados Cadastrados</h2>
            <Dialog open={isAddLawyerDialogOpen} onOpenChange={setIsAddLawyerDialogOpen}>
              <DialogTrigger asChild>
                <Button size={isMobile ? "sm" : "default"} data-testid="button-add-lawyer" className="flex-shrink-0">
                  <Plus className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="whitespace-nowrap">{isMobile ? "Adicionar" : "Adicionar Advogado"}</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Cadastrar Novo Advogado</DialogTitle>
                  <DialogDescription>
                    Adicione as informações do advogado responsável pelos processos
                  </DialogDescription>
                </DialogHeader>
                <LawyerForm
                  onSubmit={handleCreateLawyer}
                  onCancel={() => setIsAddLawyerDialogOpen(false)}
                  isLoading={createLawyerMutation.isPending}
                />
              </DialogContent>
            </Dialog>
          </div>

          {loadingLawyers ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-3 bg-muted rounded"></div>
                      <div className="h-3 bg-muted rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : lawyers.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Scale className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  Nenhum advogado cadastrado
                </h3>
                <p className="text-sm text-muted-foreground text-center mb-4">
                  Adicione informações dos advogados responsáveis pelos seus processos
                </p>
                <Button onClick={() => setIsAddLawyerDialogOpen(true)} data-testid="button-add-first-lawyer">
                  <Plus className="w-4 h-4 mr-2" />
                  Cadastrar Primeiro Advogado
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lawyers.map((lawyer) => (
                <Card key={lawyer.id} className="hover-elevate">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{lawyer.fullName}</CardTitle>
                        {lawyer.lawFirm && (
                          <CardDescription>{lawyer.lawFirm}</CardDescription>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingLawyer(lawyer)}
                          data-testid={`button-edit-lawyer-${lawyer.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteLawyer(lawyer)}
                          data-testid={`button-delete-lawyer-${lawyer.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {lawyer.oabNumber && (
                      <div className="flex items-center gap-2 text-sm">
                        <Scale className="w-4 h-4 text-muted-foreground" />
                        <span>OAB: {lawyer.oabNumber}/{lawyer.oabState}</span>
                      </div>
                    )}
                    
                    {lawyer.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span>{lawyer.phone}</span>
                      </div>
                    )}
                    
                    {lawyer.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span className="truncate">{lawyer.email}</span>
                      </div>
                    )}

                    {lawyer.specializations && lawyer.specializations.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {lawyer.specializations.slice(0, 2).map((spec) => (
                          <Badge key={spec} variant="outline" className="text-xs">
                            {spec}
                          </Badge>
                        ))}
                        {lawyer.specializations.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{lawyer.specializations.length - 2}
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Edit Lawyer Dialog */}
          <Dialog open={editingLawyer !== null} onOpenChange={() => setEditingLawyer(null)}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Editar Advogado</DialogTitle>
                <DialogDescription>
                  Atualize as informações do advogado
                </DialogDescription>
              </DialogHeader>
              {editingLawyer && (
                <LawyerForm
                  onSubmit={handleUpdateLawyer}
                  onCancel={() => setEditingLawyer(null)}
                  isLoading={updateLawyerMutation.isPending}
                  initialData={editingLawyer}
                />
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Legal Cases Tab */}
        <TabsContent value="cases" className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
            <h2 className="text-lg sm:text-xl font-semibold">Processos Judiciais</h2>
            <Dialog open={isAddCaseDialogOpen} onOpenChange={setIsAddCaseDialogOpen}>
              <DialogTrigger asChild>
                <Button size={isMobile ? "sm" : "default"} data-testid="button-add-case" className="flex-shrink-0">
                  <Plus className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="whitespace-nowrap">{isMobile ? "Adicionar" : "Adicionar Processo"}</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Cadastrar Novo Processo Judicial</DialogTitle>
                  <DialogDescription>
                    Adicione informações sobre o processo judicial
                  </DialogDescription>
                </DialogHeader>
                <LegalCaseForm
                  onSubmit={handleCreateCase}
                  onCancel={() => setIsAddCaseDialogOpen(false)}
                  isLoading={createCaseMutation.isPending}
                />
              </DialogContent>
            </Dialog>
          </div>

          {loadingCases ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {[...Array(2)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="h-3 bg-muted rounded"></div>
                      <div className="h-3 bg-muted rounded w-2/3"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : legalCases.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Briefcase className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  Nenhum processo judicial cadastrado
                </h3>
                <p className="text-sm text-muted-foreground text-center mb-4">
                  Adicione informações sobre divórcios, guarda compartilhada e outros processos
                </p>
                <Button onClick={() => setIsAddCaseDialogOpen(true)} data-testid="button-add-first-case">
                  <Plus className="w-4 h-4 mr-2" />
                  Cadastrar Primeiro Processo
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {legalCases.map((legalCase) => (
                <Card key={legalCase.id} className="hover-elevate">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {getCaseTypeLabel(legalCase.caseType)}
                        </CardTitle>
                        {legalCase.caseNumber && (
                          <CardDescription>Processo: {legalCase.caseNumber}</CardDescription>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(legalCase.status)}
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingCase(legalCase)}
                            data-testid={`button-edit-case-${legalCase.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteCase(legalCase)}
                            data-testid={`button-delete-case-${legalCase.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {legalCase.lawyer && (
                      <div className="flex items-center gap-2 text-sm">
                        <Scale className="w-4 h-4 text-muted-foreground" />
                        <span>{legalCase.lawyer.fullName}</span>
                      </div>
                    )}

                    {legalCase.courtName && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="truncate">{legalCase.courtName}</span>
                      </div>
                    )}

                    {legalCase.childrenInvolved && legalCase.childrenInvolved.length > 0 && (
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span className="truncate">
                          {getChildrenNames(legalCase.childrenInvolved)}
                        </span>
                      </div>
                    )}

                    {legalCase.alimonyAmount && (
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <span>Pensão: R$ {legalCase.alimonyAmount}</span>
                      </div>
                    )}

                    {legalCase.startDate && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>Início: {formatDate(legalCase.startDate)}</span>
                      </div>
                    )}

                    {legalCase.expectedEndDate && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span>Previsão: {formatDate(legalCase.expectedEndDate)}</span>
                      </div>
                    )}

                    {legalCase.documents && legalCase.documents.length > 0 && (
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span>{legalCase.documents.length} documento(s)</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Edit Legal Case Dialog */}
          <Dialog open={editingCase !== null} onOpenChange={() => setEditingCase(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Editar Processo Judicial</DialogTitle>
                <DialogDescription>
                  Atualize as informações do processo judicial
                </DialogDescription>
              </DialogHeader>
              {editingCase && (
                <LegalCaseForm
                  onSubmit={handleUpdateCase}
                  onCancel={() => setEditingCase(null)}
                  isLoading={updateCaseMutation.isPending}
                  initialData={editingCase}
                />
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
}