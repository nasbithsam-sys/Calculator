import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { CheckCircle2, AlertCircle } from "lucide-react"
import { env } from "@/lib/env"

export default function AdminDashboard() {
  const isSupabaseConfigured = !!env.NEXT_PUBLIC_SUPABASE_URL && !!env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Overview of your Govee Estimate Calculator</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Application Readiness</CardTitle>
            <CardDescription>System integration status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="font-medium">Database (Supabase)</span>
              {isSupabaseConfigured ? (
                <span className="flex items-center text-green-600 text-sm"><CheckCircle2 className="w-4 h-4 mr-1"/> Connected</span>
              ) : (
                <span className="flex items-center text-amber-600 text-sm"><AlertCircle className="w-4 h-4 mr-1"/> Missing Keys</span>
              )}
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="font-medium">Pricing Configuration</span>
              <span className="flex items-center text-amber-600 text-sm"><AlertCircle className="w-4 h-4 mr-1"/> Needs Setup</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="font-medium">Product Catalog</span>
              <span className="flex items-center text-amber-600 text-sm"><AlertCircle className="w-4 h-4 mr-1"/> Needs Setup</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest expert review requests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-slate-500 text-sm">
              No quotes or review requests yet.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
