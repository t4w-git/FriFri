import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { apiGet } from "@/lib/api";
import SectionWithAds from "@/components/ads/SectionWithAds";
import AdBannerHorizontal from "@/components/ads/AdBannerHorizontal";
import HeroSection from "@/components/home/HeroSection";
import PoemsSection from "@/components/home/PoemsSection";
import GamesSection from "@/components/home/GamesSection";
import SponsorsSection from "@/components/home/SponsorsSection";
import NewsletterSection from "@/components/home/NewsletterSection";
import EventSection from "@/components/home/EventSection";

export default function Home() {
  const [poems, setPoems] = useState([]);
  const [gameSponsors, setGameSponsors] = useState({
    gioco_poesie: [],
    fortuna_italiana: [],
    fortuna_montelupo: []
  });

  useEffect(() => {
    apiGet('/api/v1/public/poems', { active: 'true', limit: 3, sortBy: 'publishedDate', sortOrder: 'desc' })
      .then((res) => setPoems(res.data || []))
      .catch(() => {});

    // Fetch sponsors for each game
    Promise.all([
      apiGet('/api/v1/public/sponsors', { active: 'true', gameType: 'gioco_poesie' }),
      apiGet('/api/v1/public/sponsors', { active: 'true', gameType: 'fortuna_italiana' }),
      apiGet('/api/v1/public/sponsors', { active: 'true', gameType: 'fortuna_montelupo' })
    ]).then(([giocoRes, fortunaIRes, fortunaMRes]) => {
      setGameSponsors({
        gioco_poesie: giocoRes.data || [],
        fortuna_italiana: fortunaIRes.data || [],
        fortuna_montelupo: fortunaMRes.data || []
      });
    }).catch(() => {});
  }, []);

  return (
    <div>
      <HeroSection />
      <SectionWithAds>
        <PoemsSection poems={poems} />
      </SectionWithAds>
      <GamesSection gameSponsors={gameSponsors} />
      <SectionWithAds>
        <SponsorsSection sponsors={Object.values(gameSponsors).flat()} />
      </SectionWithAds>
      <AdBannerHorizontal />
      <EventSection />
      <NewsletterSection />
    </div>
  );
}