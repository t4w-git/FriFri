import { useState, useEffect } from "react";
import { apiGet, apiPost } from "@/lib/api";
import SectionWithAds from "@/components/ads/SectionWithAds";
import { Star, Trophy, ExternalLink, Check } from "lucide-react";

export default function Sponsors() {
  const [sponsors, setSponsors] = useState([]);
  const [tiers, setTiers] = useState([]);
  const [contactForm, setContactForm] = useState({ name: "", email: "", tier: "", message: "" });
  const [formSent, setFormSent] = useState(false);

  useEffect(() => {
    // Load sponsor tiers from API
    apiGet('/api/v1/public/sponsor-tiers')
      .then((res) => {
        const tiersArray = Object.values(res);
        setTiers(tiersArray);
        // Set default tier to first available tier
        if (tiersArray.length > 0 && !contactForm.tier) {
          setContactForm(prev => ({ ...prev, tier: tiersArray[0].key }));
        }
      })
      .catch(() => setTiers([]));

    // Load sponsors
    apiGet('/api/v1/public/sponsors', { active: 'true', limit: 20, sortBy: 'createdAt', sortOrder: 'desc' })
      .then((res) => setSponsors(res.data || []))
      .catch(() => {});
  }, []);

  const handleContact = async (e) => {
    e.preventDefault();
    await apiPost('/api/v1/contact', {
      name: contactForm.name,
      email: contactForm.email,
      tier: contactForm.tier,
      message: contactForm.message,
    }).catch(() => {});
    setFormSent(true);
  };

  const tierColors = { gold: "bg-yellow-50 border-yellow-200 text-yellow-700", premium: "bg-purple-50 border-purple-200 text-purple-700", base: "bg-gray-50 border-gray-200 text-gray-600" };
  const tierLabels = { gold: "Gold", premium: "Premium", base: "Base" };

  return (
    <div>
      {/* Header */}
      <div className="bg-[#F5EFE4] py-20 px-4 text-center">
        <p className="font-sans text-xs font-semibold uppercase tracking-[0.3em] text-[#C4956A] mb-3">Monetizzazione culturale</p>
        <h1 className="text-5xl font-bold text-[#1C1C1C] mb-4">Diventa Sponsor</h1>
        <p className="font-sans text-base text-[#777] max-w-lg mx-auto">
          Sostieni la poesia di Montelupo Fiorentino e porta la tua attività 
          davanti a una comunità appassionata e locale.
        </p>
      </div>

      {/* Piani con Ads */}
      <SectionWithAds>
        <div className="max-w-5xl mx-auto px-4 py-20">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-[#1C1C1C] mb-3">I piani sponsor</h2>
          <p className="font-sans text-sm text-[#777]">Tre livelli di visibilità, tutti con premi reali in palio per i lettori.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-20">
          {tiers.map(tier => (
            <div key={tier.key} className={`border-2 ${tier.color} rounded-3xl p-8 relative ${tier.popular ? "shadow-lg" : ""}`}>
              {tier.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#C4956A] text-white text-xs font-sans font-semibold px-4 py-1 rounded-full whitespace-nowrap">
                  ⭐ Più scelto
                </div>
              )}
              <span className={`text-xs font-sans font-semibold px-3 py-1 rounded-full border ${tier.badge} mb-5 inline-block`}>{tier.label}</span>
              <p className="text-3xl font-bold text-[#1C1C1C] mb-1">€{tier.price}</p>
              <p className="font-sans text-xs text-[#999] mb-7">+ IVA se dovuta</p>
              <ul className="flex flex-col gap-3 mb-8">
                {tier.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#C4956A] mt-0.5 flex-shrink-0" />
                    <span className="font-sans text-sm text-[#555]">{f}</span>
                  </li>
                ))}
              </ul>
              <a
                href="#contatto"
                className={`block text-center py-3 rounded-xl font-sans font-semibold text-sm transition-colors ${tier.popular ? "bg-[#C4956A] text-white hover:bg-[#B8845A]" : "border border-[#E8DFD0] text-[#555] hover:border-[#C4956A] hover:text-[#C4956A]"}`}
              >
                Inizia ora
              </a>
            </div>
          ))}
        </div>

        {/* Sponsor attivi */}
        {sponsors.length > 0 && (
          <div className="mb-20">
            <h2 className="text-2xl font-bold text-[#1C1C1C] text-center mb-10">I nostri sponsor</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {sponsors.map(sponsor => (
                <div key={sponsor.id} className="border border-[#E8DFD0] rounded-2xl p-5 bg-white">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 rounded-xl bg-[#F5EFE4] flex items-center justify-center text-xl font-bold text-[#C4956A]">
                      {sponsor.logoUrl ? <img src={sponsor.logoUrl.startsWith('http') ? sponsor.logoUrl : `${sponsor.logoUrl}`} alt="" className="w-full h-full object-contain rounded-xl" /> : sponsor.name[0]}
                    </div>
                    <span className={`text-xs font-sans font-semibold px-2 py-0.5 rounded-full border ${tierColors[sponsor.tier]}`}>{tierLabels[sponsor.tier]}</span>
                  </div>
                  <h3 className="font-bold text-sm mb-1">{sponsor.name}</h3>
                  <p className="font-sans text-xs text-[#999] mb-3">{sponsor.description}</p>
                  {sponsor.link && <a href={sponsor.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 font-sans text-xs text-[#C4956A] hover:underline"><ExternalLink className="w-3 h-3" /> Visita</a>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Form contatto */}
        <div id="contatto" className="max-w-lg mx-auto">
          <h2 className="text-3xl font-bold text-center mb-3">Contattaci</h2>
          <p className="font-sans text-sm text-center text-[#777] mb-10">Scrivici per scoprire come diventare sponsor di frifri.it</p>
          {formSent ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">✅</div>
              <p className="font-bold text-xl mb-2">Messaggio inviato!</p>
              <p className="font-sans text-[#777] text-sm">Ti risponderemo entro 24 ore.</p>
            </div>
          ) : (
            <form onSubmit={handleContact} className="bg-[#F5EFE4] rounded-3xl p-8 flex flex-col gap-4">
              <input type="text" placeholder="Nome attività" value={contactForm.name} onChange={e => setContactForm({...contactForm, name: e.target.value})} required className="px-4 py-3 border border-[#E8DFD0] rounded-xl font-sans text-sm bg-white outline-none focus:border-[#C4956A]" />
              <input type="email" placeholder="Email" value={contactForm.email} onChange={e => setContactForm({...contactForm, email: e.target.value})} required className="px-4 py-3 border border-[#E8DFD0] rounded-xl font-sans text-sm bg-white outline-none focus:border-[#C4956A]" />
              <select value={contactForm.tier} onChange={e => setContactForm({...contactForm, tier: e.target.value})} className="px-4 py-3 border border-[#E8DFD0] rounded-xl font-sans text-sm bg-white outline-none focus:border-[#C4956A]">
                <option value="">Scegli un piano</option>
                {tiers.map(tier => (
                  <option key={tier.key} value={tier.key}>Piano {tier.label} — {tier.price}€/mese</option>
                ))}
              </select>
              <textarea placeholder="Messaggio (opzionale)" value={contactForm.message} onChange={e => setContactForm({...contactForm, message: e.target.value})} rows={3} className="px-4 py-3 border border-[#E8DFD0] rounded-xl font-sans text-sm bg-white outline-none focus:border-[#C4956A] resize-none" />
              <button type="submit" className="py-4 bg-[#C4956A] text-white rounded-xl font-sans font-semibold text-sm hover:bg-[#B8845A] transition-colors">
                Invia richiesta
              </button>
            </form>
          )}
        </div>
        </div>
      </SectionWithAds>
    </div>
  );
}