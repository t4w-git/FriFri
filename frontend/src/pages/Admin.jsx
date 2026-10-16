import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import AdminPoems from "@/components/admin/AdminPoems";
import AdminSponsors from "@/components/admin/AdminSponsors";
import AdminSponsorTiers from "@/components/admin/AdminSponsorTiers";
import AdminStats from "@/components/admin/AdminStats";
import AdminPrizeCodes from "@/components/admin/AdminPrizeCodes";
import AdminNewsletter from "@/components/admin/AdminNewsletter";
import AdminEvents from "@/components/admin/AdminEvents";
import AdminGameConfig from "@/components/admin/AdminGameConfig";
import AdminGuide from "@/components/admin/AdminGuide";
import { BookOpen, Star, BarChart2, Gift, Mail, ShieldAlert, Calendar, Gamepad2, Crown, HelpCircle } from "lucide-react";

const tabs = [
  { key: "guide", label: "Guida", icon: HelpCircle },
  { key: "stats", label: "Dashboard", icon: BarChart2 },
  { key: "poems", label: "Poesie", icon: BookOpen },
  { key: "games", label: "Giochi", icon: Gamepad2 },
  { key: "events", label: "Eventi", icon: Calendar },
  { key: "sponsors", label: "Sponsor", icon: Star },
  { key: "tiers", label: "Tier Sponsor", icon: Crown },
  { key: "prizes", label: "Premi", icon: Gift },
  { key: "newsletter", label: "Newsletter", icon: Mail },
];

export default function Admin() {
  const navigate = useNavigate();
  const { user, isLoadingAuth } = useAuth();
  const [tab, setTab] = useState("stats");

  useEffect(() => {
    if (!isLoadingAuth && (!user || user.role !== "admin")) {
      navigate("/", { replace: true });
    }
  }, [user, isLoadingAuth, navigate]);

  if (isLoadingAuth) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#C4956A] border-t-transparent rounded-full animate-spin" /></div>;

  if (!user || user.role !== "admin") return null;

  return (
    <div className="min-h-screen bg-[#F9F6F0]">
      <div className="bg-white border-b border-[#E8DFD0] px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="font-bold text-xl text-[#1C1C1C]">Admin Panel — frifri.it</h1>
          <span className="font-sans text-xs text-[#999] bg-[#F5EFE4] px-3 py-1 rounded-full">Admin</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-[#E8DFD0] rounded-xl p-1.5 mb-8 overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-sans text-sm font-medium whitespace-nowrap transition-colors ${tab === t.key ? "bg-[#C4956A] text-white" : "text-[#666] hover:text-[#1C1C1C]"}`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        {tab === "guide" && <AdminGuide />}
        {tab === "stats" && <AdminStats />}
        {tab === "poems" && <AdminPoems />}
        {tab === "games" && <AdminGameConfig />}
        {tab === "events" && <AdminEvents />}
        {tab === "sponsors" && <AdminSponsors />}
        {tab === "tiers" && <AdminSponsorTiers />}
        {tab === "prizes" && <AdminPrizeCodes />}
        {tab === "newsletter" && <AdminNewsletter />}
      </div>
    </div>
  );
}