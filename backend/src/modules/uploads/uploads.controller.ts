import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { SecureUploadService } from './secure-upload.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

interface CurrentUserPayload {
  id: string;
  email: string;
  role: string;
  companyId: string;
}

@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  private readonly logger = new Logger(UploadsController.name);

  constructor(private readonly uploadService: SecureUploadService) {}

  /**
   * Génère une signature pour l'upload direct vers Cloudinary
   * POST /uploads/signature
   *
   * Body:
   * {
   *   "publicId": "claim/12345/document",
   *   "folder": "assurlink/claims"
   * }
   *
   * Réponse:
   * {
   *   "cloudName": "...",
   *   "apiKey": "...",
   *   "signature": "...",
   *   "timestamp": 1234567890,
   *   "folder": "assurlink/claims",
   *   "publicId": "assurlink/claims/claim/12345/document"
   * }
   */
  @Post('signature')
  generateUploadSignature(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: { publicId: string; folder?: string; maxFileSize?: number },
  ) {
    const { publicId, folder, maxFileSize } = body;

    if (!publicId) {
      throw new BadRequestException('publicId is required');
    }

    try {
      const signature = this.uploadService.generateCloudinarySignature(
        `${user.companyId}/${publicId}`,
        folder || 'assurlink',
        maxFileSize || 52428800,
      );

      this.logger.log(`Upload signature generated for ${publicId}`);

      return signature;
       } catch (error: unknown) {
         this.logger.error(`Failed to generate signature: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Génère une URL sécurisée protégée par token pour accéder à un fichier
   * GET /uploads/secure-url/:publicId
   *
   * Paramètres:
   * - publicId: l'identifiant public du fichier sur Cloudinary
   * - expiresIn: (query) durée en secondes (défaut: 3600)
   */
  @Get('secure-url/:publicId')
  generateSecureUrl(
    @Body('publicId') publicId: string,
    @Body('expiresIn') expiresIn?: number,
  ) {
    if (!publicId) {
      throw new BadRequestException('publicId is required');
    }

    try {
      const url = this.uploadService.generateSecureFileUrl(
        publicId,
        expiresIn || 3600,
      );

      return { url, expiresIn: expiresIn || 3600 };
       } catch (error: unknown) {
         this.logger.error(`Failed to generate secure URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Valide la signature retournée par Cloudinary après un upload
   * POST /uploads/validate-response
   *
   * Body: La réponse JSON complète retournée par Cloudinary
   */
  @Post('validate-response')
  validateCloudinaryResponse(
    @CurrentUser() user: CurrentUserPayload,
    @Body() response: any,
  ) {
    try {
      const isValid = this.uploadService.validateCloudinaryResponse(response);

      if (!isValid) {
        throw new BadRequestException('Invalid Cloudinary signature');
      }

      this.logger.log(`Upload validated: ${response.public_id}`);

      return {
        valid: true,
        publicId: response.public_id,
        url: response.secure_url,
        size: response.bytes,
      };
       } catch (error: unknown) {
      this.logger.error(
           `Upload validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
           error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * Récupère la liste des types de fichiers autorisés
   * GET /uploads/allowed-types
   */
  @Get('allowed-types')
  getAllowedFileTypes() {
    return this.uploadService.getAllowedFileTypes();
  }

  /**
   * Récupère les transformations disponibles pour les images
   * GET /uploads/transformations
   */
  @Get('transformations')
  getTransformations() {
    return this.uploadService.getTransformations();
  }

  /**
   * Télécharge un fichier vers Cloudinary via le backend (fallback)
   * Utilisé si le client ne peut pas uploader directement
   * POST /uploads/direct
   *
   * Body: FormData avec 'file' + 'publicId'
   */
  @Post('direct')
  async directUpload(
    @CurrentUser() user: CurrentUserPayload,
    // Note: Implémentation réelle requiert express.Request avec multer
  ) {
    // Cette implémentation nécessiterait:
    // 1. Multer pour la gestion des fichiers uploadés
    // 2. Un appel à l'API Cloudinary v2 pour l'upload backend
    // 3. La validation du fichier avant l'upload
    // 4. L'enregistrement dans la base de données

    return {
      message:
        'Direct upload via backend - implémentation personnalisée requise',
    };
  }
}
