import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

/**
 * Service pour générer des uploads sécurisés via Cloudinary
 * Permet aux clients de uploader directement sans passer par le serveur
 */
@Injectable()
export class SecureUploadService {
  private readonly logger = new Logger(SecureUploadService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Génère une signature Cloudinary valide pour l'upload sécurisé
   * L'utilisateur peut alors uploader via un formulaire sans serveur
   */
  generateCloudinarySignature(
    public_id: string,
    folder: string = 'assurlink',
    maxFileSize: number = 52428800, // 50MB par défaut
  ): {
    cloudName: string;
    apiKey: string;
    signature: string;
    timestamp: number;
    folder: string;
    publicId: string;
  } {
    const cloudName = this.configService.get('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get('CLOUDINARY_API_SECRET');

    if (!cloudName || !apiKey || !apiSecret) {
      throw new BadRequestException('Cloudinary credentials not configured');
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const fullPublicId = `${folder}/${public_id}`;

    // Les paramètres à signer
    const paramsToSign = {
      timestamp,
      public_id: fullPublicId,
      max_file_size: maxFileSize,
      eager: 'w_400,h_300,c_pad|w_160,h_100,c_fill',
      folder: folder,
      resource_type: 'auto',
    };

    // Créer la chaîne à signer au format attendu par Cloudinary
    const signString = Object.keys(paramsToSign)
      .sort()
       .map((key) => `${key}=${paramsToSign[key as keyof typeof paramsToSign]}`)
      .join('&');

    // Signer avec SHA-1
    const signature = crypto
      .createHash('sha1')
      .update(signString + apiSecret)
      .digest('hex');

    return {
      cloudName,
      apiKey,
      signature,
      timestamp,
      folder,
      publicId: fullPublicId,
    };
  }

  /**
   * Génère une URL sécurisée pour un fichier uploads précédemment
   * Utilise un token d'authentification avec expiration
   */
  generateSecureFileUrl(
    publicId: string,
    expiresIn: number = 3600, // 1h par défaut
  ): string {
    const cloudName = this.configService.get('CLOUDINARY_CLOUD_NAME');
    const apiSecret = this.configService.get('CLOUDINARY_API_SECRET');

    if (!cloudName || !apiSecret) {
      throw new BadRequestException('Cloudinary credentials not configured');
    }

    const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;

    // Format: /public_id/<version>/<auth_token>/
    const authString = `${expiresAt}`;
    const token = crypto
      .createHash('sha256')
      .update(authString + apiSecret)
      .digest('hex');

    return `https://res.cloudinary.com/${cloudName}/image/authenticated/s--${token.substring(0, 8)}--/${publicId}`;
  }

  /**
   * Valide qu'une réponse d'upload Cloudinary est authentique
   * Vérifie la signature retournée par Cloudinary
   */
  validateCloudinaryResponse(response: {
    public_id: string;
    signature: string;
    timestamp: number;
    [key: string]: any;
  }): boolean {
    const apiSecret = this.configService.get('CLOUDINARY_API_SECRET');
    if (!apiSecret) {
      throw new BadRequestException('Cloudinary API secret not configured');
    }

    // Extraire et valider la signature
    const { signature, ...paramsToCheck } = response;

    // Recréer la chaîne signée
    const signString = Object.keys(paramsToCheck)
      .sort()
      .map((key) => {
        if (typeof paramsToCheck[key] === 'object') {
          return `${key}=${JSON.stringify(paramsToCheck[key])}`;
        }
        return `${key}=${paramsToCheck[key]}`;
      })
      .join('&');

    const expectedSignature = crypto
      .createHash('sha1')
      .update(signString + apiSecret)
      .digest('hex');

    return expectedSignature === signature;
  }

  /**
   * Détecte le type de fichier basé sur son extension
   * Utilisé pour valider les uploads
   */
  getAllowedFileTypes(): {
    documents: string[];
    images: string[];
    videos: string[];
  } {
    return {
      documents: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt'],
      images: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      videos: ['mp4', 'avi', 'mov', 'webm'],
    };
  }

  /**
   * Valide qu'une extension de fichier est autorisée
   */
  isFileTypeAllowed(filename: string, allowedTypes: string[]): boolean {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (!ext) return false;
    return allowedTypes.includes(ext);
  }

  /**
   * Génère un transformateur Cloudinary pour les miniatures automiques
   */
  getTransformations() {
    return {
      thumbnail: { width: 200, height: 200, crop: 'fill' },
      preview: { width: 800, height: 600, crop: 'fill' },
      optimized: { quality: 'auto', fetch_format: 'auto' },
    };
  }
}
