import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, BarChart3, Users, Bell, Zap, Shield, Clock } from "lucide-react"
import NextLink from "next/link"
import { getServerUser } from "@/lib/auth"
import { getAllTeams } from "@/app/actions/teams"

export default async function Page() {
  const { user, isAuthenticated } = await getServerUser(false)
  const teams = isAuthenticated ? await getAllTeams() : []
  const userTeams = teams.filter((team) => user?.teams?.some((userTeam) => userTeam.teamId === team.id))

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="container flex h-16 items-center">
          <div className="mr-4 flex">
            <NextLink href="/" className="mr-6 flex items-center space-x-2">
              <div className="h-8 w-8 rounded bg-primary" />
              <span className="font-bold text-xl">Ensemble</span>
            </NextLink>
          </div>
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <nav className="flex items-center space-x-6 text-sm font-medium">
              <NextLink href="#features" className="transition-colors hover:text-foreground/80 text-foreground/60">
                Features
              </NextLink>
              <NextLink href="#teams" className="transition-colors hover:text-foreground/80 text-foreground/60">
                My Teams
              </NextLink>
              <NextLink href="#onboarding" className="transition-colors hover:text-foreground/80 text-foreground/60">
                Onboarding
              </NextLink>
            </nav>
            {isAuthenticated ? (
              <Badge variant="outline" className="ml-4">
                {user?.user?.fullName}
              </Badge>
            ) : (
              <Button size="sm" className="ml-4">
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="container space-y-6 py-8 md:py-12 lg:py-32">
          <div className="mx-auto flex max-w-[980px] flex-col items-center gap-2 text-center">
            <Badge variant="outline" className="mb-4">
              <Zap className="mr-1 h-3 w-3" />
              Welcome to Your Engineering Hub
            </Badge>
            <h1 className="text-3xl font-bold leading-tight tracking-tighter md:text-6xl lg:leading-[1.1]">
              {isAuthenticated
                ? `Welcome Back, ${user?.user?.fullName?.split(" ")[0]}`
                : "Ensemble – Your Engineering Command Center"}
            </h1>
            <p className="max-w-[750px] text-lg text-muted-foreground sm:text-xl">
              {isAuthenticated
                ? "Manage your teams, track metrics, and streamline workflows - all in one place."
                : "Join your engineering teams and access all tools through a unified portal."}
            </p>
            <div className="flex gap-4 mt-8">
              {isAuthenticated ? (
                <Button size="lg" className="h-11 px-8" asChild>
                  <NextLink href="/teams">
                    View My Teams
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </NextLink>
                </Button>
              ) : (
                <Button size="lg" className="h-11 px-8">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* My Teams Section */}
        {isAuthenticated && userTeams.length > 0 && (
          <section id="teams" className="container space-y-6 py-8 md:py-12 lg:py-24 bg-muted/30">
            <div className="mx-auto flex max-w-[980px] flex-col items-center gap-4 text-center">
              <h2 className="text-3xl font-bold leading-tight tracking-tighter md:text-5xl">Your Teams</h2>
              <p className="max-w-[700px] text-lg text-muted-foreground">
                Quick access to your team dashboards and tools
              </p>
            </div>
            <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3">
              {userTeams.map((team) => (
                <Card key={team.id} className="transition-all hover:shadow-lg">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                    <CardTitle className="text-xl">{team.teamName}</CardTitle>
                    <CardDescription>{team.userGroup}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button size="sm" className="w-full" asChild>
                      <NextLink href={`/teams/${team.id}`}>View Dashboard</NextLink>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Onboarding Process Section */}
        <section id="onboarding" className="container space-y-6 py-8 md:py-12 lg:py-24">
          <div className="mx-auto grid justify-center gap-4 md:max-w-[64rem] md:grid-cols-2 lg:gap-12">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <Badge variant="outline" className="w-fit">
                  <Users className="mr-1 h-3 w-3" />
                  Team Onboarding
                </Badge>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Join or Create Teams</h2>
                <p className="text-muted-foreground md:text-lg">
                  Simple three-step process to get your team up and running with Ensemble
                </p>
              </div>
              <div className="space-y-4 mt-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold">Register Your Team</h3>
                    <p className="text-sm text-muted-foreground">
                      Fill out the team registration form with your team details and AD groups
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold">Approval Process</h3>
                    <p className="text-sm text-muted-foreground">
                      Admin review and approval of your team registration request
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold">Access Your Dashboard</h3>
                    <p className="text-sm text-muted-foreground">
                      Once approved, access your team's customized dashboard and tools
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex gap-4 mt-6">
                <Button asChild>
                  <NextLink href="/teams/register">
                    Register New Team
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </NextLink>
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <Card className="w-full max-w-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Available Tools
                  </CardTitle>
                  <CardDescription>Access these tools after onboarding</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <BarChart3 className="h-4 w-4 text-primary" />
                      <span>Team Metrics Dashboard</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Bell className="h-4 w-4 text-primary" />
                      <span>Notification Management</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-primary" />
                      <span>Shift Handover Tools</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Zap className="h-4 w-4 text-primary" />
                      <span>Quick Actions</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
            <div className="h-6 w-6 rounded bg-primary" />
            <span className="font-bold">Ensemble</span>
            <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
              Your Engineering Command Center
            </p>
          </div>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <NextLink href="/docs" className="hover:text-foreground transition-colors">
              Documentation
            </NextLink>
            <NextLink href="/support" className="hover:text-foreground transition-colors">
              Support
            </NextLink>
          </div>
        </div>
      </footer>
    </div>
  )
}
