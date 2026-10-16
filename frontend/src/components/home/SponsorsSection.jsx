import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ExternalLink, Star } from "lucide-react";

const tierLabels = { gold: "Gold", premium: "Premium", base: "Base" };
const tierColors = {
  gold: "bg-yellow-50 border-yellow-200 text-yellow-700",
  premium: "bg-purple-50 border-purple-200 text-purple-700",
  base: "bg-gray-50 border-gray-200 text-gray-600",
};

export default function SponsorsSection({ sponsors }) {
  const demoSponsors = sponsors.length > 0 ? sponsors : [
    { id: "1", name: "Ceramiche Bardelli", tier: "gold", prize_description: "Ceramica artistica del valore di €80", description: "Bottega artigiana dal 1952", link: "#" },
    { id: "2", name: "Ristorante La Fornace", tier: "premium", prize_description: "Cena per due persone", description: "Cucina toscana tradizionale", link: "#" },
    { id: "3", name: "Libreria Arno", tier: "premium", prize_description: "Buono libri da €40", description: "Libri e cultura locale", link: "#" },
    { id: "4", name: "Pasticceria Medici", tier: "base", prize_description: "Assortimento dolci", description: "Dolci artigianali toscani", link: "#" },
  ];

  // Filter sponsors: only premium and gold tiers (exclude base)
  const filteredSponsors = demoSponsors
    .filter(s => s.tier === 'premium' || s.tier === 'gold')
    .sort((a, b) => {
      // Sort by tier: gold first, then premium
      const tierOrder = { gold: 0, premium: 1 };
      return (tierOrder[a.tier] || 2) - (tierOrder[b.tier] || 2);
    });

  // Separate gold sponsors from others for featured placement
  const goldSponsors = filteredSponsors.filter(s => s.tier === 'gold');
  const premiumSponsors = filteredSponsors.filter(s => s.tier === 'premium');

  return (
    <section className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.3em] text-[#C4956A] mb-3">🤝 Comunità locale</p>
          <h2 className="text-4xl md:text-5xl font-bold text-[#1C1C1C] mb-4">
            Le attività che sostengono<br />la poesia a Montelupo Fiorentino
          </h2>
          <p className="font-sans text-base text-[#666] max-w-2xl mx-auto">
            Commercianti e artigiani del territorio che credono nella cultura come motore della comunità. I loro premi vi aspettano!
          </p>
        </div>

        {/* Featured Gold Sponsors */}
        {goldSponsors.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-2xl">⭐</span>
              <h3 className="text-2xl font-bold text-[#1C1C1C]">Sponsor Gold</h3>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {goldSponsors.map((sponsor, i) => (
                <div key={sponsor.id || i} className="border-2 border-yellow-300 rounded-2xl p-6 bg-gradient-to-br from-yellow-50 to-white hover:shadow-lg transition-shadow group relative overflow-hidden">
                  {/* Gold badge */}
                  <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 px-4 py-2 rounded-bl-xl font-sans font-bold text-xs">
                    GOLD
                  </div>
                  
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-16 h-16 rounded-xl bg-white flex items-center justify-center overflow-hidden border-2 border-yellow-200">
                      {sponsor.logoUrl ? (
                        <img src={sponsor.logoUrl.startsWith('http') ? sponsor.logoUrl : `${sponsor.logoUrl}`} alt={sponsor.name} className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-3xl font-bold text-[#C4956A]">{sponsor.name[0]}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-[#1C1C1C]">{sponsor.name}</h3>
                      <p className="font-sans text-xs text-[#999]">{sponsor.description}</p>
                    </div>
                  </div>
                  
                  <div className="bg-yellow-100 rounded-lg p-4 mb-4 border border-yellow-200">
                    <p className="font-sans text-xs text-yellow-700 font-semibold mb-1">🏆 Premio in gioco</p>
                    <p className="font-sans text-sm text-yellow-900 font-bold">{sponsor.prize_description}</p>
                  </div>
                  
                  {sponsor.link && sponsor.link !== "#" && (
                    <a href={sponsor.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 font-sans text-xs text-yellow-700 hover:text-yellow-900 font-semibold hover:underline">
                      Visita l'attività →
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Premium Sponsors */}
        {premiumSponsors.length > 0 && (
          <div>
            <h3 className="text-xl font-bold text-[#1C1C1C] mb-6 flex items-center gap-2">
              <span className="text-lg">💜</span> Sponsor Premium
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {premiumSponsors.map((sponsor, i) => (
                <div key={sponsor.id || i} className="border-2 border-purple-200 rounded-2xl p-5 bg-white hover:shadow-md transition-shadow hover:border-purple-300">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center overflow-hidden">
                      {sponsor.logoUrl ? (
                        <img src={sponsor.logoUrl.startsWith('http') ? sponsor.logoUrl : `${sponsor.logoUrl}`} alt={sponsor.name} className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-lg font-bold text-purple-600">{sponsor.name[0]}</span>
                      )}
                    </div>
                    <span className="text-xs font-sans font-semibold px-2 py-1 rounded-full bg-purple-100 text-purple-700">
                      Premium
                    </span>
                  </div>
                  <h3 className="font-bold text-base mb-1 text-[#1C1C1C]">{sponsor.name}</h3>
                  <p className="font-sans text-xs text-[#999] mb-3">{sponsor.description}</p>
                  <div className="bg-purple-50 rounded-lg p-2.5 mb-3">
                    <p className="font-sans text-xs text-purple-700 font-semibold mb-0.5">🎁 Premio</p>
                    <p className="font-sans text-xs text-purple-900">{sponsor.prize_description}</p>
                  </div>
                  {sponsor.link && sponsor.link !== "#" && (
                    <a href={sponsor.link} target="_blank" rel="noopener noreferrer" className="font-sans text-xs text-purple-600 hover:text-purple-800 font-semibold inline-flex items-center gap-1 hover:underline">
                      Info →
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-12 text-center">
          <Link
            to={createPageUrl("Sponsors")}
            className="inline-flex items-center gap-2 border border-[#C4956A] text-[#C4956A] px-8 py-3 rounded-full font-sans text-sm hover:bg-[#C4956A] hover:text-white transition-colors"
          >
            <Star className="w-4 h-4" />
            Diventa sponsor
          </Link>
        </div>
      </div>
    </section>
  );
}