"use client"

import { useState } from "react"

// Your existing sections
import { KPICards } from "@/components/admin/kpi-cards"
import { ModerationQueue } from "@/components/admin/moderation-queue"
import { ActivityLog } from "@/components/admin/activity-log"
import { SecurityAlerts } from "@/components/admin/security-alerts"
import { ReportsSection } from "@/components/admin/reports-section"

// If you’re using shadcn/ui, make sure the path below matches your setup
// e.g. "@/components/ui/tabs" or "../../components/ui/tabs"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Icons (Lucide)
import { ListChecks, Activity, Shield, FileBarChart } from "lucide-react"

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("moderation")

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage listings, monitor activity, and view reports
          </p>
        </div>

        <KPICards />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
          {/* Tabs list (pill style) */}
          <TabsList
              className="w-full grid grid-cols-4 gap-0 p-1 rounded-xl bg-muted/40 border border-border/60 shadow-sm"
            >
            <TabsTrigger
              value="moderation"
              className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground transition hover:bg-muted/70 rounded-lg data-[state=active]:bg-white data-[state=active]:text-foreground focus-visible:outline-none"
            >
              <ListChecks className="h-4 w-4" />
              Moderation
            </TabsTrigger>

            <TabsTrigger
              value="activity"
              className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground transition hover:bg-muted/70 rounded-lg data-[state=active]:bg-white data-[state=active]:text-foreground focus-visible:outline-none"
            >
              <Activity className="h-4 w-4" />
              Activity Log
            </TabsTrigger>

            <TabsTrigger
              value="security"
              className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground transition hover:bg-muted/70 rounded-lg data-[state=active]:bg-white data-[state=active]:text-foreground focus-visible:outline-none"
            >
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>

            <TabsTrigger
              value="reports"
              className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground transition hover:bg-muted/70 rounded-lg data-[state=active]:bg-white data-[state=active]:text-foreground focus-visible:outline-none"
            >
              <FileBarChart className="h-4 w-4" />
              Reports
            </TabsTrigger>
          </TabsList>

          {/* Panels */}
          <TabsContent value="moderation" className="mt-6">
            <ModerationQueue />
          </TabsContent>

          <TabsContent value="activity" className="mt-6">
            <ActivityLog />
          </TabsContent>

          <TabsContent value="security" className="mt-6">
            <SecurityAlerts />
          </TabsContent>

          <TabsContent value="reports" className="mt-6">
            <ReportsSection />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
