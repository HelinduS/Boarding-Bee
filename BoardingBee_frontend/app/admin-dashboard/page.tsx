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
            className="
              w-full lg:w-auto inline-flex gap-2 p-1 rounded-xl
              bg-muted/40 border border-border/60 shadow-sm
            "
          >
            <TabsTrigger
              value="moderation"
              className="
                inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium
                text-muted-foreground transition
                hover:bg-muted/70
                data-[state=active]:bg-background data-[state=active]:text-foreground
                data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
              "
            >
              <ListChecks className="h-4 w-4" />
              Moderation
            </TabsTrigger>

            <TabsTrigger
              value="activity"
              className="
                inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium
                text-muted-foreground transition
                hover:bg-muted/70
                data-[state=active]:bg-background data-[state=active]:text-foreground
                data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
              "
            >
              <Activity className="h-4 w-4" />
              Activity Log
            </TabsTrigger>

            <TabsTrigger
              value="security"
              className="
                inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium
                text-muted-foreground transition
                hover:bg-muted/70
                data-[state=active]:bg-background data-[state=active]:text-foreground
                data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
              "
            >
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>

            <TabsTrigger
              value="reports"
              className="
                inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium
                text-muted-foreground transition
                hover:bg-muted/70
                data-[state=active]:bg-background data-[state=active]:text-foreground
                data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
              "
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
