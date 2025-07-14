export type SSOUser = {
  firstName: string;
  lastName: string;
  fullName: string;
  adsId: string;
  guid: string;
  employeeId: string;
  email: string;
  groups: string[];
};

export type TeamAccess = {
  teamId: string;
  teamName: string;
  role: 'user' | 'admin';
};

export type JWTPayload = {
  user: Omit<SSOUser, 'groups'>;
  teams: TeamAccess[];
  groups: string[];
};

export type AuthResponse = {
  token: string;
  user: SSOUser;
  teams: TeamAccess[];
}; 