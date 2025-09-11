import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tags, Plus, Edit, Trash2, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Category {
  id: string;
  name: string;
  description?: string;
  color?: string;
  isDefault: boolean;
  userId: string;
}

export default function Categories() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [newCategory, setNewCategory] = useState({ name: "", description: "", color: "#3b82f6" });
  const { toast } = useToast();

  // Fetch categories
  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    retry: false,
  });

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; color?: string }) => {
      const response = await apiRequest("POST", "/api/categories", data);
      return response.json();
    },
    onSuccess: (newCategory) => {
      // Force refetch the categories
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      queryClient.refetchQueries({ queryKey: ["/api/categories"] });
      setIsAddDialogOpen(false);
      setNewCategory({ name: "", description: "", color: "#3b82f6" });
      toast({
        title: "Categoria criada",
        description: "A categoria foi criada com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar categoria",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    },
  });

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async (data: { id: string; name: string; description?: string; color?: string }) => {
      const response = await apiRequest("PUT", `/api/categories/${data.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      // Force refetch the categories
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      queryClient.refetchQueries({ queryKey: ["/api/categories"] });
      setEditingCategory(null);
      toast({
        title: "Categoria atualizada",
        description: "A categoria foi atualizada com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar categoria",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    },
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/categories/${id}`, {});
    },
    onSuccess: () => {
      // Force refetch the categories
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      queryClient.refetchQueries({ queryKey: ["/api/categories"] });
      setDeletingCategory(null);
      toast({
        title: "Categoria excluída",
        description: "A categoria foi excluída com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir categoria",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    },
  });

  const handleCreateCategory = () => {
    if (!newCategory.name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "O nome da categoria é obrigatório.",
        variant: "destructive",
      });
      return;
    }
    createCategoryMutation.mutate(newCategory);
  };

  const handleUpdateCategory = () => {
    if (!editingCategory) return;
    updateCategoryMutation.mutate(editingCategory);
  };

  const handleDeleteCategory = () => {
    if (!deletingCategory) return;
    deleteCategoryMutation.mutate(deletingCategory.id);
  };

  // Separate custom and default categories
  const customCategories = categories.filter(cat => !cat.isDefault);
  const defaultCategories = categories.filter(cat => cat.isDefault);

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Page Header */}
      <div className="bg-card border-b border-border px-4 sm:px-6 py-4">
        <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground" data-testid="title-categories">
              Categorias
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Gerencie as categorias de despesas personalizadas
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-category">
                <Plus className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Nova Categoria</span>
              </Button>
            </DialogTrigger>
            <DialogContent data-testid="dialog-add-category">
              <DialogHeader>
                <DialogTitle>Criar Nova Categoria</DialogTitle>
                <DialogDescription>
                  Crie uma categoria personalizada para organizar suas despesas.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="category-name">Nome *</Label>
                  <Input
                    id="category-name"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    placeholder="Ex: Escola, Médico, Esportes..."
                    data-testid="input-category-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category-description">Descrição</Label>
                  <Input
                    id="category-description"
                    value={newCategory.description}
                    onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                    placeholder="Descrição opcional da categoria"
                    data-testid="input-category-description"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category-color">Cor</Label>
                  <div className="flex items-center space-x-2">
                    <input
                      id="category-color"
                      type="color"
                      value={newCategory.color}
                      onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                      className="w-10 h-10 rounded border"
                      data-testid="input-category-color"
                    />
                    <span className="text-sm text-muted-foreground">
                      Escolha uma cor para destacar a categoria
                    </span>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                    data-testid="button-cancel-add"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleCreateCategory}
                    disabled={createCategoryMutation.isPending}
                    data-testid="button-save-category"
                  >
                    {createCategoryMutation.isPending ? "Criando..." : "Criar Categoria"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <main className="p-4 sm:p-6 max-w-4xl mx-auto">
        <div className="space-y-4 sm:space-y-6">
          {/* Info Alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              As categorias personalizadas criadas aqui ficarão disponíveis ao registrar suas despesas.
              Categorias padrão do sistema não podem ser editadas ou excluídas.
            </AlertDescription>
          </Alert>

          {/* Custom Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Tags className="mr-2 w-5 h-5" />
                Minhas Categorias ({customCategories.length})
              </CardTitle>
              <CardDescription>
                Categorias personalizadas que você criou
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Carregando categorias...</p>
                </div>
              ) : customCategories.length === 0 ? (
                <div className="text-center py-8">
                  <Tags className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">Nenhuma categoria personalizada</h3>
                  <p className="text-muted-foreground mb-4">
                    Crie sua primeira categoria personalizada para organizar melhor suas despesas.
                  </p>
                  <Button onClick={() => setIsAddDialogOpen(true)} data-testid="button-create-first-category">
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Primeira Categoria
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {customCategories.map((category) => (
                    <div
                      key={category.id}
                      className="p-4 border rounded-lg hover-elevate"
                      data-testid={`card-category-${category.id}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: category.color || "#3b82f6" }}
                            />
                            <h4 className="font-medium text-foreground" data-testid={`text-category-name-${category.id}`}>
                              {category.name}
                            </h4>
                          </div>
                          {category.description && (
                            <p className="text-sm text-muted-foreground mb-2" data-testid={`text-category-description-${category.id}`}>
                              {category.description}
                            </p>
                          )}
                        </div>
                        <div className="flex space-x-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setEditingCategory(category)}
                            data-testid={`button-edit-category-${category.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setDeletingCategory(category)}
                            data-testid={`button-delete-category-${category.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Default Categories */}
          {defaultCategories.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Tags className="mr-2 w-5 h-5" />
                  Categorias do Sistema ({defaultCategories.length})
                </CardTitle>
                <CardDescription>
                  Categorias padrão fornecidas pelo sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {defaultCategories.map((category) => (
                    <div
                      key={category.id}
                      className="p-4 border rounded-lg bg-muted/50"
                      data-testid={`card-default-category-${category.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: category.color || "#6b7280" }}
                          />
                          <h4 className="font-medium text-foreground" data-testid={`text-default-category-name-${category.id}`}>
                            {category.name}
                          </h4>
                        </div>
                        <Badge variant="secondary" data-testid={`badge-default-${category.id}`}>
                          Padrão
                        </Badge>
                      </div>
                      {category.description && (
                        <p className="text-sm text-muted-foreground mt-2" data-testid={`text-default-category-description-${category.id}`}>
                          {category.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Edit Category Dialog */}
          <Dialog open={!!editingCategory} onOpenChange={() => setEditingCategory(null)}>
            <DialogContent data-testid="dialog-edit-category">
              <DialogHeader>
                <DialogTitle>Editar Categoria</DialogTitle>
                <DialogDescription>
                  Atualize as informações da categoria.
                </DialogDescription>
              </DialogHeader>
              {editingCategory && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-category-name">Nome *</Label>
                    <Input
                      id="edit-category-name"
                      value={editingCategory.name}
                      onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                      placeholder="Nome da categoria"
                      data-testid="input-edit-category-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-category-description">Descrição</Label>
                    <Input
                      id="edit-category-description"
                      value={editingCategory.description || ""}
                      onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                      placeholder="Descrição da categoria"
                      data-testid="input-edit-category-description"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-category-color">Cor</Label>
                    <div className="flex items-center space-x-2">
                      <input
                        id="edit-category-color"
                        type="color"
                        value={editingCategory.color || "#3b82f6"}
                        onChange={(e) => setEditingCategory({ ...editingCategory, color: e.target.value })}
                        className="w-10 h-10 rounded border"
                        data-testid="input-edit-category-color"
                      />
                      <span className="text-sm text-muted-foreground">
                        Escolha uma cor para destacar a categoria
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setEditingCategory(null)}
                      data-testid="button-cancel-edit"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleUpdateCategory}
                      disabled={updateCategoryMutation.isPending}
                      data-testid="button-save-edit"
                    >
                      {updateCategoryMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Delete Category Dialog */}
          <Dialog open={!!deletingCategory} onOpenChange={() => setDeletingCategory(null)}>
            <DialogContent data-testid="dialog-delete-category">
              <DialogHeader>
                <DialogTitle>Excluir Categoria</DialogTitle>
                <DialogDescription>
                  Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita.
                </DialogDescription>
              </DialogHeader>
              {deletingCategory && (
                <div className="space-y-4">
                  <Alert>
                    <AlertDescription>
                      A categoria "{deletingCategory.name}" será excluída permanentemente.
                      Despesas existentes que usam esta categoria não serão afetadas.
                    </AlertDescription>
                  </Alert>
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setDeletingCategory(null)}
                      data-testid="button-cancel-delete"
                    >
                      Cancelar
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteCategory}
                      disabled={deleteCategoryMutation.isPending}
                      data-testid="button-confirm-delete"
                    >
                      {deleteCategoryMutation.isPending ? "Excluindo..." : "Excluir Categoria"}
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
}