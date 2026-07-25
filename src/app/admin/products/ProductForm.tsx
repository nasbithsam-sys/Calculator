"use client";

import { useActionState } from "react";
import { createProduct } from "@/app/actions/admin-products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function ProductForm() {
  const [state, action, isPending] = useActionState(async (prevState: any, formData: FormData) => {
    const result = await createProduct(formData);
    if (result?.error) {
      return { error: result.error };
    }
    return { success: true };
  }, null);

  return (
    <form action={action} className="space-y-4">
      {state?.error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="p-3 bg-green-50 text-green-600 rounded-lg text-sm font-medium">
          Successfully added product.
        </div>
      )}
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

      <Button type="submit" className="w-full mt-4" disabled={isPending}>
        {isPending ? 'Adding...' : 'Add Product'}
      </Button>
    </form>
  );
}
