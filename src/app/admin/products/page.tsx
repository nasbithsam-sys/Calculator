import { getProducts, toggleProductStatus } from "@/app/actions/admin-products";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductForm } from "./ProductForm";

interface ProductCatalogRow {
  id: string;
  name: string;
  model_number: string | null;
  length_feet: number;
  is_active: boolean;
  verification_status: string | null;
}

export default async function ProductsConfigPage() {
  const products = await getProducts() as ProductCatalogRow[];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Product Catalog</h1>
        <p className="text-slate-500 mt-1">Manage verified Govee products, kits, and compatibility.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-4">
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Catalog Items</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                    <tr>
                      <th className="px-4 py-3">Name / Model</th>
                      <th className="px-4 py-3">Length</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Verification</th>
                      <th className="px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.id} className="border-b border-slate-100">
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900">{p.name}</div>
                          <div className="text-slate-500 text-xs">{p.model_number}</div>
                        </td>
                        <td className="px-4 py-3">{p.length_feet} ft</td>
                        <td className="px-4 py-3">
                          <Badge variant={p.is_active ? "default" : "secondary"}>
                            {p.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={p.verification_status === "verified" ? "default" : "destructive"}>
                            {p.verification_status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <form action={async () => {
                            "use server";
                            await toggleProductStatus(p.id, p.is_active);
                          }}>
                            <Button type="submit" variant="outline" size="sm">
                              {p.is_active ? "Deactivate" : "Activate"}
                            </Button>
                          </form>
                        </td>
                      </tr>
                    ))}
                    {products.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                          No products found. Add one below.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
          </div>
        </div>

        <div className="xl:col-span-1">
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Add Verified Product</h2>
            <ProductForm />
          </div>
        </div>
      </div>
    </div>
  )
}
