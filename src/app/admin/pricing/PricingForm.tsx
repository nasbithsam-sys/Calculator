"use client";

import { useActionState } from "react";
import { createPricingConfiguration } from "@/app/actions/admin-pricing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PricingForm() {
  const [state, action, isPending] = useActionState(async (prevState: any, formData: FormData) => {
    const result = await createPricingConfiguration(formData);
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
          Successfully created new version.
        </div>
      )}
      <div className="space-y-2">
        <Label>Version Name (e.g. 2024-Q3)</Label>
        <Input name="version" required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Base Labor ($/ft)</Label>
          <Input name="base_labor_price_per_foot" type="number" step="0.01" required defaultValue="5.00" />
        </div>
        <div className="space-y-2">
          <Label>Minimum Charge ($)</Label>
          <Input name="minimum_installation_charge" type="number" step="0.01" required defaultValue="250.00" />
        </div>
      </div>
      
      <h4 className="font-semibold text-sm pt-2">Multipliers</h4>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>2-Story</Label>
          <Input name="two_story_multiplier" type="number" step="0.01" required defaultValue="1.15" />
        </div>
        <div className="space-y-2">
          <Label>3-Story</Label>
          <Input name="three_story_multiplier" type="number" step="0.01" required defaultValue="1.30" />
        </div>
        <div className="space-y-2">
          <Label>Moderate Roof</Label>
          <Input name="moderate_roof_multiplier" type="number" step="0.01" required defaultValue="1.10" />
        </div>
        <div className="space-y-2">
          <Label>Complex Roof</Label>
          <Input name="complex_roof_multiplier" type="number" step="0.01" required defaultValue="1.25" />
        </div>
      </div>

      <h4 className="font-semibold text-sm pt-2">Flat Charges & Allowances</h4>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Peak Charge ($)</Label>
          <Input name="peak_charge" type="number" step="0.01" defaultValue="50.00" />
        </div>
        <div className="space-y-2">
          <Label>Access Charge ($)</Label>
          <Input name="difficult_access_charge" type="number" step="0.01" defaultValue="0" />
        </div>
        <div className="space-y-2">
          <Label>Purchasing Allowance (%)</Label>
          <Input name="purchasing_allowance_percent" type="number" step="0.1" defaultValue="10" />
        </div>
        <div className="space-y-2">
          <Label>Uncertainty Range (%)</Label>
          <Input name="estimate_uncertainty_percent" type="number" step="0.1" defaultValue="5" />
        </div>
      </div>

      <Button type="submit" className="w-full mt-4" disabled={isPending}>
        {isPending ? 'Creating...' : 'Create Version'}
      </Button>
    </form>
  );
}
