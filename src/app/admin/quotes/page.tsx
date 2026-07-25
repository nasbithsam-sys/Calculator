import { createClient } from "@/utils/supabase/server"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function AdminQuotesPage() {
  const supabase = await createClient()

  // Fetch all expert reviews joined with quotes and customers
  const { data: reviews, error } = await supabase
    .from('expert_reviews')
    .select(`
      id,
      status,
      created_at,
      quotes (
        id,
        reference_number,
        estimated_price_min,
        estimated_price_max,
        customers (
          name,
          email
        )
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error("Error fetching reviews:", error)
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Quotes & Reviews</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Expert Review Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                <tr>
                  <th className="px-6 py-3">Reference</th>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Date Submitted</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {reviews?.map((review: any) => (
                  <tr key={review.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {review.quotes?.reference_number}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{review.quotes?.customers?.name}</div>
                      <div className="text-slate-500">{review.quotes?.customers?.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      {new Date(review.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={review.status === 'pending' ? 'destructive' : 'secondary'}>
                        {review.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/quotes/${review.quotes?.id}`}>
                          Review
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
                {(!reviews || reviews.length === 0) && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                      No expert reviews in the queue.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
