import { createClient } from "@/utils/supabase/server"
import { notFound } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { revalidatePath } from "next/cache"
import { Textarea } from "@/components/ui/textarea"

export default async function AdminQuoteDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const quoteId = params.id
  const supabase = await createClient()
  
  // Get current user to see if they can claim it
  const { data: { user } } = await supabase.auth.getUser()

  const { data: quote, error } = await supabase
    .from('quotes')
    .select(`
      *,
      customers (*),
      expert_reviews (*),
      quote_measurements (*),
      quote_map_drawings (*),
      uploaded_files (
        *,
        image_annotations (*)
      )
    `)
    .eq('id', quoteId)
    .single()

  if (error || !quote) {
    return notFound()
  }

  const review = quote.expert_reviews?.[0]

  const claimReview = async (formData: FormData) => {
    "use server"
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user && review) {
      const notes = formData.get('notes') as string
      const overridePriceStr = formData.get('override_price') as string
      const finalPrice = overridePriceStr ? Number(overridePriceStr) : (quote.estimated_price_max || quote.estimated_price_min)
      
      await supabase
        .from('expert_reviews')
        .update({ status: 'reviewed', reviewed_by: user.id, notes: notes || review.notes })
        .eq('id', review.id)
        
      await supabase
        .from('quotes')
        .update({ status: 'expert_confirmed', expert_confirmed_price: finalPrice })
        .eq('id', quote.id)
        
      revalidatePath(`/admin/quotes/${quoteId}`)
    }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <Button variant="ghost" asChild className="-ml-4 mb-4">
        <Link href="/admin/quotes">
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Queue
        </Link>
      </Button>

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Quote: {quote.reference_number}</h1>
        <div className="flex items-center gap-2">
          <Badge variant={quote.status === 'expert_confirmed' ? 'default' : 'secondary'}>
            Quote Status: {quote.status}
          </Badge>
          {review && (
            <Badge variant={review.status === 'pending' ? 'destructive' : 'default'}>
              Review: {review.status}
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div><span className="font-semibold">Name:</span> {quote.customers?.name}</div>
            <div><span className="font-semibold">Email:</span> {quote.customers?.email}</div>
            <div><span className="font-semibold">Phone:</span> {quote.customers?.phone || 'N/A'}</div>
            <div><span className="font-semibold">Address:</span> {quote.customers?.street}, {quote.customers?.zip}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Property Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div><span className="font-semibold">Type:</span> {quote.property_type || 'N/A'}</div>
            <div><span className="font-semibold">Stories:</span> {quote.stories || 'N/A'}</div>
            <div><span className="font-semibold">Roof Complexity:</span> {quote.roof_complexity || 'N/A'}</div>
            <div><span className="font-semibold">Estimated Length:</span> {quote.estimated_linear_feet} ft</div>
          </CardContent>
        </Card>
      </div>

      {(quote.quote_measurements?.length > 0 || quote.quote_map_drawings?.length > 0 || quote.uploaded_files?.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Estimation Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {quote.quote_measurements?.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2 text-slate-800">Measurements</h3>
                <div className="bg-slate-50 p-4 rounded-md border border-slate-200">
                  <ul className="space-y-1">
                    {quote.quote_measurements.map((m: any) => (
                      <li key={m.id} className="text-sm flex justify-between border-b pb-1">
                        <span>{m.section_name}</span>
                        <span className="font-medium">{m.length_feet} ft</span>
                      </li>
                    ))}
                    <li className="text-sm flex justify-between font-bold pt-1">
                      <span>Total</span>
                      <span>{quote.quote_measurements.reduce((sum: number, m: any) => sum + Number(m.length_feet), 0)} ft</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {quote.quote_map_drawings?.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2 text-slate-800">Map Drawing Details</h3>
                <div className="bg-slate-50 p-4 rounded-md border border-slate-200 text-sm overflow-auto max-h-40">
                  <pre>{JSON.stringify(quote.quote_map_drawings[0]?.geometry_json, null, 2)}</pre>
                </div>
              </div>
            )}

            {quote.uploaded_files?.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2 text-slate-800">Uploaded Photos & Annotations</h3>
                <div className="grid grid-cols-2 gap-4">
                  {quote.uploaded_files.map((file: any) => (
                    <div key={file.id} className="border p-2 rounded-md bg-white">
                      <div className="text-sm font-medium mb-1 truncate">{file.original_name}</div>
                      <div className="aspect-video bg-slate-100 rounded flex items-center justify-center text-xs text-slate-400">
                        Image via {file.storage_path}
                      </div>
                      {file.image_annotations?.length > 0 && (
                        <div className="mt-2 text-xs text-blue-600 font-medium">
                          Contains {file.image_annotations.length} annotation records
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Expert Review Action</CardTitle>
        </CardHeader>
        <CardContent>
          {review?.status === 'pending' ? (
            <form action={claimReview} className="space-y-4">
              <p className="text-sm text-slate-600">
                This quote requires manual review. Check the provided photos or measurements, adjust the final length/price if necessary, and confirm the quote.
              </p>
              <div className="space-y-2">
                <label className="text-sm font-medium">Final Price Override ($)</label>
                <input 
                  type="number" 
                  name="override_price" 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  defaultValue={quote.estimated_price_max || quote.estimated_price_min} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Internal Notes</label>
                <Textarea name="notes" placeholder="Add notes before confirming..." defaultValue={review.notes || ""} />
              </div>
              <Button type="submit">Confirm & Finalize Quote</Button>
            </form>
          ) : (
            <div className="text-sm text-slate-600">
              This quote has already been reviewed or does not require a review.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
