import { getPricingConfigurations, createPricingConfiguration, activatePricingConfiguration } from "@/app/actions/admin-pricing";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function PricingConfigPage() {
  const configs = await getPricingConfigurations();

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Pricing Configuration</h1>
        <p className="text-slate-500 mt-1">Manage base labor rates, complexity multipliers, and minimums.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Existing Versions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                    <tr>
                      <th className="px-4 py-3">Version</th>
                      <th className="px-4 py-3">Base / ft</th>
                      <th className="px-4 py-3">Minimum</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {configs.map((c: any) => (
                      <tr key={c.id} className="border-b border-slate-100">
                        <td className="px-4 py-3 font-medium text-slate-900">{c.version}</td>
                        <td className="px-4 py-3">${c.base_labor_price_per_foot}</td>
                        <td className="px-4 py-3">${c.minimum_installation_charge}</td>
                        <td className="px-4 py-3">
                          <Badge variant={c.active ? "default" : "secondary"}>
                            {c.active ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          {!c.active && (
                            <form action={async () => {
                              "use server";
                              await activatePricingConfiguration(c.id);
                            }}>
                              <Button type="submit" variant="outline" size="sm">Activate</Button>
                            </form>
                          )}
                        </td>
                      </tr>
                    ))}
                    {configs.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                          No pricing configurations exist. Create one below.
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
              <CardTitle>Create New Version</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={createPricingConfiguration} className="space-y-4">
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

                <Button type="submit" className="w-full mt-4">Create Version</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
