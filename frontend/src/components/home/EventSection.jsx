import { useState, useEffect } from 'react';
import { Calendar, MapPin, ArrowRight } from "lucide-react";
import { apiGet } from '@/lib/api';

export default function EventSection() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet('/api/v1/public/events')
      .then((res) => setEvents(res.data || []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <section className="py-20 px-4 bg-gray-50" />;
  if (events.length === 0) return null;

  return (
    <section className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8">
          {events.map((event) => (
            <div
              key={event.id}
              className="rounded-3xl p-8 text-white"
              style={{
                background: `linear-gradient(135deg, ${event.bgColor} 0%, ${event.bgColor}dd 100%)`,
                color: event.textColor,
              }}
            >
              <span className="font-sans text-xs uppercase tracking-widest font-semibold" style={{ color: event.textColor, opacity: 0.8 }}>
                Evento
              </span>
              <h3 className="text-2xl font-bold mt-3 mb-3">{event.title}</h3>
              <p className="font-sans text-sm leading-relaxed mb-6" style={{ color: event.textColor, opacity: 0.9 }}>
                {event.description}
              </p>
              <div className="flex flex-col gap-2 mb-6">
                {event.date && (
                  <div className="flex items-center gap-2 font-sans text-sm" style={{ color: event.textColor, opacity: 0.85 }}>
                    <Calendar className="w-4 h-4" />
                    {new Date(event.date).toLocaleDateString('it-IT', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                )}
                {event.location && (
                  <div className="flex items-center gap-2 font-sans text-sm" style={{ color: event.textColor, opacity: 0.85 }}>
                    <MapPin className="w-4 h-4" />
                    {event.location}
                  </div>
                )}
              </div>
              <button className="flex items-center gap-2 font-sans text-sm font-semibold hover:opacity-80 transition-opacity" style={{ color: event.textColor }}>
                Scopri di più <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}