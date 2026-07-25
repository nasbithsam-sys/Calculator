import { Shield, Home, Settings, Package, FileText, LogOut } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const handleSignOut = async () => {
    "use server"
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/admin/login')
  }

  if (!user) {
    return <>{children}</>
  }

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-800 text-white font-semibold">
          <Shield className="w-5 h-5 mr-2 text-blue-500" />
          Admin Portal
        </div>
        
        <nav className="flex-1 py-6 flex flex-col gap-1 px-3">
          <Link href="/admin" className="flex items-center px-3 py-2 rounded-md hover:bg-slate-800 hover:text-white transition-colors">
            <Home className="w-4 h-4 mr-3" /> Dashboard
          </Link>
          <Link href="/admin/quotes" className="flex items-center px-3 py-2 rounded-md hover:bg-slate-800 hover:text-white transition-colors">
            <FileText className="w-4 h-4 mr-3" /> Quotes & Reviews
          </Link>
          <Link href="/admin/pricing" className="flex items-center px-3 py-2 rounded-md hover:bg-slate-800 hover:text-white transition-colors">
            <Settings className="w-4 h-4 mr-3" /> Pricing Config
          </Link>
          <Link href="/admin/products" className="flex items-center px-3 py-2 rounded-md hover:bg-slate-800 hover:text-white transition-colors">
            <Package className="w-4 h-4 mr-3" /> Product Catalog
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="text-sm truncate mb-4 text-slate-400">
            {user?.email || 'Not logged in'}
          </div>
          <form action={handleSignOut}>
            <button className="flex items-center w-full px-3 py-2 text-sm rounded-md hover:bg-slate-800 hover:text-white transition-colors text-left">
              <LogOut className="w-4 h-4 mr-3" /> Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-slate-50">
        {children}
      </main>
    </div>
  )
}
