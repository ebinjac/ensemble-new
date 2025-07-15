
import { getServerUser } from "@/lib/auth"
import { getAllTeams } from "@/app/actions/teams"
import { Hero } from "@/components/home/hero"


export default async function Page() {
  const { user, isAuthenticated } = await getServerUser(false)
  const teams = isAuthenticated ? await getAllTeams() : []
  const userTeams = teams.filter((team) => user?.teams?.some((userTeam) => userTeam.teamId === team.id))

  return (
   <>
  <Hero />
   </>
  )
}
