"use client"

import { useState } from "react"

import { KPICards } from "@/components/admin/kpi-cards"
import { ModerationQueue } from "@/components/admin/moderation-queue"
import { ActivityLog } from "@/components/admin/activity-log"
import { SecurityAlerts } from "@/components/admin/security-alerts"
import { ReportsSection } from "@/components/admin/reports-section"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ListChecks, Activity, Shield, FileBarChart } from "lucide-react"

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<string>("moderation")

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage listings, monitor activity, and view reports</p>
        </div>

        <KPICards />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
          <TabsList className="w-full grid grid-cols-4 gap-0 p-1 rounded-xl bg-indigo-50/60 dark:bg-slate-800/40 border border-border/60 shadow-sm">
            <TabsTrigger
              value="moderation"
              className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground transition-colors duration-150 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
            >
              <ListChecks className="h-4 w-4" />
              Moderation
            </TabsTrigger>

            <TabsTrigger
              value="activity"
              className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground transition-colors duration-150 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
            >
              <Activity className="h-4 w-4" />
              Activity Log
            </TabsTrigger>

            <TabsTrigger
              value="users"
              className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground transition-colors duration-150 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 data-[state=active]:bg-indigo-600 data-[state=active]:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
            >
              <Shield className="h-4 w-4" />
              Users
            </TabsTrigger>

            <TabsTrigger
              value="reports"
              className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground transition-colors duration-150 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
            >
              <FileBarChart className="h-4 w-4" />
              Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="moderation" className="mt-6">
            <ModerationQueue />
          </TabsContent>

          <TabsContent value="activity" className="mt-6">
            <ActivityLog />
          </TabsContent>

          <TabsContent value="users" className="mt-6">
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
