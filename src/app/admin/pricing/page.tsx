import { getPricingConfigurations, activatePricingConfiguration } from "@/app/actions/admin-pricing";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PricingForm } from "./PricingForm";

interface PricingConfigurationRow {
  id: string;
  version: string;
  base_labor_price_per_foot: number;
  minimum_installation_charge: number;
  active: boolean;
}

export default async function PricingConfigPage() {
  const configs = await getPricingConfigurations() as PricingConfigurationRow[];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Pricing Configuration</h1>
        <p className="text-slate-500 mt-1">Manage base labor rates, complexity multipliers, and minimums.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-4">
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Existing Versions</h2>
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
                    {configs.map((c) => (
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
          </div>
        </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Create New Version</h2>
            <PricingForm />
          </div>
      </div>
    </div>
  )
}
