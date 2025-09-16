import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertParentSchema, type InsertParent } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface ParentFormProps {
  onSubmit: (data: InsertParent) => void;
  onCancel: () => void;
  isLoading?: boolean;
  initialData?: Partial<InsertParent>;
}

export function ParentForm({ onSubmit, onCancel, isLoading = false, initialData }: ParentFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<InsertParent>({
    resolver: zodResolver(insertParentSchema),
    defaultValues: {
      fullName: initialData?.fullName || "",
      cpf: initialData?.cpf || "",
      rg: initialData?.rg || "",
      dateOfBirth: initialData?.dateOfBirth || "",
      profession: initialData?.profession || "",
      maritalStatus: initialData?.maritalStatus || "",
      phone: initialData?.phone || "",
      email: initialData?.email || "",
      address: initialData?.address || "",
      city: initialData?.city || "",
      state: initialData?.state || "",
      zipCode: initialData?.zipCode || "",
      notes: initialData?.notes || "",
    },
  });

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, (_, g1, g2, g3, g4) => {
        if (g4) return `${g1}.${g2}.${g3}-${g4}`;
        if (g3) return `${g1}.${g2}.${g3}`;
        if (g2) return `${g1}.${g2}`;
        return g1;
      });
    }
    return value;
  };

  const formatZipCode = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 8) {
      return numbers.replace(/(\d{5})(\d{0,3})/, (_, g1, g2) => {
        if (g2) return `${g1}-${g2}`;
        return g1;
      });
    }
    return value;
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{0,2})(\d{0,5})(\d{0,4})/, (_, g1, g2, g3) => {
        if (g3 && g1.length === 2) return `(${g1}) ${g2}-${g3}`;
        if (g2 && g1.length === 2) return `(${g1}) ${g2}`;
        if (g1) return `(${g1}`;
        return '';
      });
    }
    return value;
  };

  const brazilianStates = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  const maritalStatusOptions = [
    'Solteiro(a)',
    'Casado(a)',
    'Divorciado(a)',
    'Separado(a)',
    'Viúvo(a)',
    'União Estável'
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Informações Pessoais</CardTitle>
          <CardDescription>Dados básicos de identificação</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nome Completo *</Label>
              <Input
                id="fullName"
                placeholder="Nome completo do pai/mãe"
                {...register("fullName")}
                data-testid="input-parent-fullname"
              />
              {errors.fullName && (
                <p className="text-sm text-destructive">{errors.fullName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Data de Nascimento</Label>
              <Input
                id="dateOfBirth"
                type="date"
                {...register("dateOfBirth")}
                data-testid="input-parent-dateofbirth"
              />
              {errors.dateOfBirth && (
                <p className="text-sm text-destructive">{errors.dateOfBirth.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                placeholder="000.000.000-00"
                {...register("cpf")}
                onChange={(e) => {
                  const formatted = formatCPF(e.target.value);
                  e.target.value = formatted;
                  setValue("cpf", formatted);
                }}
                maxLength={14}
                data-testid="input-parent-cpf"
              />
              {errors.cpf && (
                <p className="text-sm text-destructive">{errors.cpf.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="rg">RG</Label>
              <Input
                id="rg"
                placeholder="00.000.000-0"
                {...register("rg")}
                data-testid="input-parent-rg"
              />
              {errors.rg && (
                <p className="text-sm text-destructive">{errors.rg.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="profession">Profissão</Label>
              <Input
                id="profession"
                placeholder="Advogado, Professor, etc."
                {...register("profession")}
                data-testid="input-parent-profession"
              />
              {errors.profession && (
                <p className="text-sm text-destructive">{errors.profession.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="maritalStatus">Estado Civil</Label>
              <Select onValueChange={(value) => setValue("maritalStatus", value)} defaultValue={watch("maritalStatus") || ""}>
                <SelectTrigger data-testid="select-parent-maritalstatus">
                  <SelectValue placeholder="Selecione o estado civil" />
                </SelectTrigger>
                <SelectContent>
                  {maritalStatusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.maritalStatus && (
                <p className="text-sm text-destructive">{errors.maritalStatus.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Contato</CardTitle>
          <CardDescription>Informações para contato</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                placeholder="(11) 99999-9999"
                {...register("phone")}
                onChange={(e) => {
                  const formatted = formatPhone(e.target.value);
                  e.target.value = formatted;
                  setValue("phone", formatted);
                }}
                maxLength={15}
                data-testid="input-parent-phone"
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@exemplo.com"
                {...register("email")}
                data-testid="input-parent-email"
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Endereço</CardTitle>
          <CardDescription>Informações de localização</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">Endereço Completo</Label>
            <Textarea
              id="address"
              placeholder="Rua, número, bairro..."
              {...register("address")}
              data-testid="input-parent-address"
              rows={2}
            />
            {errors.address && (
              <p className="text-sm text-destructive">{errors.address.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                placeholder="São Paulo"
                {...register("city")}
                data-testid="input-parent-city"
              />
              {errors.city && (
                <p className="text-sm text-destructive">{errors.city.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">Estado</Label>
              <Select onValueChange={(value) => setValue("state", value)} defaultValue={watch("state") || ""}>
                <SelectTrigger data-testid="select-parent-state">
                  <SelectValue placeholder="UF" />
                </SelectTrigger>
                <SelectContent>
                  {brazilianStates.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.state && (
                <p className="text-sm text-destructive">{errors.state.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="zipCode">CEP</Label>
              <Input
                id="zipCode"
                placeholder="00000-000"
                {...register("zipCode")}
                onChange={(e) => {
                  const formatted = formatZipCode(e.target.value);
                  e.target.value = formatted;
                  setValue("zipCode", formatted);
                }}
                maxLength={9}
                data-testid="input-parent-zipcode"
              />
              {errors.zipCode && (
                <p className="text-sm text-destructive">{errors.zipCode.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Observações</CardTitle>
          <CardDescription>Informações adicionais (opcional)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              placeholder="Informações adicionais relevantes..."
              {...register("notes")}
              data-testid="input-parent-notes"
              rows={3}
            />
            {errors.notes && (
              <p className="text-sm text-destructive">{errors.notes.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onCancel} data-testid="button-parent-cancel">
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading} data-testid="button-parent-submit">
          {isLoading ? "Salvando..." : initialData ? "Salvar Alterações" : "Adicionar Pai/Mãe"}
        </Button>
      </div>
    </form>
  );
}