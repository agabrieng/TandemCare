import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";

const lawyerFormSchema = z.object({
  fullName: z.string().min(1, "Nome completo é obrigatório").max(200, "Nome muito longo"),
  oabNumber: z.string().optional(),
  oabState: z.string().optional(),
  lawFirm: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  address: z.string().optional(),
  specializations: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

type LawyerFormData = z.infer<typeof lawyerFormSchema>;

interface LawyerFormProps {
  onSubmit: (data: LawyerFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  initialData?: Partial<LawyerFormData>;
}

const brazilianStates = [
  { value: "AC", label: "Acre" },
  { value: "AL", label: "Alagoas" },
  { value: "AP", label: "Amapá" },
  { value: "AM", label: "Amazonas" },
  { value: "BA", label: "Bahia" },
  { value: "CE", label: "Ceará" },
  { value: "DF", label: "Distrito Federal" },
  { value: "ES", label: "Espírito Santo" },
  { value: "GO", label: "Goiás" },
  { value: "MA", label: "Maranhão" },
  { value: "MT", label: "Mato Grosso" },
  { value: "MS", label: "Mato Grosso do Sul" },
  { value: "MG", label: "Minas Gerais" },
  { value: "PA", label: "Pará" },
  { value: "PB", label: "Paraíba" },
  { value: "PR", label: "Paraná" },
  { value: "PE", label: "Pernambuco" },
  { value: "PI", label: "Piauí" },
  { value: "RJ", label: "Rio de Janeiro" },
  { value: "RN", label: "Rio Grande do Norte" },
  { value: "RS", label: "Rio Grande do Sul" },
  { value: "RO", label: "Rondônia" },
  { value: "RR", label: "Roraima" },
  { value: "SC", label: "Santa Catarina" },
  { value: "SP", label: "São Paulo" },
  { value: "SE", label: "Sergipe" },
  { value: "TO", label: "Tocantins" },
];

const commonSpecializations = [
  "Direito de Família",
  "Direito Civil",
  "Direito da Criança e Adolescente",
  "Divórcio",
  "Guarda de Menores",
  "Pensão Alimentícia",
  "União Estável",
  "Adoção",
  "Inventário e Partilha",
];

export function LawyerForm({ onSubmit, onCancel, isLoading = false, initialData }: LawyerFormProps) {
  const [selectedState, setSelectedState] = useState(initialData?.oabState || "");
  const [specializations, setSpecializations] = useState<string[]>(initialData?.specializations || []);
  const [newSpecialization, setNewSpecialization] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LawyerFormData>({
    resolver: zodResolver(lawyerFormSchema),
    defaultValues: {
      fullName: initialData?.fullName || "",
      oabNumber: initialData?.oabNumber || "",
      oabState: initialData?.oabState || "",
      lawFirm: initialData?.lawFirm || "",
      phone: initialData?.phone || "",
      email: initialData?.email || "",
      address: initialData?.address || "",
      notes: initialData?.notes || "",
      specializations: initialData?.specializations || [],
    },
  });

  const addSpecialization = (spec: string) => {
    if (spec.trim() && !specializations.includes(spec.trim())) {
      const newSpecs = [...specializations, spec.trim()];
      setSpecializations(newSpecs);
      setValue("specializations", newSpecs);
    }
    setNewSpecialization("");
  };

  const removeSpecialization = (spec: string) => {
    const newSpecs = specializations.filter(s => s !== spec);
    setSpecializations(newSpecs);
    setValue("specializations", newSpecs);
  };

  const onFormSubmit = (data: LawyerFormData) => {
    const formattedData = {
      ...data,
      oabNumber: data.oabNumber?.trim() || undefined,
      lawFirm: data.lawFirm?.trim() || undefined,
      phone: data.phone?.trim() || undefined,
      email: data.email?.trim() || undefined,
      address: data.address?.trim() || undefined,
      notes: data.notes?.trim() || undefined,
      specializations: specializations.length > 0 ? specializations : undefined,
    };
    onSubmit(formattedData);
  };

  const formatPhone = (value: string) => {
    // Remove tudo que não é número
    const cleaned = value.replace(/\D/g, '');
    
    // Formata como (XX) XXXXX-XXXX para celular ou (XX) XXXX-XXXX para fixo
    if (cleaned.length <= 11) {
      const match = cleaned.match(/^(\d{0,2})(\d{0,5})(\d{0,4})$/);
      if (match) {
        const [, area, first, second] = match;
        let formatted = '';
        if (area) formatted += `(${area}`;
        if (first) formatted += `) ${first}`;
        if (second) formatted += `-${second}`;
        return formatted;
      }
    }
    return value;
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          {/* Nome Completo */}
          <div className="space-y-2">
            <Label htmlFor="fullName">Nome Completo *</Label>
            <Input
              id="fullName"
              {...register("fullName")}
              placeholder="Nome completo do advogado"
              data-testid="input-lawyer-name"
            />
            {errors.fullName && (
              <p className="text-sm text-destructive">{errors.fullName.message}</p>
            )}
          </div>

          {/* OAB */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="oabNumber">Número OAB</Label>
              <Input
                id="oabNumber"
                {...register("oabNumber")}
                placeholder="Ex: 123456"
                data-testid="input-oab-number"
              />
              {errors.oabNumber && (
                <p className="text-sm text-destructive">{errors.oabNumber.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="oabState">Estado OAB</Label>
              <Select
                value={selectedState}
                onValueChange={(value) => {
                  setSelectedState(value);
                  setValue("oabState", value);
                }}
              >
                <SelectTrigger data-testid="select-oab-state">
                  <SelectValue placeholder="Selecione o estado" />
                </SelectTrigger>
                <SelectContent>
                  {brazilianStates.map((state) => (
                    <SelectItem key={state.value} value={state.value}>
                      {state.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Escritório */}
          <div className="space-y-2">
            <Label htmlFor="lawFirm">Nome do Escritório</Label>
            <Input
              id="lawFirm"
              {...register("lawFirm")}
              placeholder="Nome do escritório de advocacia"
              data-testid="input-law-firm"
            />
          </div>

          {/* Contato */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                {...register("phone")}
                placeholder="(11) 99999-9999"
                onChange={(e) => {
                  const formatted = formatPhone(e.target.value);
                  e.target.value = formatted;
                  setValue("phone", formatted);
                }}
                data-testid="input-lawyer-phone"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="advogado@exemplo.com"
                data-testid="input-lawyer-email"
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
          </div>

          {/* Endereço */}
          <div className="space-y-2">
            <Label htmlFor="address">Endereço</Label>
            <Textarea
              id="address"
              {...register("address")}
              placeholder="Endereço completo do escritório"
              rows={2}
              data-testid="textarea-lawyer-address"
            />
          </div>

          {/* Especializações */}
          <div className="space-y-3">
            <Label>Especializações</Label>
            
            {/* Especialidades comuns */}
            <div>
              <Label className="text-sm text-muted-foreground mb-2 block">Adicionar especialização comum:</Label>
              <div className="flex flex-wrap gap-2">
                {commonSpecializations.map((spec) => (
                  <Button
                    key={spec}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addSpecialization(spec)}
                    disabled={specializations.includes(spec)}
                    data-testid={`button-add-spec-${spec.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    {spec}
                  </Button>
                ))}
              </div>
            </div>

            {/* Adicionar especialização personalizada */}
            <div className="flex gap-2">
              <Input
                placeholder="Adicionar especialização personalizada"
                value={newSpecialization}
                onChange={(e) => setNewSpecialization(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSpecialization(newSpecialization);
                  }
                }}
                data-testid="input-custom-specialization"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => addSpecialization(newSpecialization)}
                disabled={!newSpecialization.trim()}
                data-testid="button-add-custom-spec"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Especialidades selecionadas */}
            {specializations.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {specializations.map((spec) => (
                  <Badge key={spec} variant="secondary" className="gap-1">
                    {spec}
                    <button
                      type="button"
                      onClick={() => removeSpecialization(spec)}
                      className="ml-1 hover:text-destructive"
                      data-testid={`button-remove-spec-${spec.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              {...register("notes")}
              placeholder="Observações adicionais sobre o advogado"
              rows={3}
              data-testid="textarea-lawyer-notes"
            />
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              data-testid="button-cancel-lawyer"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              data-testid="button-submit-lawyer"
            >
              {isLoading ? "Salvando..." : initialData ? "Atualizar" : "Cadastrar"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}