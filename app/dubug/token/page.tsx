// app/debug/tokens/page.tsx
import { cookies } from 'next/headers';
import { StatelessSessionManager } from '@/app/(auth)/lib/token';

export default async function DebugTokensPage() {
  const cookieStore = await cookies();
  const authToken = cookieStore.get('auth-token');
  const refreshToken = cookieStore.get('refresh-token');

  let sessionData = null;
  let refreshResult = null;
  let error = null;

  if (authToken) {
    try {
      sessionData = await StatelessSessionManager.verifySession(authToken.value);
    } catch (e) {
      if (e instanceof Error) {
        error = e.message;
      } else {
        error = String(e);
      }
    }
  }

  if (refreshToken && !sessionData) {
    try {
      refreshResult = await StatelessSessionManager.refreshSession(refreshToken.value);
    } catch (e) {
      if (e instanceof Error) {
        error = e.message;
      } else {
        error = String(e);
      }
    }
  }

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">Token Debug</h1>
      
      <div>
        <h3 className="font-semibold">Auth Token:</h3>
        <p>{authToken ? 'Present' : 'Missing'}</p>
      </div>

      <div>
        <h3 className="font-semibold">Refresh Token:</h3>
        <p>{refreshToken ? 'Present' : 'Missing'}</p>
      </div>

      <div>
        <h3 className="font-semibold">Session Data:</h3>
        <pre className="bg-gray-100 p-2 rounded text-sm">
          {JSON.stringify(sessionData, null, 2)}
        </pre>
      </div>

      <div>
        <h3 className="font-semibold">Refresh Result:</h3>
        <pre className="bg-gray-100 p-2 rounded text-sm">
          {JSON.stringify(refreshResult, null, 2)}
        </pre>
      </div>

      {error && (
        <div>
          <h3 className="font-semibold text-red-600">Error:</h3>
          <p className="text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}
