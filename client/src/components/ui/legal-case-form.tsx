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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

const legalCaseFormSchema = z.object({
  caseType: z.string().min(1, "Tipo do processo é obrigatório"),
  caseNumber: z.string().optional(),
  courtName: z.string().optional(),
  judgeName: z.string().optional(),
  startDate: z.string().optional(),
  expectedEndDate: z.string().optional(),
  status: z.string().default("em_andamento"),
  childrenInvolved: z.array(z.string()).optional(),
  custodyType: z.string().optional(),
  alimonyAmount: z.string().optional().refine((val) => !val || (!isNaN(parseFloat(val.replace(',', '.'))) && parseFloat(val.replace(',', '.')) >= 0), "Valor deve ser um número positivo"),
  visitationSchedule: z.string().optional(),
  importantDates: z.any().optional(),
  documents: z.array(z.string()).optional(),
  notes: z.string().optional(),
  lawyerId: z.string().optional(),
});

type LegalCaseFormData = z.infer<typeof legalCaseFormSchema>;

interface LegalCaseFormProps {
  onSubmit: (data: LegalCaseFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  initialData?: Partial<LegalCaseFormData>;
}

const caseTypes = [
  { value: "divórcio", label: "Divórcio" },
  { value: "guarda_compartilhada", label: "Guarda Compartilhada" },
  { value: "pensão_alimentícia", label: "Pensão Alimentícia" },
  { value: "regulamentação_visitas", label: "Regulamentação de Visitas" },
  { value: "investigação_paternidade", label: "Investigação de Paternidade" },
  { value: "alteração_guarda", label: "Alteração de Guarda" },
  { value: "união_estável", label: "União Estável" },
  { value: "outros", label: "Outros" },
];

const statusOptions = [
  { value: "em_andamento", label: "Em Andamento" },
  { value: "concluído", label: "Concluído" },
  { value: "suspenso", label: "Suspenso" },
  { value: "arquivado", label: "Arquivado" },
];

const custodyTypes = [
  { value: "compartilhada", label: "Guarda Compartilhada" },
  { value: "unilateral_materna", label: "Guarda Unilateral Materna" },
  { value: "unilateral_paterna", label: "Guarda Unilateral Paterna" },
  { value: "alternada", label: "Guarda Alternada" },
  { value: "nidação", label: "Guarda de Nidação" },
];

export function LegalCaseForm({ onSubmit, onCancel, isLoading = false, initialData }: LegalCaseFormProps) {
  const [selectedCaseType, setSelectedCaseType] = useState(initialData?.caseType || "");
  const [selectedStatus, setSelectedStatus] = useState(initialData?.status || "em_andamento");
  const [selectedCustodyType, setSelectedCustodyType] = useState(initialData?.custodyType || "");
  const [selectedLawyer, setSelectedLawyer] = useState(initialData?.lawyerId || "");
  const [selectedChildren, setSelectedChildren] = useState<string[]>(initialData?.childrenInvolved || []);
  const [documents, setDocuments] = useState<string[]>(initialData?.documents || []);
  const [newDocument, setNewDocument] = useState("");

  // Fetch children for selection
  const { data: children = [] } = useQuery<any[]>({
    queryKey: ["/api/children"],
    retry: false,
  });

  // Fetch lawyers for selection
  const { data: lawyers = [] } = useQuery<any[]>({
    queryKey: ["/api/lawyers"],
    retry: false,
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LegalCaseFormData>({
    resolver: zodResolver(legalCaseFormSchema),
    defaultValues: {
      caseType: initialData?.caseType || "",
      caseNumber: initialData?.caseNumber || "",
      courtName: initialData?.courtName || "",
      judgeName: initialData?.judgeName || "",
      startDate: initialData?.startDate || "",
      expectedEndDate: initialData?.expectedEndDate || "",
      status: initialData?.status || "em_andamento",
      childrenInvolved: initialData?.childrenInvolved || [],
      custodyType: initialData?.custodyType || "",
      alimonyAmount: initialData?.alimonyAmount || "",
      visitationSchedule: initialData?.visitationSchedule || "",
      documents: initialData?.documents || [],
      notes: initialData?.notes || "",
      lawyerId: initialData?.lawyerId || "",
    },
  });

  const formatCurrency = (value: string) => {
    // Remove non-numeric characters except decimal point and comma
    const numericValue = value.replace(/[^\d,.-]/g, '');
    return numericValue;
  };

  const toggleChildSelection = (childId: string) => {
    const newSelection = selectedChildren.includes(childId)
      ? selectedChildren.filter(id => id !== childId)
      : [...selectedChildren, childId];
    
    setSelectedChildren(newSelection);
    setValue("childrenInvolved", newSelection);
  };

  const addDocument = () => {
    if (newDocument.trim() && !documents.includes(newDocument.trim())) {
      const newDocs = [...documents, newDocument.trim()];
      setDocuments(newDocs);
      setValue("documents", newDocs);
      setNewDocument("");
    }
  };

  const removeDocument = (doc: string) => {
    const newDocs = documents.filter(d => d !== doc);
    setDocuments(newDocs);
    setValue("documents", newDocs);
  };

  const onFormSubmit = (data: LegalCaseFormData) => {
    const formattedData = {
      ...data,
      caseNumber: data.caseNumber?.trim() || undefined,
      courtName: data.courtName?.trim() || undefined,
      judgeName: data.judgeName?.trim() || undefined,
      startDate: data.startDate || undefined,
      expectedEndDate: data.expectedEndDate || undefined,
      custodyType: data.custodyType === "none" ? undefined : data.custodyType,
      alimonyAmount: data.alimonyAmount?.replace(',', '.') || undefined,
      visitationSchedule: data.visitationSchedule?.trim() || undefined,
      notes: data.notes?.trim() || undefined,
      lawyerId: data.lawyerId === "none" ? undefined : data.lawyerId,
      childrenInvolved: selectedChildren.length > 0 ? selectedChildren : undefined,
      documents: documents.length > 0 ? documents : undefined,
    };
    onSubmit(formattedData);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          {/* Tipo e Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="caseType">Tipo do Processo *</Label>
              <Select
                value={selectedCaseType}
                onValueChange={(value) => {
                  setSelectedCaseType(value);
                  setValue("caseType", value);
                }}
              >
                <SelectTrigger data-testid="select-case-type">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {caseTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.caseType && (
                <p className="text-sm text-destructive">{errors.caseType.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={selectedStatus}
                onValueChange={(value) => {
                  setSelectedStatus(value);
                  setValue("status", value);
                }}
              >
                <SelectTrigger data-testid="select-case-status">
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
          </div>

          {/* Número do Processo e Advogado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="caseNumber">Número do Processo</Label>
              <Input
                id="caseNumber"
                {...register("caseNumber")}
                placeholder="Ex: 1234567-89.2024.8.26.0100"
                data-testid="input-case-number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lawyerId">Advogado Responsável</Label>
              <Select
                value={selectedLawyer}
                onValueChange={(value) => {
                  setSelectedLawyer(value);
                  setValue("lawyerId", value);
                }}
              >
                <SelectTrigger data-testid="select-lawyer">
                  <SelectValue placeholder="Selecione o advogado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {lawyers.map((lawyer) => (
                    <SelectItem key={lawyer.id} value={lawyer.id}>
                      {lawyer.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Vara e Juiz */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="courtName">Nome da Vara/Tribunal</Label>
              <Input
                id="courtName"
                {...register("courtName")}
                placeholder="Ex: 1ª Vara de Família e Sucessões"
                data-testid="input-court-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="judgeName">Nome do Juiz</Label>
              <Input
                id="judgeName"
                {...register("judgeName")}
                placeholder="Nome do magistrado"
                data-testid="input-judge-name"
              />
            </div>
          </div>

          {/* Datas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Data de Início</Label>
              <Input
                id="startDate"
                type="date"
                {...register("startDate")}
                data-testid="input-start-date"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expectedEndDate">Previsão de Conclusão</Label>
              <Input
                id="expectedEndDate"
                type="date"
                {...register("expectedEndDate")}
                data-testid="input-expected-end-date"
              />
            </div>
          </div>

          {/* Filhos Envolvidos */}
          {children.length > 0 && (
            <div className="space-y-3">
              <Label>Filhos Envolvidos no Processo</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {children.map((child) => (
                  <div key={child.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`child-${child.id}`}
                      checked={selectedChildren.includes(child.id)}
                      onCheckedChange={() => toggleChildSelection(child.id)}
                      data-testid={`checkbox-child-${child.id}`}
                    />
                    <Label htmlFor={`child-${child.id}`} className="text-sm">
                      {child.firstName} {child.lastName || ""}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Guarda e Pensão */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="custodyType">Tipo de Guarda</Label>
              <Select
                value={selectedCustodyType}
                onValueChange={(value) => {
                  setSelectedCustodyType(value);
                  setValue("custodyType", value);
                }}
              >
                <SelectTrigger data-testid="select-custody-type">
                  <SelectValue placeholder="Selecione o tipo de guarda" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Não definido</SelectItem>
                  {custodyTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="alimonyAmount">Valor da Pensão Alimentícia (R$)</Label>
              <Input
                id="alimonyAmount"
                {...register("alimonyAmount")}
                placeholder="0,00"
                onChange={(e) => {
                  const formatted = formatCurrency(e.target.value);
                  e.target.value = formatted;
                  setValue("alimonyAmount", formatted);
                }}
                data-testid="input-alimony-amount"
              />
              {errors.alimonyAmount && (
                <p className="text-sm text-destructive">{errors.alimonyAmount.message}</p>
              )}
            </div>
          </div>

          {/* Cronograma de Visitas */}
          <div className="space-y-2">
            <Label htmlFor="visitationSchedule">Cronograma de Visitas</Label>
            <Textarea
              id="visitationSchedule"
              {...register("visitationSchedule")}
              placeholder="Descreva o cronograma de visitas estabelecido..."
              rows={3}
              data-testid="textarea-visitation-schedule"
            />
          </div>

          {/* Documentos Importantes */}
          <div className="space-y-3">
            <Label>Documentos Importantes</Label>
            
            <div className="flex gap-2">
              <Input
                placeholder="Nome do documento"
                value={newDocument}
                onChange={(e) => setNewDocument(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addDocument();
                  }
                }}
                data-testid="input-new-document"
              />
              <Button
                type="button"
                variant="outline"
                onClick={addDocument}
                disabled={!newDocument.trim()}
                data-testid="button-add-document"
              >
                Adicionar
              </Button>
            </div>

            {documents.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {documents.map((doc) => (
                  <Badge key={doc} variant="secondary" className="gap-1">
                    {doc}
                    <button
                      type="button"
                      onClick={() => removeDocument(doc)}
                      className="ml-1 hover:text-destructive"
                      data-testid={`button-remove-doc-${doc.toLowerCase().replace(/\s+/g, '-')}`}
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
              placeholder="Observações adicionais sobre o processo..."
              rows={4}
              data-testid="textarea-case-notes"
            />
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              data-testid="button-cancel-case"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              data-testid="button-submit-case"
            >
              {isLoading ? "Salvando..." : initialData ? "Atualizar" : "Cadastrar"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}