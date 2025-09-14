import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthResponseDto, RefreshResponseDto } from '../dto/auth-response.dto';

export function ApiAuthOperation(summary: string) {
  return applyDecorators(ApiOperation({ summary }));
}

export function ApiAuthenticatedOperation(summary: string) {
  return applyDecorators(ApiOperation({ summary }), ApiBearerAuth('JWT-auth'));
}

export function ApiLoginResponse() {
  return applyDecorators(
    ApiResponse({
      status: 200,
      description: 'Utilisateur authentifié avec succès',
      type: AuthResponseDto,
    }),
    ApiResponse({ status: 401, description: 'Identifiants invalides' }),
    ApiResponse({ status: 400, description: "Données d'entrée invalides" }),
  );
}

export function ApiRefreshResponse() {
  return applyDecorators(
    ApiResponse({
      status: 200,
      description: 'Jeton renouvelé avec succès',
      type: RefreshResponseDto,
    }),
    ApiResponse({
      status: 401,
      description: 'Jeton de renouvellement invalide',
    }),
  );
}

export function ApiLogoutResponse() {
  return applyDecorators(
    ApiResponse({
      status: 200,
      description: 'Déconnexion réussie',
      schema: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Déconnexion réussie' },
        },
      },
    }),
    ApiResponse({ status: 401, description: 'Jeton non autorisé' }),
  );
}
