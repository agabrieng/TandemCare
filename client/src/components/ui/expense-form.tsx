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
import { Card, CardContent } from "@/components/ui/card";

const expenseFormSchema = z.object({
  description: z.string().min(1, "Descrição é obrigatória"),
  amount: z.string().min(1, "Valor é obrigatório").refine((val) => {
    const num = parseFloat(val.replace(',', '.'));
    return !isNaN(num) && num > 0;
  }, "Valor deve ser um número positivo"),
  expenseDate: z.string().min(1, "Data é obrigatória"),
  category: z.string().min(1, "Categoria é obrigatória"),
  childId: z.string().min(1, "Filho é obrigatório"),
  status: z.string().default("pendente"),
});

type ExpenseFormData = z.infer<typeof expenseFormSchema>;

interface ExpenseFormProps {
  onSubmit: (data: ExpenseFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  initialData?: Partial<ExpenseFormData>;
}

const categories = [
  { value: "educação", label: "Educação" },
  { value: "saúde", label: "Saúde" },
  { value: "alimentação", label: "Alimentação" },
  { value: "vestuário", label: "Vestuário" },
  { value: "transporte", label: "Transporte" },
  { value: "lazer", label: "Lazer" },
  { value: "outros", label: "Outros" },
];

const statusOptions = [
  { value: "pendente", label: "Pendente" },
  { value: "pago", label: "Pago" },
  { value: "reembolsado", label: "Reembolsado" },
];

export function ExpenseForm({ onSubmit, onCancel, isLoading = false, initialData }: ExpenseFormProps) {
  const [selectedCategory, setSelectedCategory] = useState(initialData?.category || "");
  const [selectedChild, setSelectedChild] = useState(initialData?.childId || "");
  const [selectedStatus, setSelectedStatus] = useState(initialData?.status || "pendente");

  const { data: children = [] } = useQuery<any[]>({
    queryKey: ["/api/children"],
    retry: false,
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      description: initialData?.description || "",
      amount: initialData?.amount || "",
      expenseDate: initialData?.expenseDate || new Date().toISOString().split('T')[0],
      category: initialData?.category || "",
      childId: initialData?.childId || "",
      status: initialData?.status || "pendente",
    },
  });

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
    onSubmit(formattedData);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 sm:space-y-6">
          <div className="space-y-2">
            <Label htmlFor="description">Descrição *</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Descreva a despesa..."
              rows={3}
              data-testid="input-expense-description"
            />
            {errors.description && (
              <p className="text-sm text-destructive" data-testid="error-description">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Valor (R$) *</Label>
              <Input
                id="amount"
                {...register("amount")}
                placeholder="0,00"
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

            <div className="space-y-2">
              <Label htmlFor="expenseDate">Data da Despesa *</Label>
              <Input
                id="expenseDate"
                type="date"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoria *</Label>
              <Select
                value={selectedCategory}
                onValueChange={(value) => {
                  setSelectedCategory(value);
                  setValue("category", value);
                }}
              >
                <SelectTrigger data-testid="select-expense-category">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-sm text-destructive" data-testid="error-category">
                  {errors.category.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Filho *</Label>
              <Select
                value={selectedChild}
                onValueChange={(value) => {
                  setSelectedChild(value);
                  setValue("childId", value);
                }}
              >
                <SelectTrigger data-testid="select-expense-child">
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

          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={selectedStatus}
              onValueChange={(value) => {
                setSelectedStatus(value);
                setValue("status", value);
              }}
            >
              <SelectTrigger data-testid="select-expense-status">
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

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 sm:gap-2 sm:space-x-0 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              data-testid="button-cancel-expense"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              data-testid="button-save-expense"
            >
              {isLoading ? "Salvando..." : initialData ? "Atualizar" : "Adicionar"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
