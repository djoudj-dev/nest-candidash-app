import {
  User,
  UserSafe,
  AuthResult,
  LoginResponse,
  RefreshResponse,
} from '../interfaces';

export class AuthMapper {
  /**
   * Supprime le mot de passe et les informations sensibles de l'objet utilisateur
   */
  static mapUserToSafe(user: User): UserSafe {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Convertit une AuthResult complète en LoginResponse (pour l'API)
   */
  static mapAuthResultToLoginResponse(authResult: AuthResult): LoginResponse {
    return {
      access_token: authResult.access_token,
      user: authResult.user,
    };
  }

  /**
   * Extrait uniquement l'access token pour les réponses de refresh
   */
  static mapAuthResultToRefreshResponse(
    authResult: AuthResult,
  ): RefreshResponse {
    return {
      access_token: authResult.access_token,
    };
  }

  /**
   * Crée une réponse de déconnexion standardisée
   */
  static createLogoutResponse(message: string): { message: string } {
    return { message };
  }
}
