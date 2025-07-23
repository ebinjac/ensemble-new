// app/(auth)/lib/token-manager.ts
import { SignJWT, jwtVerify } from 'jose';
import CryptoJS from 'crypto-js';
import { z } from 'zod';

// Only import team utils if not in Edge Runtime
let getUserTeamAccess: (() => any) | null = null;

if (typeof (globalThis as any).EdgeRuntime === 'undefined') {
  try {
    // Use dynamic import for better compatibility and type safety
    // Note: This must remain sync for legacy reasons, so require is used
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const teamUtilsModule = require('./team-utils');
    getUserTeamAccess = teamUtilsModule.getUserTeamAccess;
  } catch (error) {
    console.warn('Team utils import failed - running in restricted environment');
  }
}

// Environment validation
const envSchema = z.object({
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  SESSION_ENCRYPTION_KEY: z.string().min(32, 'SESSION_ENCRYPTION_KEY must be at least 32 characters'),
});

console.log('🔍 Validating environment variables...');
let env: { JWT_SECRET: string; JWT_REFRESH_SECRET: string; SESSION_ENCRYPTION_KEY: string; };
try {
  env = envSchema.parse(process.env);
  console.log('✅ Environment variables validated successfully');
} catch (error) {
  console.error('❌ Environment variable validation failed:', error);
  throw new Error('Missing or invalid environment variables for JWT');
}

const JWT_SECRET = new TextEncoder().encode(env.JWT_SECRET);
const JWT_REFRESH_SECRET = new TextEncoder().encode(env.JWT_REFRESH_SECRET);

export type SessionPayload = {
  user: {
    firstName: string;
    lastName: string;
    fullName: string;
    adsId: string;
    guid: string;
    employeeId: string;
    email: string;
  };
  teams: Array<{
    teamId: string;
    teamName: string;
    role: 'admin' | 'user';
  }>;
  sessionId: string;
  lastActivity: number;
  deviceInfo?: string;
  ipAddress?: string;
};

export type RefreshTokenPayload = {
  sessionId: string;
  userId: string;
  userContext: {
    firstName: string;
    lastName: string;
    fullName: string;
    adsId: string;
    guid: string;
    employeeId: string;
    email: string;
    groups: string[];
    deviceInfo?: string;
  };
};

export class StatelessSessionManager {
  private static readonly ACCESS_TOKEN_EXPIRES = '15m';
  private static readonly REFRESH_TOKEN_EXPIRES = '7d';
  private static readonly SESSION_TIMEOUT = 8 * 60 * 60 * 1000; // 8 hours in ms

  // Encrypt session data before storing in JWT
  private static encryptSessionData(data: SessionPayload): string {
    try {
      const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), env.SESSION_ENCRYPTION_KEY).toString();
      console.log('🔐 Session data encrypted successfully');
      return encrypted;
    } catch (error) {
      console.error('❌ Failed to encrypt session data:', error);
      throw new Error('Session encryption failed');
    }
  }

  // Decrypt session data from JWT
  private static decryptSessionData(encryptedData: string): SessionPayload | null {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, env.SESSION_ENCRYPTION_KEY);
      const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
      const parsed = JSON.parse(decryptedData);
      console.log('🔓 Session data decrypted successfully');
      return parsed;
    } catch (error) {
      console.error('❌ Failed to decrypt session data:', error);
      return null;
    }
  }

  static async createSession(sessionData: Omit<SessionPayload, 'sessionId' | 'lastActivity'>): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
  }> {
    try {
      const sessionId = CryptoJS.lib.WordArray.random(32).toString();
      const now = Date.now();
      
      console.log('🔐 Creating session for user:', sessionData.user.email);
      
      const payload: SessionPayload = {
        ...sessionData,
        sessionId,
        lastActivity: now,
      };

      // Encrypt the session payload
      const encryptedPayload = this.encryptSessionData(payload);

      // Create refresh token payload with user context
      const refreshTokenPayload: RefreshTokenPayload = {
        sessionId,
        userId: sessionData.user.email,
        userContext: {
          firstName: sessionData.user.firstName,
          lastName: sessionData.user.lastName,
          fullName: sessionData.user.fullName,
          adsId: sessionData.user.adsId,
          guid: sessionData.user.guid,
          employeeId: sessionData.user.employeeId,
          email: sessionData.user.email,
          groups: sessionData.teams.map(team => team.teamName),
          deviceInfo: sessionData.deviceInfo,
        }
      };

      console.log('🔑 Creating JWT tokens...');

      const [accessToken, refreshToken] = await Promise.all([
        new SignJWT({ data: encryptedPayload })
          .setProtectedHeader({ alg: 'HS256' })
          .setIssuedAt()
          .setExpirationTime(this.ACCESS_TOKEN_EXPIRES)
          .setJti(sessionId)
          .sign(JWT_SECRET),
        
        new SignJWT(refreshTokenPayload)
          .setProtectedHeader({ alg: 'HS256' })
          .setIssuedAt()
          .setExpirationTime(this.REFRESH_TOKEN_EXPIRES)
          .sign(JWT_REFRESH_SECRET)
      ]);

      console.log('✅ JWT tokens created successfully');

      return {
        accessToken,
        refreshToken,
        expiresAt: now + (15 * 60 * 1000), // 15 minutes
      };
    } catch (error) {
      if (error instanceof Error) {
        console.error('❌ Failed to create session:', error);
        throw new Error(`Session creation failed: ${error.message}`);
      } else {
        console.error('❌ Failed to create session:', error);
        throw new Error('Session creation failed: Unknown error');
      }
    }
  }

  static async verifySession(token: string): Promise<SessionPayload | null> {
    try {
      console.log('🔍 Verifying session token...');
      
      const { payload } = await jwtVerify(token, JWT_SECRET);
      const encryptedData = payload.data as string;
      
      if (!encryptedData) {
        console.error('❌ No encrypted data in token');
        return null;
      }
      
      const sessionData = this.decryptSessionData(encryptedData);
      if (!sessionData) {
        console.error('❌ Failed to decrypt session data');
        return null;
      }

      // Check if session has expired
      const now = Date.now();
      if (now - sessionData.lastActivity > this.SESSION_TIMEOUT) {
        console.error('❌ Session has expired due to inactivity');
        return null;
      }

      console.log('✅ Session verified successfully for user:', sessionData.user.email);
      return sessionData;
    } catch (error) {
      console.error('❌ Session verification failed:', error);
      return null;
    }
  }

  static async refreshSession(refreshToken: string): Promise<{
    accessToken: string;
    expiresAt: number;
  } | null> {
    try {
      console.log('🔄 Starting session refresh...');
      
      // Verify and decode refresh token
      const { payload } = await jwtVerify(refreshToken, JWT_REFRESH_SECRET);
      const refreshPayload = payload as unknown as RefreshTokenPayload;
      
      const { sessionId, userId, userContext } = refreshPayload;
      
      console.log('🔍 Refresh token verified for user:', userId);

      // Get current team access using stored groups (if available)
      let teams = [];
      if (getUserTeamAccess) {
        console.log('👥 Fetching current team access for groups:', userContext.groups);
        teams = await getUserTeamAccess();
      } else {
        console.warn('⚠️ Database unavailable - using cached team data from refresh token');
        // Fallback: reconstruct teams from refresh token groups
        teams = userContext.groups.map((groupName: string) => ({
          teamId: `fallback-${groupName}`,
          teamName: groupName,
          role: 'user' as const
        }));
      }

      // Reconstruct session data
      const sessionData: SessionPayload = {
        user: {
          firstName: userContext.firstName,
          lastName: userContext.lastName,
          fullName: userContext.fullName,
          adsId: userContext.adsId,
          guid: userContext.guid,
          employeeId: userContext.employeeId,
          email: userContext.email,
        },
        teams,
        sessionId,
        lastActivity: Date.now(),
        deviceInfo: userContext.deviceInfo,
      };

      // Create new access token
      const encryptedPayload = this.encryptSessionData(sessionData);
      const now = Date.now();

      const newAccessToken = await new SignJWT({ data: encryptedPayload })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(this.ACCESS_TOKEN_EXPIRES)
        .setJti(sessionId)
        .sign(JWT_SECRET);

      console.log('✅ New access token created successfully');

      return {
        accessToken: newAccessToken,
        expiresAt: now + (15 * 60 * 1000), // 15 minutes
      };
    } catch (error) {
      console.error('❌ Session refresh failed:', error);
      return null;
    }
  }

  static async updateSession(currentToken: string, updates: Partial<SessionPayload>): Promise<string | null> {
    try {
      const currentSession = await this.verifySession(currentToken);
      if (!currentSession) return null;

      const updatedSession = { 
        ...currentSession, 
        ...updates, 
        lastActivity: Date.now() 
      };
      
      const encryptedPayload = this.encryptSessionData(updatedSession);

      const newToken = await new SignJWT({ data: encryptedPayload })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(this.ACCESS_TOKEN_EXPIRES)
        .setJti(updatedSession.sessionId)
        .sign(JWT_SECRET);

      return newToken;
    } catch (error) {
      console.error('❌ Session update failed:', error);
      return null;
    }
  }
}
