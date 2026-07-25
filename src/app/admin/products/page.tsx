import { getProducts, createProduct, toggleProductStatus } from "@/app/actions/admin-products";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default async function ProductsConfigPage() {
  const products = await getProducts();

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Product Catalog</h1>
        <p className="text-slate-500 mt-1">Manage verified Govee products, kits, and compatibility.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Catalog Items</CardTitle>
            </CardHeader>
            <CardContent>
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
                    {products.map((p: any) => (
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
            </CardContent>
          </Card>
        </div>

        <div className="xl:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Add Verified Product</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={async (formData) => {
                "use server";
                await createProduct(formData);
              }} className="space-y-4">
                <div className="space-y-2">
                  <Label>Product Name</Label>
                  <Input name="name" required placeholder="Govee Permanent Lights Pro" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Model Number</Label>
                    <Input name="model_number" required placeholder="H706A" />
                  </div>
                  <div className="space-y-2">
                    <Label>Length (ft)</Label>
                    <Input name="length_feet" type="number" required placeholder="100" />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Family</Label>
                    <Input name="product_family" placeholder="Pro" />
                  </div>
                  <div className="space-y-2">
                    <Label>Generation</Label>
                    <Input name="generation" placeholder="Gen 2" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Max Connect (ft)</Label>
                    <Input name="max_connected_length" type="number" defaultValue="150" />
                  </div>
                  <div className="space-y-2">
                    <Label>Est. Retail Price ($)</Label>
                    <Input name="price" type="number" step="0.01" required defaultValue="399.99" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Verification Status</Label>
                  <Select name="verification_status" defaultValue="verified">
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="verified">Verified</SelectItem>
                      <SelectItem value="unverified">Unverified</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <input type="hidden" name="is_active" value="true" />
                <input type="hidden" name="catalog_version" value="2024.1" />

                <Button type="submit" className="w-full mt-4">Add Product</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
