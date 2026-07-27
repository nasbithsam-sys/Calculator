import { CheckCircle2, AlertCircle, Clock } from "lucide-react"
import { checkApplicationReadiness } from "@/lib/readiness"
import { requireAdmin } from "@/lib/admin"
import Link from "next/link"

interface RecentReviewRow {
  id: string;
  status: string;
  created_at: string;
  quotes?: {
    id?: string;
    reference_number?: string;
    customers?: {
      name?: string;
      email?: string;
    } | null;
  } | null;
}

export default async function AdminDashboard() {
  const readiness = await checkApplicationReadiness();
  const { supabase } = await requireAdmin();
  
  // Fetch recent reviews
  const { data: recentReviews } = await supabase
    .from('expert_reviews')
    .select(`
      id, status, created_at,
      quotes ( reference_number, customers ( name, email ) )
    `)
    .order('created_at', { ascending: false })
    .limit(5);

  // Fetch stats
  const { count: totalQuotes } = await supabase.from('quotes').select('id', { count: 'exact', head: true });
  const { count: pendingReviews } = await supabase.from('expert_reviews').select('id', { count: 'exact', head: true }).eq('status', 'pending');

  const statusRow = (label: string, ok: boolean) => (
    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
      <span className="font-medium">{label}</span>
      {ok ? (
        <span className="flex items-center text-green-600 text-sm font-medium"><CheckCircle2 className="w-4 h-4 mr-1"/> Ready</span>
      ) : (
        <span className="flex items-center text-amber-600 text-sm font-medium"><AlertCircle className="w-4 h-4 mr-1"/> Needs Setup</span>
      )}
    </div>
  );

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Overview of your Govee Estimate Calculator</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="text-sm font-medium text-slate-500">Total Quotes</div>
          <div className="text-3xl font-bold text-slate-900 mt-1">{totalQuotes || 0}</div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="text-sm font-medium text-slate-500">Pending Reviews</div>
          <div className="text-3xl font-bold text-orange-600 mt-1">{pendingReviews || 0}</div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="text-sm font-medium text-slate-500">System Status</div>
          <div className="text-lg font-bold mt-1">
            {readiness.isFullyReady ? (
              <span className="text-green-600 flex items-center"><CheckCircle2 className="w-5 h-5 mr-1"/> All Systems Go</span>
            ) : (
              <span className="text-amber-600 flex items-center"><AlertCircle className="w-5 h-5 mr-1"/> Setup Required</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Readiness */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4">System Readiness</h2>
          <div className="space-y-3">
            {statusRow('Database (Supabase)', readiness.database.connected)}
            {statusRow('Active Pricing', readiness.pricing.hasActiveVersion)}
            {statusRow('Verified Products', readiness.products.hasVerifiedProducts)}
            {statusRow('Photo Storage', readiness.storage.photosBucketExists)}
            {statusRow('Plan Storage', readiness.storage.plansBucketExists)}
            {statusRow('Google Maps', readiness.providers.mapConfigured)}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Recent Activity</h2>
          {recentReviews && recentReviews.length > 0 ? (
            <div className="space-y-3">
              {(recentReviews as RecentReviewRow[]).map((review) => (
                <Link key={review.id} href={`/admin/quotes/${review.quotes?.id || review.id}`} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors">
                  <div>
                    <div className="font-medium text-sm text-slate-900">{review.quotes?.customers?.name || 'Unknown'}</div>
                    <div className="text-xs text-slate-500">{review.quotes?.reference_number}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${review.status === 'pending' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                      {review.status}
                    </span>
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span className="text-xs text-slate-400">{new Date(review.created_at).toLocaleDateString()}</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500 text-sm">
              No review requests yet.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
