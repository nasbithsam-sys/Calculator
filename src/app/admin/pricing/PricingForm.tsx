"use client";

import { useActionState } from "react";
import { createPricingConfiguration } from "@/app/actions/admin-pricing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type PricingFormState = { error?: string; success?: boolean } | null;

export function PricingForm() {
  const [state, action, isPending] = useActionState(async (_prevState: PricingFormState, formData: FormData): Promise<PricingFormState> => {
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
          <Label>Purchasing Allowance (%)</Label>
          <Input name="purchasing_allowance_percent" type="number" step="0.1" required defaultValue="15.0" />
        </div>
        <div className="space-y-2">
          <Label>Minimum Installation ($)</Label>
          <Input name="minimum_installation_charge" type="number" step="0.01" required defaultValue="650.00" />
        </div>
      </div>
      
      <h4 className="font-semibold text-sm pt-2">Job Size Thresholds (Linear Feet)</h4>
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Small (≤ ft)</Label>
          <Input name="threshold_small" type="number" defaultValue="100" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Medium (≤ ft)</Label>
          <Input name="threshold_medium" type="number" defaultValue="180" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Large (≤ ft)</Label>
          <Input name="threshold_large" type="number" defaultValue="280" />
        </div>
      </div>

      <h4 className="font-semibold text-sm pt-2">Complexity Band Thresholds (Points)</h4>
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Low (&lt; pts)</Label>
          <Input name="band_low" type="number" defaultValue="20" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Moderate (&lt; pts)</Label>
          <Input name="band_moderate" type="number" defaultValue="45" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">High (&lt; pts)</Label>
          <Input name="band_high" type="number" defaultValue="75" />
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
