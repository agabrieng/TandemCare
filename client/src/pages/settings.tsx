import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Shield, 
  Database, 
  Download, 
  Trash2,
  LogOut,
  Eye,
  EyeOff
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Settings() {
  const [isProfileEditing, setIsProfileEditing] = useState(false);
  const [showDataDialog, setShowDataDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [notifications, setNotifications] = useState({
    emailReports: true,
    pushNotifications: false,
    weeklyDigest: true,
  });
  const [privacy, setPrivacy] = useState({
    profileVisible: false,
    shareData: false,
  });
  
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    retry: false,
  });

  const getUserInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return "U";
    const first = firstName?.charAt(0) || "";
    const last = lastName?.charAt(0) || "";
    return (first + last).toUpperCase();
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const handleExportData = () => {
    // This would trigger a data export
    toast({
      title: "Exportação iniciada",
      description: "Seus dados serão enviados por email em breve.",
    });
  };

  const handleDeleteAccount = () => {
    // This would delete the user account
    toast({
      title: "Exclusão solicitada",
      description: "Sua conta será excluída em 30 dias. Você receberá um email de confirmação.",
      variant: "destructive",
    });
    setShowDeleteDialog(false);
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Page Header */}
      <div className="bg-card border-b border-border px-4 sm:px-6 py-4">
        <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground" data-testid="title-settings">Configurações</h1>
            <p className="text-muted-foreground text-sm sm:text-base">Gerencie suas preferências e dados da conta</p>
          </div>
          <Button variant="destructive" size="sm" className="sm:size-default" onClick={handleLogout} data-testid="button-logout-settings">
            <LogOut className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Sair</span>
          </Button>
        </div>
      </div>

      <main className="p-4 sm:p-6 max-w-4xl mx-auto">
        <div className="space-y-4 sm:space-y-6">
          {/* Profile Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 w-5 h-5" />
                Perfil
              </CardTitle>
              <CardDescription>
                Gerencie suas informações pessoais
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
                <Avatar className="w-16 h-16 sm:w-20 sm:h-20">
                  <AvatarImage src={user?.profileImageUrl || ""} alt={user?.firstName || ""} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                    {getUserInitials(user?.firstName, user?.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-lg font-medium" data-testid="text-user-display-name">
                    {user?.firstName && user?.lastName 
                      ? `${user.firstName} ${user.lastName}` 
                      : user?.firstName || user?.email || "Usuário"
                    }
                  </h3>
                  <p className="text-muted-foreground" data-testid="text-user-email-display">
                    {user?.email}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Membro desde {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : 'N/A'}
                  </p>
                </div>
                <Button 
                  variant="outline"
                  onClick={() => setIsProfileEditing(!isProfileEditing)}
                  data-testid="button-edit-profile"
                >
                  {isProfileEditing ? "Cancelar" : "Editar"}
                </Button>
              </div>

              {isProfileEditing && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Nome</Label>
                    <Input
                      id="firstName"
                      defaultValue={user?.firstName || ""}
                      placeholder="Seu nome"
                      data-testid="input-edit-first-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Sobrenome</Label>
                    <Input
                      id="lastName"
                      defaultValue={user?.lastName || ""}
                      placeholder="Seu sobrenome"
                      data-testid="input-edit-last-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      defaultValue={user?.email || ""}
                      placeholder="seu@email.com"
                      disabled
                      data-testid="input-edit-email"
                    />
                    <p className="text-xs text-muted-foreground">
                      O email não pode ser alterado após o cadastro
                    </p>
                  </div>
                  <div className="flex items-end">
                    <Button className="w-full" data-testid="button-save-profile">
                      Salvar Alterações
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="mr-2 w-5 h-5" />
                Estatísticas da Conta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary" data-testid="text-stats-children">
                    {stats?.childrenCount || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Filhos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary" data-testid="text-stats-expenses">
                    {stats?.recentExpenses?.length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Despesas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary" data-testid="text-stats-receipts">
                    {stats?.receiptsCount || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Comprovantes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600" data-testid="text-stats-total">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(stats?.totalSpent || 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Gasto</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="mr-2 w-5 h-5" />
                Notificações
              </CardTitle>
              <CardDescription>
                Configure como deseja receber atualizações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Relatórios por email</div>
                  <div className="text-sm text-muted-foreground">
                    Receba relatórios mensais por email
                  </div>
                </div>
                <Switch
                  checked={notifications.emailReports}
                  onCheckedChange={(checked) => 
                    setNotifications({...notifications, emailReports: checked})
                  }
                  data-testid="switch-email-reports"
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Notificações push</div>
                  <div className="text-sm text-muted-foreground">
                    Receba notificações no navegador
                  </div>
                </div>
                <Switch
                  checked={notifications.pushNotifications}
                  onCheckedChange={(checked) => 
                    setNotifications({...notifications, pushNotifications: checked})
                  }
                  data-testid="switch-push-notifications"
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Resumo semanal</div>
                  <div className="text-sm text-muted-foreground">
                    Receba um resumo das despesas toda semana
                  </div>
                </div>
                <Switch
                  checked={notifications.weeklyDigest}
                  onCheckedChange={(checked) => 
                    setNotifications({...notifications, weeklyDigest: checked})
                  }
                  data-testid="switch-weekly-digest"
                />
              </div>
            </CardContent>
          </Card>

          {/* Privacy & Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="mr-2 w-5 h-5" />
                Privacidade e Segurança
              </CardTitle>
              <CardDescription>
                Controle seus dados e privacidade
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Perfil visível</div>
                  <div className="text-sm text-muted-foreground">
                    Permitir que outros usuários vejam seu perfil
                  </div>
                </div>
                <Switch
                  checked={privacy.profileVisible}
                  onCheckedChange={(checked) => 
                    setPrivacy({...privacy, profileVisible: checked})
                  }
                  data-testid="switch-profile-visible"
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Compartilhar dados anônimos</div>
                  <div className="text-sm text-muted-foreground">
                    Ajudar a melhorar o serviço com dados anônimos
                  </div>
                </div>
                <Switch
                  checked={privacy.shareData}
                  onCheckedChange={(checked) => 
                    setPrivacy({...privacy, shareData: checked})
                  }
                  data-testid="switch-share-data"
                />
              </div>
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="mr-2 w-5 h-5" />
                Gerenciamento de Dados
              </CardTitle>
              <CardDescription>
                Exporte ou exclua seus dados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <div className="font-medium">Exportar dados</div>
                  <div className="text-sm text-muted-foreground">
                    Baixe uma cópia de todos os seus dados
                  </div>
                </div>
                <Button variant="outline" onClick={handleExportData} data-testid="button-export-data">
                  <Download className="mr-2 w-4 h-4" />
                  Exportar
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-destructive/90 rounded-lg">
                <div>
                  <div className="font-medium text-destructive">Excluir conta</div>
                  <div className="text-sm text-muted-foreground">
                    Remover permanentemente sua conta e dados
                  </div>
                </div>
                <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                  <DialogTrigger asChild>
                    <Button variant="destructive" data-testid="button-delete-account">
                      <Trash2 className="mr-2 w-4 h-4" />
                      Excluir
                    </Button>
                  </DialogTrigger>
                  <DialogContent data-testid="dialog-delete-account">
                    <DialogHeader>
                      <DialogTitle>Excluir Conta</DialogTitle>
                      <DialogDescription>
                        Esta ação é irreversível. Todos os seus dados, incluindo despesas, 
                        comprovantes e relatórios serão permanentemente removidos.
                      </DialogDescription>
                    </DialogHeader>
                    <Alert>
                      <AlertDescription>
                        Digite "EXCLUIR" no campo abaixo para confirmar a exclusão da conta.
                      </AlertDescription>
                    </Alert>
                    <div className="space-y-4">
                      <Input 
                        placeholder="Digite EXCLUIR para confirmar"
                        data-testid="input-confirm-delete"
                      />
                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="outline" 
                          onClick={() => setShowDeleteDialog(false)}
                          data-testid="button-cancel-delete"
                        >
                          Cancelar
                        </Button>
                        <Button 
                          variant="destructive" 
                          onClick={handleDeleteAccount}
                          data-testid="button-confirm-delete"
                        >
                          Excluir Conta
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* App Version */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-sm text-muted-foreground">
                <p>FinanceKids v1.0.0</p>
                <p>Sistema de Gestão Financeira para Filhos</p>
                <p className="mt-2">
                  Desenvolvido para pais divorciados organizarem e documentarem 
                  as despesas relacionadas aos filhos.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
