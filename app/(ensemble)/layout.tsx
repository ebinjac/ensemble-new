
import { Header } from "@/components/home/header";
import { Suspense } from "react";
import { getServerUser } from "@/app/(auth)/lib/auth";

// This is the server component that fetches the data
async function AuthDataProvider() {
  const { user, isAuthenticated } = await getServerUser(false);

  // Convert the JWT payload to the format expected by the Header component
  const headerUser = user ? {
    name: user.user.fullName,
    email: user.user.email,
    image: undefined, // Add profile image handling if needed
  } : undefined;

  // Convert teams from JWT payload to the format expected by Header
  const teams = user?.teams.map(team => ({
    id: team.teamId,
    name: team.teamName,
  }));

  return <Header user={headerUser} teams={teams} />;
}

export default function EnsembleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <Suspense fallback={<Header />}>
        <AuthDataProvider />
      </Suspense>
      <main className="flex-1 w-full">
        {children}
      </main>
    </div>
  );
}