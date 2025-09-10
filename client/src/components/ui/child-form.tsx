import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

const childFormSchema = z.object({
  firstName: z.string().min(1, "Nome é obrigatório").max(100, "Nome muito longo"),
  lastName: z.string().optional(),
  dateOfBirth: z.string().optional(),
  relationship: z.string().default("pai/mãe"),
});

type ChildFormData = z.infer<typeof childFormSchema>;

interface ChildFormProps {
  onSubmit: (data: ChildFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  initialData?: Partial<ChildFormData>;
}

export function ChildForm({ onSubmit, onCancel, isLoading = false, initialData }: ChildFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ChildFormData>({
    resolver: zodResolver(childFormSchema),
    defaultValues: {
      firstName: initialData?.firstName || "",
      lastName: initialData?.lastName || "",
      dateOfBirth: initialData?.dateOfBirth || "",
      relationship: initialData?.relationship || "pai/mãe",
    },
  });

  const onFormSubmit = (data: ChildFormData) => {
    // Remove empty strings and convert to proper format
    const formattedData = {
      ...data,
      lastName: data.lastName?.trim() || undefined,
      dateOfBirth: data.dateOfBirth || undefined,
    };
    onSubmit(formattedData);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 sm:space-y-6">
          <div className="space-y-2">
            <Label htmlFor="firstName">Nome *</Label>
            <Input
              id="firstName"
              {...register("firstName")}
              placeholder="Nome do filho"
              data-testid="input-child-first-name"
            />
            {errors.firstName && (
              <p className="text-sm text-destructive" data-testid="error-first-name">
                {errors.firstName.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">Sobrenome</Label>
            <Input
              id="lastName"
              {...register("lastName")}
              placeholder="Sobrenome do filho (opcional)"
              data-testid="input-child-last-name"
            />
            {errors.lastName && (
              <p className="text-sm text-destructive" data-testid="error-last-name">
                {errors.lastName.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Data de Nascimento</Label>
            <Input
              id="dateOfBirth"
              type="date"
              {...register("dateOfBirth")}
              data-testid="input-child-birth-date"
            />
            {errors.dateOfBirth && (
              <p className="text-sm text-destructive" data-testid="error-birth-date">
                {errors.dateOfBirth.message}
              </p>
            )}
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 sm:gap-2 sm:space-x-0 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              data-testid="button-cancel-child"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              data-testid="button-save-child"
            >
              {isLoading ? "Salvando..." : initialData ? "Atualizar" : "Adicionar"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
