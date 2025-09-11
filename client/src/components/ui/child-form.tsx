import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ObjectUploader } from "@/components/ObjectUploader";
import { apiRequest } from "@/lib/queryClient";
import { Camera, X } from "lucide-react";
import type { UploadResult } from "@uppy/core";

const childFormSchema = z.object({
  firstName: z.string().min(1, "Nome é obrigatório").max(100, "Nome muito longo"),
  lastName: z.string().optional(),
  dateOfBirth: z.string().optional(),
  relationship: z.string().default("pai/mãe"),
  profileImageUrl: z.string().optional(),
});

type ChildFormData = z.infer<typeof childFormSchema>;

interface UploadedPhoto {
  uploadURL: string;
  fileName: string;
  fileType: string;
}

interface ChildFormProps {
  onSubmit: (data: ChildFormData, uploadedPhoto?: UploadedPhoto) => void;
  onCancel: () => void;
  isLoading?: boolean;
  initialData?: Partial<ChildFormData>;
}

export function ChildForm({ onSubmit, onCancel, isLoading = false, initialData }: ChildFormProps) {
  const [uploadedPhoto, setUploadedPhoto] = useState<UploadedPhoto | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [currentPhotoPreview, setCurrentPhotoPreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ChildFormData>({
    resolver: zodResolver(childFormSchema),
    defaultValues: {
      firstName: initialData?.firstName || "",
      lastName: initialData?.lastName || "",
      dateOfBirth: initialData?.dateOfBirth || "",
      relationship: initialData?.relationship || "pai/mãe",
      profileImageUrl: initialData?.profileImageUrl || "",
    },
  });

  // Watch form values for the avatar preview
  const firstName = watch("firstName");
  const lastName = watch("lastName");

  const handleGetUploadParameters = async () => {
    try {
      const response = await apiRequest('POST', '/api/objects/upload');
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
      const file = result.successful[0];
      const newPhoto = {
        uploadURL: file.uploadURL || '',
        fileName: file.name || 'profile-photo',
        fileType: file.type || 'image/jpeg'
      };
      setUploadedPhoto(newPhoto);
      setCurrentPhotoPreview(null); // Clear any existing preview
      setUploadLoading(false);
    }
  };

  const removeUploadedPhoto = () => {
    setUploadedPhoto(null);
    setCurrentPhotoPreview(null);
  };

  const getChildInitials = (firstName: string, lastName?: string) => {
    const first = firstName?.charAt(0) || "C";
    const last = lastName?.charAt(0) || "";
    return (first + last).toUpperCase();
  };

  // Generate preview URL for existing photo
  const getPhotoUrl = () => {
    if (uploadedPhoto) {
      // Use the normalized path format for new uploads
      return `/api/object-storage/image?path=${uploadedPhoto.uploadURL}`;
    }
    if (initialData?.profileImageUrl) {
      return `/api/object-storage/image?path=${initialData.profileImageUrl}`;
    }
    return null;
  };

  const hasPhoto = uploadedPhoto || initialData?.profileImageUrl;

  const onFormSubmit = (data: ChildFormData) => {
    // Remove empty strings and convert to proper format
    const formattedData = {
      ...data,
      lastName: data.lastName?.trim() || undefined,
      dateOfBirth: data.dateOfBirth || undefined,
    };
    onSubmit(formattedData, uploadedPhoto || undefined);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 sm:space-y-6">
          {/* Profile Photo Section */}
          <div className="space-y-3">
            <Label>Foto de Perfil (Opcional)</Label>
            <div className="flex items-center space-x-4">
              <Avatar className="w-20 h-20">
                <AvatarImage 
                  src={getPhotoUrl() || undefined}
                  alt="Foto de perfil"
                />
                <AvatarFallback className="bg-blue-100 text-blue-800 text-lg">
                  {getChildInitials(firstName, lastName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col space-y-2">
                {!hasPhoto ? (
                  <ObjectUploader
                    maxNumberOfFiles={1}
                    maxFileSize={5242880} // 5MB
                    onGetUploadParameters={handleGetUploadParameters}
                    onComplete={handleUploadComplete}
                    buttonClassName="w-full sm:w-auto"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Adicionar Foto
                  </ObjectUploader>
                ) : (
                  <div className="space-y-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={removeUploadedPhoto}
                      data-testid="button-remove-photo"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Remover Foto
                    </Button>
                    <ObjectUploader
                      maxNumberOfFiles={1}
                      maxFileSize={5242880} // 5MB
                      onGetUploadParameters={handleGetUploadParameters}
                      onComplete={handleUploadComplete}
                      buttonClassName="w-full sm:w-auto"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Alterar Foto
                    </ObjectUploader>
                  </div>
                )}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Adicione uma foto para personalizar o perfil (máximo 5MB)
            </p>
          </div>

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
