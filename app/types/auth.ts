export type SSOUser = {
  attributes: {
    firstName: string;
    lastName: string;
    fullName: string;
    adsId: string;
    guid: string;
    employeeId: string;
    email: string;
    groups: string[];
  };
};

export type TeamAccess = {
  teamId: string;
  teamName: string;
  role: 'user' | 'admin';
};

export type JWTPayload = {
  data: string; // Encrypted session data
  jti?: string; // Session ID
  iat?: number; // Issued at
  exp?: number; // Expiration time
};

export type AuthResponse = {
  user: SSOUser;
  teams: TeamAccess[];
  expiresAt: number;
}; 