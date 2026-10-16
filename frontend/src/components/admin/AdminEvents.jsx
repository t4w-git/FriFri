import { useState, useEffect } from 'react';
import { apiGet, apiPost, apiPut, apiDelete, apiPatch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Edit2, Check, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function AdminEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    bgColor: '#2D1B69',
    textColor: '#FFFFFF',
    order: 0,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await apiGet('/api/v1/admin/events');
      setEvents(res.data || []);
    } catch (error) {
      toast({ title: 'Errore', description: 'Impossibile caricare gli eventi', variant: 'destructive' });
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        date: formData.date ? new Date(formData.date).toISOString() : null,
      };

      if (editingId) {
        await apiPut(`/api/v1/admin/events/${editingId}`, payload);
        toast({ title: 'Successo', description: 'Evento aggiornato' });
      } else {
        await apiPost('/api/v1/admin/events', payload);
        toast({ title: 'Successo', description: 'Evento creato' });
      }

      setFormData({
        title: '',
        description: '',
        date: '',
        location: '',
        bgColor: '#2D1B69',
        textColor: '#FFFFFF',
        order: 0,
      });
      setEditingId(null);
      fetchEvents();
    } catch (error) {
      toast({ title: 'Errore', description: 'Impossibile salvare l\'evento', variant: 'destructive' });
    }
    setLoading(false);
  };

  const handleEdit = (event) => {
    const dateStr = event.date ? new Date(event.date).toISOString().split('T')[0] : '';
    setFormData({
      title: event.title,
      description: event.description,
      date: dateStr,
      location: event.location || '',
      bgColor: event.bgColor,
      textColor: event.textColor,
      order: event.order,
    });
    setEditingId(event.id);
  };

  const handleDelete = async (id) => {
    if (!confirm('Sei sicuro?')) return;
    try {
      await apiDelete(`/api/v1/admin/events/${id}`);
      toast({ title: 'Successo', description: 'Evento eliminato' });
      fetchEvents();
    } catch (error) {
      toast({ title: 'Errore', description: 'Impossibile eliminare l\'evento', variant: 'destructive' });
    }
  };

  const handleToggle = async (id) => {
    try {
      await apiPatch(`/api/v1/admin/events/${id}/toggle`);
      fetchEvents();
    } catch (error) {
      toast({ title: 'Errore', description: 'Impossibile aggiornare lo stato', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold">Gestione Eventi</h2>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Titolo</label>
          <Input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            placeholder="es. Prima Serata della Poesia"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Descrizione</label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
            placeholder="Descrivi l'evento..."
            rows={4}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Data</label>
            <Input
              type="datetime-local"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Luogo</label>
            <Input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="es. Piazza Vittorio Veneto"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Colore sfondo</label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={formData.bgColor}
                onChange={(e) => setFormData({ ...formData, bgColor: e.target.value })}
                className="w-12 h-10"
              />
              <Input
                type="text"
                value={formData.bgColor}
                onChange={(e) => setFormData({ ...formData, bgColor: e.target.value })}
                placeholder="#2D1B69"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Colore testo</label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={formData.textColor}
                onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                className="w-12 h-10"
              />
              <Input
                type="text"
                value={formData.textColor}
                onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                placeholder="#FFFFFF"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Ordine</label>
            <Input
              type="number"
              value={formData.order}
              onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
              min="0"
            />
          </div>
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {editingId ? 'Aggiorna evento' : 'Crea evento'}
        </Button>
      </form>

      {/* List */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold">Eventi ({events.length})</h3>
        {events.map((event) => (
          <div
            key={event.id}
            className="p-4 border rounded-lg"
            style={{ backgroundColor: event.bgColor + '20' }}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-bold text-lg" style={{ color: event.bgColor }}>
                  {event.title}
                </h4>
                <p className="text-sm text-gray-600 mt-1">{event.description.substring(0, 100)}...</p>
                <div className="text-xs text-gray-500 mt-2 space-y-1">
                  {event.date && <p>📅 {new Date(event.date).toLocaleDateString('it-IT')}</p>}
                  {event.location && <p>📍 {event.location}</p>}
                  <p>Ordine: {event.order} | Colori: {event.bgColor} / {event.textColor}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleToggle(event.id)}
                  className={`p-2 rounded ${event.active ? 'bg-green-100' : 'bg-gray-100'}`}
                >
                  {event.active ? <Check className="w-4 h-4 text-green-600" /> : <X className="w-4 h-4 text-gray-400" />}
                </button>
                <button
                  onClick={() => handleEdit(event)}
                  className="p-2 rounded bg-blue-100 hover:bg-blue-200"
                >
                  <Edit2 className="w-4 h-4 text-blue-600" />
                </button>
                <button
                  onClick={() => handleDelete(event.id)}
                  className="p-2 rounded bg-red-100 hover:bg-red-200"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
