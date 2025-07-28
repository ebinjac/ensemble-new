"use client"

import type React from "react"

import Link from "next/link"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { applications } from "@/db/schema/teams"
import { useState, useMemo } from "react"
import {
  Pencil,
  Trash2,
  RefreshCw,
  Loader2,
  Eye,
  Building2,
  Users,
  Hash,
  MessageSquare,
  Settings,
  Search,
  X,
} from "lucide-react"
import { updateApplication, deleteApplication, refreshApplication } from "@/app/actions/applications"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Separator } from "@/components/ui/separator"

interface ApplicationsListProps {
  applications: (typeof applications.$inferSelect)[]
}

export default function ApplicationsList({ applications }: ApplicationsListProps) {
  const [editId, setEditId] = useState<string | null>(null)
  const [editData, setEditData] = useState<any>({})
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [refreshingId, setRefreshingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteDialogId, setDeleteDialogId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  // Filter applications based on search term
  const filteredApplications = useMemo(() => {
    if (!searchTerm.trim()) return applications

    const searchLower = searchTerm.toLowerCase().trim()
    return applications.filter(
      (app) =>
        app.applicationName.toLowerCase().includes(searchLower) ||
        (app.description && app.description.toLowerCase().includes(searchLower)) ||
        app.tla.toLowerCase().includes(searchLower) ||
        app.carId.toLowerCase().includes(searchLower),
    )
  }, [applications, searchTerm])

  const handleEdit = (app: any) => {
    setEditId(app.id)
    setEditData({ ...app })
  }

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditData({ ...editData, [e.target.name]: e.target.value })
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoadingId(editId)
    const { id, carId, teamId, ...updateFields } = editData
    const result = await updateApplication(editId!, updateFields)
    if (result.success) {
      toast.success("Application updated")
      setEditId(null)
    } else {
      toast.error(result.error || "Failed to update application")
    }
    setLoadingId(null)
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    const result = await deleteApplication(id)
    if (result.success) {
      toast.success("Application deleted")
    } else {
      toast.error(result.error || "Failed to delete application")
    }
    setDeletingId(null)
    setDeleteDialogId(null)
  }

  const handleRefresh = async (id: string) => {
    setRefreshingId(id)
    const result = await refreshApplication(id)
    if (result.success) {
      toast.success("Application refreshed")
    } else {
      toast.error(result.error || "Failed to refresh application")
    }
    setRefreshingId(null)
  }

  const clearSearch = () => {
    setSearchTerm("")
  }

    return (
    <div className="space-y-6">
      {/* Search Section */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardContent >
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search applications by name, description, TLA, or CAR ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10 h-11 bg-background/80 backdrop-blur-sm border-primary/20 focus:border-primary/40 focus:ring-primary/20"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted/80"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          {searchTerm && (
            <p className="text-center text-sm text-muted-foreground mt-3">
              {filteredApplications.length} of {applications.length} applications found
            </p>
          )}
        </CardContent>
      </Card>

      {/* Applications Grid */}
      {applications.length === 0 ? (
        <Card className="border-dashed border-2 border-muted-foreground/25">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
              <Building2 className="w-8 h-8 text-muted-foreground" />
            </div>
            <CardTitle className="text-xl mb-2 text-muted-foreground">No applications yet</CardTitle>
            <CardDescription className="max-w-sm">
              Create your first application to get started managing your portfolio
            </CardDescription>
          </CardContent>
        </Card>
      ) : filteredApplications.length === 0 ? (
        <Card className="border-dashed border-2 border-muted-foreground/25">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <CardTitle className="text-xl mb-2 text-muted-foreground">No applications found</CardTitle>
            <CardDescription className="max-w-sm mb-4">
              No applications match your search criteria. Try adjusting your search terms.
            </CardDescription>
            <Button variant="outline" onClick={clearSearch} className="mt-2 bg-transparent">
              <X className="w-4 h-4 mr-2" />
              Clear search
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredApplications.map((app) => (
            <Card
              key={app.id}
              className="group hover:shadow-xl transition-all duration-300 border-border/50 shadow-sm hover:scale-[1.02] bg-card hover:bg-accent/5"
            >
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-xl font-bold truncate mb-2 group-hover:text-primary transition-colors">
                      {app.applicationName}
                    </CardTitle>
                    <CardDescription className="text-sm leading-relaxed line-clamp-2">
                  {app.description || "No description provided"}
                </CardDescription>
              </div>
                  <Badge
                    variant={app.status === "active" ? "default" : "secondary"}
                    className={`shrink-0 font-medium ${
                      app.status === "active"
                        ? "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                {app.status}
              </Badge>
            </div>
          </CardHeader>

              <CardContent className="space-y-6">
                {/* Application Details */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border/50">
                      <Hash className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">CAR ID</p>
                        <p className="text-sm font-mono truncate text-foreground">{app.carId}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border/50">
                      <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">TLA</p>
                        <p className="text-sm font-semibold truncate text-foreground">{app.tla}</p>
                      </div>
                </div>
                </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tier</span>
                </div>
                    <Badge variant="outline" className="font-bold border-primary/20 text-primary">
                      Tier {app.tier}
                    </Badge>
                  </div>

                {app.slackChannel && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-800/50">
                      <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <div>
                        <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                          Slack Channel
                        </p>
                        <p className="text-sm font-mono text-blue-800 dark:text-blue-200">#{app.slackChannel}</p>
                      </div>
                  </div>
                )}
              </div>
              
                <Separator className="bg-border/50" />

                {/* Action Buttons */}
                <div className="flex flex-col gap-3">
                  <div className="flex gap-2">
                    <Dialog
                      open={editId === app.id}
                      onOpenChange={(open) => {
                        if (!open) setEditId(null)
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(app)}
                          className="flex-1 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 dark:hover:bg-blue-950/50 dark:hover:border-blue-800/50 dark:hover:text-blue-400"
                        >
                          <Pencil className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            Edit Application
                          </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleEditSubmit} className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-foreground">Application Name</label>
                              <Input
                                name="applicationName"
                                value={editData.applicationName || ""}
                                onChange={handleEditChange}
                                required
                                className="focus:ring-2 focus:ring-primary/20 focus:border-primary"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-foreground">TLA</label>
                              <Input
                                name="tla"
                                value={editData.tla || ""}
                                onChange={handleEditChange}
                                required
                                className="focus:ring-2 focus:ring-primary/20 focus:border-primary"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-foreground">Tier</label>
                              <Input
                                name="tier"
                                type="number"
                                value={editData.tier || ""}
                                onChange={handleEditChange}
                                required
                                className="focus:ring-2 focus:ring-primary/20 focus:border-primary"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-foreground">Slack Channel</label>
                              <Input
                                name="slackChannel"
                                value={editData.slackChannel || ""}
                                onChange={handleEditChange}
                                className="focus:ring-2 focus:ring-primary/20 focus:border-primary"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Description</label>
                            <Input
                              name="description"
                              value={editData.description || ""}
                              onChange={handleEditChange}
                              className="focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            />
                          </div>

                          <Separator />

                          <div className="space-y-4">
                            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                              Contact Information
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">VP Name</label>
                                <Input
                                  name="vpName"
                                  value={editData.vpName || ""}
                                  onChange={handleEditChange}
                                  className="focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">VP Email</label>
                                <Input
                                  name="vpEmail"
                                  type="email"
                                  value={editData.vpEmail || ""}
                                  onChange={handleEditChange}
                                  className="focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Director Name</label>
                                <Input
                                  name="directorName"
                                  value={editData.directorName || ""}
                                  onChange={handleEditChange}
                                  className="focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Director Email</label>
                                <Input
                                  name="directorEmail"
                                  type="email"
                                  value={editData.directorEmail || ""}
                                  onChange={handleEditChange}
                                  className="focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">ServiceNow Group</label>
                            <Input
                              name="snowGroup"
                              value={editData.snowGroup || ""}
                              onChange={handleEditChange}
                              className="focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            />
                          </div>

                          <div className="flex justify-end gap-3 pt-4 border-t border-border">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setEditId(null)}
                              disabled={loadingId === app.id}
                            >
                              Cancel
                            </Button>
                            <Button type="submit" disabled={loadingId === app.id}>
                              {loadingId === app.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                              Save Changes
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRefresh(app.id)}
                      disabled={refreshingId === app.id}
                      className="hover:bg-green-50 hover:border-green-200 hover:text-green-700 dark:hover:bg-green-950/50 dark:hover:border-green-800/50 dark:hover:text-green-400"
                    >
                      {refreshingId === app.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDeleteDialogId(app.id)}
                      disabled={deletingId === app.id}
                      className="hover:bg-red-50 hover:border-red-200 hover:text-red-700 dark:hover:bg-red-950/50 dark:hover:border-red-800/50 dark:hover:text-red-400"
                    >
                      {deletingId === app.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>

                    <Dialog
                      open={deleteDialogId === app.id}
                      onOpenChange={(open) => {
                        if (!open) setDeleteDialogId(null)
                      }}
                    >
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2 text-destructive">
                            <Trash2 className="w-5 h-5" />
                            Delete Application
                          </DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                          <p className="text-muted-foreground">
                            Are you sure you want to delete{" "}
                            <span className="font-semibold text-foreground">{app.applicationName}</span>? This action
                            cannot be undone.
                          </p>
                        </div>
                        <div className="flex justify-end gap-3 pt-4 border-t border-border">
                          <Button
                            variant="outline"
                            onClick={() => setDeleteDialogId(null)}
                            disabled={deletingId === app.id}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => handleDelete(app.id)}
                            disabled={deletingId === app.id}
                          >
                            {deletingId === app.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Delete Application
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <Link href={`/applications/${app.id}`} className="w-full">
                    <Button variant="default" className="w-full shadow-sm hover:shadow-md transition-all duration-200">
                      <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                </Link>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
      )}
    </div>
  )
} 
