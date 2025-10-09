import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ObjectUploader } from "@/components/ObjectUploader";
import { apiRequest } from "@/lib/queryClient";
import { getTodayInBrazilTimezone, brazilDateToStorage } from "@/lib/date-utils";
import { Paperclip, X, FileText } from "lucide-react";
import type { UploadResult } from "@uppy/core";

const expenseFormSchema = z.object({
  description: z.string().min(1, "Descrição é obrigatória"),
  amount: z.string().min(1, "Valor é obrigatório").refine((val) => {
    const num = parseFloat(val.replace(',', '.'));
    return !isNaN(num) && num > 0;
  }, "Valor deve ser um número positivo"),
  expenseDate: z.string().min(1, "Data é obrigatória"),
  category: z.string().min(1, "Categoria é obrigatória"),
  customCategory: z.string().optional(),
  childId: z.string().min(1, "Filho é obrigatório"),
  status: z.string().default("pendente"),
  observations: z.string().optional(),
}).refine((data) => {
  // If category is "outros", customCategory is required
  if (data.category.toLowerCase() === "outros" && !data.customCategory?.trim()) {
    return false;
  }
  return true;
}, {
  message: "Especifique do que se trata a categoria 'Outros'",
  path: ["customCategory"],
});

type ExpenseFormData = z.infer<typeof expenseFormSchema>;

interface UploadedFile {
  uploadURL: string;
  fileName: string;
  fileType: string;
}

interface ExpenseFormProps {
  onSubmit: (data: ExpenseFormData, uploadedFiles?: UploadedFile[]) => void;
  onCancel: () => void;
  isLoading?: boolean;
  initialData?: Partial<ExpenseFormData>;
}

// Categories will be loaded from the database

const statusOptions = [
  { value: "pendente", label: "Pendente" },
  { value: "pago", label: "Pago" },
  { value: "reembolsado", label: "Reembolsado" },
];

export function ExpenseForm({ onSubmit, onCancel, isLoading = false, initialData }: ExpenseFormProps) {
  const [selectedCategory, setSelectedCategory] = useState(initialData?.category || "");
  const [selectedChild, setSelectedChild] = useState(initialData?.childId || "");
  const [selectedStatus, setSelectedStatus] = useState(initialData?.status || "pendente");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploadLoading, setUploadLoading] = useState(false);

  const { data: children = [] } = useQuery<any[]>({
    queryKey: ["/api/children"],
    retry: false,
  });

  const { data: categoriesData = [], isLoading: categoriesLoading } = useQuery<{ id: string; name: string; isDefault: boolean }[]>({
    queryKey: ["/api/categories"],
    retry: false,
  });

  // Ensure "Outros" category is always available as fallback
  const categories = [...categoriesData];
  const hasOthersCategory = categories.some(cat => cat.name.toLowerCase() === "outros");
  if (!hasOthersCategory) {
    categories.push({ id: "fallback-outros", name: "Outros", isDefault: false });
  }

  const { data: user } = useQuery<{ id: string; email: string; firstName: string; lastName: string }>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      description: initialData?.description || "",
      amount: initialData?.amount || "",
      expenseDate: initialData?.expenseDate || getTodayInBrazilTimezone(),
      category: initialData?.category || "",
      customCategory: (initialData as any)?.customCategory || "",
      childId: initialData?.childId || "",
      status: initialData?.status || "pendente",
      observations: initialData?.observations || "",
    },
  });

  // Watch form values for organization parameters
  const currentExpenseDate = watch("expenseDate");

  // Create organization parameters for ObjectUploader
  const organizationParams = user?.id && selectedChild && currentExpenseDate ? {
    userId: user.id,
    childId: selectedChild,
    expenseDate: currentExpenseDate
  } : undefined;

  const formatCurrency = (value: string) => {
    // Remove non-numeric characters except decimal point
    const numericValue = value.replace(/[^\d,.-]/g, '');
    return numericValue;
  };

  const onFormSubmit = (data: ExpenseFormData) => {
    // Ensure proper decimal format for amount
    const formattedData = {
      ...data,
      amount: data.amount.replace(',', '.'),
    };
    onSubmit(formattedData, uploadedFiles);
  };

  const handleGetUploadParameters = async (organizationParams?: {
    userId: string;
    childId: string;
    expenseDate: string;
  }) => {
    try {
      const requestBody = organizationParams || {};
      const response = await apiRequest('POST', '/api/objects/upload', requestBody);
      const data = await response.json();
      return {
        method: 'PUT' as const,
        url: data.uploadURL
      };
    } catch (error) {
      console.error('Erro ao preparar upload:', error);
      throw error;
    }
  };

  const handleUploadComplete = (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      const newFiles = result.successful.map(file => ({
        uploadURL: file.uploadURL || '',
        fileName: file.name || 'comprovante',
        fileType: file.type || 'application/pdf'
      }));
      setUploadedFiles(prev => [...prev, ...newFiles]);
      setUploadLoading(false);
    }
  };

  const removeUploadedFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div>
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-5 sm:space-y-6">
          <div className="space-y-3">
            <Label htmlFor="description" className="text-sm font-medium">Descrição *</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Descreva a despesa..."
              rows={3}
              className="text-base"
              data-testid="input-expense-description"
            />
            {errors.description && (
              <p className="text-sm text-destructive" data-testid="error-description">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-3">
              <Label htmlFor="amount" className="text-sm font-medium">Valor (R$) *</Label>
              <Input
                id="amount"
                {...register("amount")}
                placeholder="0,00"
                className="text-base text-right sm:text-left"
                inputMode="decimal"
                onChange={(e) => {
                  const formatted = formatCurrency(e.target.value);
                  e.target.value = formatted;
                }}
                data-testid="input-expense-amount"
              />
              {errors.amount && (
                <p className="text-sm text-destructive" data-testid="error-amount">
                  {errors.amount.message}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <Label htmlFor="expenseDate" className="text-sm font-medium">Data da Despesa *</Label>
              <Input
                id="expenseDate"
                type="date"
                className="text-base"
                {...register("expenseDate")}
                data-testid="input-expense-date"
              />
              {errors.expenseDate && (
                <p className="text-sm text-destructive" data-testid="error-expense-date">
                  {errors.expenseDate.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Categoria *</Label>
              <Select
                value={selectedCategory}
                onValueChange={(value) => {
                  setSelectedCategory(value);
                  setValue("category", value);
                }}
              >
                <SelectTrigger data-testid="select-expense-category" className="text-base">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categoriesLoading ? (
                    <SelectItem value="loading" disabled>
                      Carregando categorias...
                    </SelectItem>
                  ) : categories.length === 0 ? (
                    <SelectItem value="no-categories" disabled>
                      Nenhuma categoria encontrada
                    </SelectItem>
                  ) : (
                    categories.map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-sm text-destructive" data-testid="error-category">
                  {errors.category.message}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Filho *</Label>
              <Select
                value={selectedChild}
                onValueChange={(value) => {
                  setSelectedChild(value);
                  setValue("childId", value);
                }}
              >
                <SelectTrigger data-testid="select-expense-child" className="text-base">
                  <SelectValue placeholder="Selecione um filho" />
                </SelectTrigger>
                <SelectContent>
                  {children?.map((child: any) => (
                    <SelectItem key={child.id} value={child.id}>
                      {child.firstName} {child.lastName || ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.childId && (
                <p className="text-sm text-destructive" data-testid="error-child">
                  {errors.childId.message}
                </p>
              )}
            </div>
          </div>

          {/* Custom category field - only show when "outros" is selected */}
          {selectedCategory.toLowerCase() === "outros" && (
            <div className="space-y-3 p-4 bg-muted rounded-lg border">
              <Label htmlFor="customCategory" className="text-sm font-medium">Do que se trata? *</Label>
              <Input
                id="customCategory"
                {...register("customCategory")}
                placeholder="Especifique a categoria personalizada..."
                className="text-base"
                data-testid="input-custom-category"
              />
              {errors.customCategory && (
                <p className="text-sm text-destructive" data-testid="error-custom-category">
                  {errors.customCategory.message}
                </p>
              )}
            </div>
          )}

          <div className="space-y-3">
            <Label className="text-sm font-medium">Status</Label>
            <Select
              value={selectedStatus}
              onValueChange={(value) => {
                setSelectedStatus(value);
                setValue("status", value);
              }}
            >
              <SelectTrigger data-testid="select-expense-status" className="text-base">
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Observações/Justificativas Section */}
          <div className="space-y-3">
            <Label htmlFor="observations" className="text-sm font-medium">Observações/Justificativas (Opcional)</Label>
            <Textarea
              id="observations"
              {...register("observations")}
              placeholder="Adicione observações ou justificativas para contexto judicial..."
              rows={2}
              className="text-base"
              data-testid="input-expense-observations"
            />
            <p className="text-xs text-muted-foreground">
              Campo útil para análise judicial: justificativas sobre gastos extraordinários, emergências, etc.
            </p>
          </div>

          {/* Comprovantes Section */}
          <div className="space-y-4 border-t pt-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Comprovantes (Opcional)</Label>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Adicione comprovantes para documentar esta despesa (PDF, imagens até 10MB)
              </p>
            </div>
            
            <div className="space-y-3">
              <ObjectUploader
                maxNumberOfFiles={3}
                maxFileSize={10485760} // 10MB
                onGetUploadParameters={handleGetUploadParameters}
                onComplete={handleUploadComplete}
                buttonClassName="w-full sm:w-auto"
                organizationParams={organizationParams}
              >
                <Paperclip className="w-4 h-4 mr-2" />
                Adicionar Comprovante
              </ObjectUploader>

              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Comprovantes Adicionados:</Label>
                  {uploadedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-muted rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm truncate">{file.fileName}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeUploadedFile(index)}
                        className="text-muted-foreground hover:text-destructive p-1 h-6 w-6"
                        data-testid={`button-remove-receipt-${index}`}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-4 sm:gap-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={onCancel}
              disabled={isLoading}
              className="w-full sm:w-auto"
              data-testid="button-cancel-expense"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="lg"
              disabled={isLoading}
              className="w-full sm:w-auto"
              data-testid="button-save-expense"
            >
              {isLoading ? "Salvando..." : initialData ? "Atualizar" : "Adicionar"}
            </Button>
          </div>
        </form>
    </div>
  );
}
