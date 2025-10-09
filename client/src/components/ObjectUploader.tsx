import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import Uppy from "@uppy/core";
import { DashboardModal } from "@uppy/react";
import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";
import AwsS3 from "@uppy/aws-s3";
import type { UploadResult } from "@uppy/core";
import { Button } from "@/components/ui/button";
import * as pdfjsLib from "pdfjs-dist";

// Configure PDF.js worker locally to avoid CDN issues
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

/**
 * Converts a PDF file to a JPEG image
 * @param file - The PDF file to convert
 * @returns Promise<File> - The converted JPEG file with metadata
 */
async function convertPdfToImage(file: File): Promise<File> {
  console.log("Convertendo PDF para imagem:", file.name);
  
  // Read file as array buffer
  const arrayBuffer = await file.arrayBuffer();
  
  // Load PDF document
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  console.log("PDF carregado com", pdf.numPages, "páginas");
  
  // Render first page only (MVP)
  const page = await pdf.getPage(1);
  
  // Calculate scale for good quality (around 150-200 DPI)
  const viewport = page.getViewport({ scale: 2.0 });
  
  // Create canvas
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Could not get canvas context');
  }
  
  canvas.height = viewport.height;
  canvas.width = viewport.width;
  
  // Render PDF page to canvas
  const renderContext = {
    canvasContext: context,
    viewport: viewport,
    canvas: canvas,
  };
  
  await page.render(renderContext).promise;
  console.log("PDF renderizado no canvas");
  
  // Convert canvas to blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to convert canvas to blob'));
          return;
        }
        
        // Create new file with converted image
        // Generate filename: replace .pdf with .jpg
        const originalName = file.name;
        const nameWithoutExt = originalName.replace(/\.pdf$/i, '');
        const newFileName = `${nameWithoutExt}.jpg`;
        
        // Create new File object with metadata
        const convertedFile = new File([blob], newFileName, {
          type: 'image/jpeg',
          lastModified: file.lastModified,
        });
        
        // Add metadata about original file
        (convertedFile as any).originalFileName = originalName;
        (convertedFile as any).originalFileType = file.type;
        
        console.log("Conversão concluída:", newFileName);
        resolve(convertedFile);
      },
      'image/jpeg',
      0.8 // Quality setting
    );
  });
}

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  onGetUploadParameters: (organizationParams?: {
    userId: string;
    childId: string;
    expenseDate: string;
  }) => Promise<{
    method: "PUT";
    url: string;
  }>;
  onComplete?: (
    result: UploadResult<Record<string, unknown>, Record<string, unknown>>
  ) => void;
  buttonClassName?: string;
  children: ReactNode;
  organizationParams?: {
    userId: string;
    childId: string;
    expenseDate: string;
  };
}

/**
 * A file upload component that renders as a button and provides a modal interface for
 * file management.
 * 
 * Features:
 * - Renders as a customizable button that opens a file upload modal
 * - Provides a modal interface for:
 *   - File selection
 *   - File preview
 *   - Upload progress tracking
 *   - Upload status display
 * 
 * The component uses Uppy under the hood to handle all file upload functionality.
 * All file management features are automatically handled by the Uppy dashboard modal.
 * 
 * @param props - Component props
 * @param props.maxNumberOfFiles - Maximum number of files allowed to be uploaded
 *   (default: 1)
 * @param props.maxFileSize - Maximum file size in bytes (default: 10MB)
 * @param props.onGetUploadParameters - Function to get upload parameters (method and URL).
 *   Typically used to fetch a presigned URL from the backend server for direct-to-S3
 *   uploads.
 * @param props.onComplete - Callback function called when upload is complete. Typically
 *   used to make post-upload API calls to update server state and set object ACL
 *   policies.
 * @param props.buttonClassName - Optional CSS class name for the button
 * @param props.children - Content to be rendered inside the button
 */
export function ObjectUploader({
  maxNumberOfFiles = 1,
  maxFileSize = 10485760, // 10MB default
  onGetUploadParameters,
  onComplete,
  buttonClassName,
  children,
  organizationParams,
}: ObjectUploaderProps) {
  const [showModal, setShowModal] = useState(false);
  const organizationParamsRef = useRef(organizationParams);
  const scrollPositionRef = useRef(0);
  
  // Update ref when organizationParams change
  useEffect(() => {
    organizationParamsRef.current = organizationParams;
  }, [organizationParams]);

  // Handle scroll position restoration when modal opens/closes
  useEffect(() => {
    if (showModal) {
      // Use requestAnimationFrame to restore scroll immediately after modal opens
      requestAnimationFrame(() => {
        const savedScroll = scrollPositionRef.current;
        window.scrollTo(0, savedScroll);
        
        // Lock body at current position
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.top = `-${savedScroll}px`;
        document.body.style.width = '100%';
      });
    } else {
      // Restore scroll position when modal closes
      const scrollY = scrollPositionRef.current;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, scrollY);
    }
  }, [showModal]);
  
  // Handle opening modal - save scroll position before state change
  const handleOpenModal = () => {
    // Save scroll position BEFORE opening modal
    scrollPositionRef.current = window.scrollY || window.pageYOffset;
    setShowModal(true);
  };

  const [uppy] = useState(() =>
    new Uppy({
      restrictions: {
        maxNumberOfFiles,
        maxFileSize,
      },
      autoProceed: false,
    })
      .use(AwsS3, {
        shouldUseMultipart: false,
        getUploadParameters: (file) => {
          // Always use current organizationParams value from ref
          return onGetUploadParameters(organizationParamsRef.current);
        },
      })
      .on("file-added", async (file) => {
        // Intercept PDF files and convert to images
        if (file.type === 'application/pdf') {
          console.log("PDF detectado, iniciando conversão:", file.name);
          
          try {
            // Convert PDF to image
            const fileObj = new File([file.data], file.name || 'document.pdf', {
              type: file.type || 'application/pdf',
              lastModified: Date.now(),
            });
            
            const convertedFile = await convertPdfToImage(fileObj);
            
            // Remove original PDF file from Uppy
            uppy.removeFile(file.id);
            
            // Add converted image file to Uppy
            uppy.addFile({
              name: convertedFile.name,
              type: convertedFile.type,
              data: convertedFile,
              meta: {
                originalFileName: (convertedFile as any).originalFileName,
                originalFileType: (convertedFile as any).originalFileType,
              },
            });
            
            console.log("PDF convertido e substituído com sucesso");
          } catch (error) {
            console.error("Erro ao converter PDF:", error);
            // Keep original file if conversion fails
            uppy.info(`Erro ao converter PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, 'error', 5000);
          }
        }
      })
      .on("complete", (result) => {
        onComplete?.(result);
      })
  );

  return (
    <>
      <Button type="button" onClick={handleOpenModal} className={buttonClassName}>
        {children}
      </Button>

      {showModal && createPortal(
        <DashboardModal
          uppy={uppy}
          open={showModal}
          onRequestClose={() => setShowModal(false)}
          proudlyDisplayPoweredByUppy={false}
          animateOpenClose={true}
          doneButtonHandler={null}
          showProgressDetails={true}
          note="Adicione arquivos PDF ou imagens (máximo 10MB)"
          metaFields={[]}
          plugins={['AwsS3']}
          closeModalOnClickOutside={false}
          disablePageScrollWhenModalOpen={false}
        />,
        document.body
      )}
    </>
  );
}
