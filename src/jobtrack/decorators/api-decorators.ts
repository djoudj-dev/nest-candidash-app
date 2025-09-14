import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JobTrackResponseDto } from '../dto/jobtrack-response.dto';
import { JobTrackWithReminderResponseDto } from '../dto/jobtrack-with-reminder-response.dto';

export function ApiJobTrackOperation(summary: string) {
  return applyDecorators(ApiOperation({ summary }), ApiBearerAuth('JWT-auth'));
}

export function ApiJobTrackResponse() {
  return applyDecorators(
    ApiResponse({
      status: 200,
      description: 'Annonce récupérée avec succès',
      type: JobTrackResponseDto,
    }),
    ApiResponse({ status: 404, description: 'Annonce introuvable' }),
    ApiResponse({ status: 403, description: 'Accès refusé à cette annonce' }),
  );
}

export function ApiJobTrackListResponse() {
  return applyDecorators(
    ApiResponse({
      status: 200,
      description: 'Liste des annonces',
      type: [JobTrackResponseDto],
    }),
  );
}

export function ApiJobTrackWithReminderResponse(
  status = 200,
  description = 'Succès',
) {
  return applyDecorators(
    ApiResponse({
      status,
      description,
      type: JobTrackWithReminderResponseDto,
    }),
    ApiResponse({ status: 400, description: "Données d'entrée invalides" }),
    ApiResponse({ status: 403, description: 'Accès refusé à cette annonce' }),
    ApiResponse({ status: 404, description: 'Annonce introuvable' }),
  );
}

export function ApiJobTrackIdParam() {
  return ApiParam({ name: 'id', description: "Identifiant de l'annonce" });
}
