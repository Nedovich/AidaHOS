'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarDays, Check, ChevronDown, Clock, Eye, Globe2, Image as ImageIcon, Megaphone, Plus } from 'lucide-react';
import { resolveLoc, type Loc, type PortalLang } from '@aidahos/db/portal-config';
import { L, type Lang } from '@/lib/i18n';
import { createEventAction, updateEventAction } from '@/app/(hotel)/h/[hotelId]/events/actions';
import { AddCategoryModal } from './add-category-modal';
import { AddLocationModal } from './add-location-modal';
import { LocInput } from './loc-input';

type Cat = { id: string; name: Loc; color: string };
type Loc2 = { id: string; name: Loc; hotelId: string };
type EventStatus = 'draft' | 'scheduled' | 'live' | 'full' | 'completed' | 'cancelled';
type EventOpt = { registrationRequired?: boolean; paid?: boolean; maxPerBooking?: number; recurring?: boolean };
export type EventInit = {
  id: string; name: Loc; description: Loc;
  categoryId: string | null; locationId: string | null; hotelId: string;
  startsAt: string | null; endsAt: string | null;
  capacity: number; status: EventStatus; coverUrl: string | null; options: EventOpt;
};

const inputBase: React.CSSProperties = { border: 0, background: 'transparent', outline: 'none', font: 'inherit', color: 'inherit', width: '100%' };

/** Split an ISO timestamp into local yyyy-mm-dd + HH:mm for the date/time inputs. */
function splitDT(iso: string | null): { date: string; time: string } {
  if (!iso) return { date: '', time: '' };
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return { date: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`, time: `${p(d.getHours())}:${p(d.getMinutes())}` };
}

export function EventForm({
  consoleHotelId, lang, hotels, categories, locations, event,
}: {
  consoleHotelId: string;
  lang: Lang;
  hotels: { id: string; name: string }[];
  categories: Cat[];
  locations: Loc2[];
  event?: EventInit;
}) {
  const router = useRouter();
  const editing = !!event;
  const rl = (loc: Loc) => resolveLoc(loc, lang as PortalLang, 'en');
  const sDT = splitDT(event?.startsAt ?? null);
  const eDT = splitDT(event?.endsAt ?? null);

  const [name, setName] = useState<Loc>(event?.name ?? {});
  const [description, setDescription] = useState<Loc>(event?.description ?? {});
  const [categoryId, setCategoryId] = useState<string | null>(event?.categoryId ?? categories[0]?.id ?? null);
  const [hotelSel, setHotelSel] = useState<string>(event?.hotelId ?? consoleHotelId);
  const [locationId, setLocationId] = useState<string>(event?.locationId ?? '');
  const [date, setDate] = useState(sDT.date);
  const [start, setStart] = useState(sDT.time);
  const [end, setEnd] = useState(eDT.time);
  const [capacity, setCapacity] = useState(String(event?.capacity ?? 100));
  const [status, setStatus] = useState<EventStatus>(event?.status ?? 'draft');
  const [coverUrl, setCoverUrl] = useState(event?.coverUrl ?? '');
  const [opt, setOpt] = useState({
    registrationRequired: event?.options?.registrationRequired ?? true,
    paid: event?.options?.paid ?? false,
    maxPerBooking: event?.options?.maxPerBooking ?? 6,
    recurring: event?.options?.recurring ?? false,
  });
  const [showCat, setShowCat] = useState(false);
  const [showLoc, setShowLoc] = useState(false);
  const [saving, setSaving] = useState(false);

  const locForHotel = useMemo(() => locations.filter((l) => l.hotelId === hotelSel), [locations, hotelSel]);
  const valid = !!(name.en || name.tr || name.de || name.ru);

  const toIso = (t: string) => (date && t ? new Date(`${date}T${t}:00`).toISOString() : null);

  const save = async (notify: boolean) => {
    if (!valid || saving) return;
    setSaving(true);
    const payload = {
      hotelId: hotelSel,
      categoryId,
      locationId: locationId || null,
      name,
      description,
      coverUrl: coverUrl.trim() || null,
      startsAt: toIso(start),
      endsAt: toIso(end),
      capacity: Number(capacity) || 0,
      status,
      options: opt,
    };
    try {
      if (event) await updateEventAction(consoleHotelId, event.id, payload);
      else await createEventAction(consoleHotelId, payload);
      // both redirect on success; if we reach here it didn't throw.
      void notify;
    } catch (e) {
      if ((e as { digest?: string })?.digest?.startsWith('NEXT_REDIRECT')) throw e;
      setSaving(false);
      alert(L(['Kaydedilemedi. Tekrar deneyin.', 'Could not save. Please try again.'], lang));
    }
  };

  const SaveBtn = ({ className, notify, icon }: { className: string; notify: boolean; icon: React.ReactNode }) => (
    <button className={className} type="button" disabled={!valid || saving} onClick={() => save(notify)}>
      {icon}
      {saving ? L(['Kaydediliyor…', 'Saving…'], lang) : notify ? L(['Kaydet & Bildir', 'Save & Notify'], lang) : editing ? L(['Değişiklikleri Kaydet', 'Save changes'], lang) : L(['Etkinliği Kaydet', 'Save Event'], lang)}
    </button>
  );

  return (
    <div className="events-create-grid">
      <div className="card events-form-card">
        {/* Basic */}
        <section className="form-sec">
          <div className="form-sec__t">{L(['Temel Bilgiler', 'Basic Information'], lang)}</div>
          <div className="form-sec__d">{L(['Etkinliğin adı, açıklaması ve kategorisi.', 'Event name, description and category.'], lang)}</div>
          <div className="events-form-stack">
            <div>
              <label className="flabel">{L(['Etkinlik adı', 'Event name'], lang)}</label>
              <LocInput value={name} onChange={setName} placeholder={L(['ör. Havuz Başı DJ Performansı', 'e.g. Poolside DJ Set'], lang)} />
            </div>
            <div>
              <label className="flabel">{L(['Açıklama', 'Description'], lang)}</label>
              <LocInput value={description} onChange={setDescription} multiline placeholder={L(['Misafirlere gösterilecek açıklama...', 'Description shown to guests...'], lang)} />
            </div>
            <div>
              <label className="flabel">{L(['Kategori', 'Category'], lang)}</label>
              <div className="seg-pills events-create-cats">
                {categories.map((c) => (
                  <button key={c.id} type="button" className={['seg-pill', c.id === categoryId ? 'on' : null].filter(Boolean).join(' ')} onClick={() => setCategoryId(c.id)}>
                    <span className="seg-pill__dot" style={{ background: c.color }} />
                    {rl(c.name)}
                  </button>
                ))}
                <button type="button" className="seg-pill" onClick={() => setShowCat(true)}>
                  <Plus size={14} /> {L(['Kategori ekle', 'Add Category'], lang)}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Time & Location */}
        <section className="form-sec">
          <div className="form-sec__t">{L(['Zaman & Lokasyon', 'Time & Location'], lang)}</div>
          <div className="form-sec__d">{L(['Etkinliğin ne zaman ve nerede gerçekleşeceği.', 'When and where the event takes place.'], lang)}</div>
          <div className="fgrid events-time-grid">
            <div>
              <label className="flabel">{L(['Otel', 'Hotel'], lang)}</label>
              <div className="dateinput events-dateinput">
                <select value={hotelSel} onChange={(e) => { setHotelSel(e.target.value); setLocationId(''); }} style={inputBase}>
                  {hotels.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
                </select>
                <ChevronDown size={16} />
              </div>
            </div>
            <div>
              <label className="flabel">{L(['Lokasyon', 'Location'], lang)}</label>
              {locForHotel.length ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  <div className="dateinput events-dateinput" style={{ flex: 1 }}>
                    <select value={locationId} onChange={(e) => setLocationId(e.target.value)} style={inputBase}>
                      <option value="">{L(['Seçin…', 'Select…'], lang)}</option>
                      {locForHotel.map((l) => <option key={l.id} value={l.id}>{rl(l.name)}</option>)}
                    </select>
                    <ChevronDown size={16} />
                  </div>
                  <button type="button" className="btn btn--ghost btn--sm" onClick={() => setShowLoc(true)} title={L(['Lokasyon ekle', 'Add Location'], lang)}><Plus size={15} /></button>
                </div>
              ) : (
                <button type="button" className="btn btn--ghost" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setShowLoc(true)}>
                  <Plus size={15} /> {L(['Lokasyon ekle', 'Add Location'], lang)}
                </button>
              )}
            </div>
            <div>
              <label className="flabel">{L(['Tarih', 'Date'], lang)}</label>
              <div className="dateinput events-dateinput"><CalendarDays size={16} /><input type="date" lang="en-GB" value={date} onChange={(e) => setDate(e.target.value)} style={inputBase} /></div>
            </div>
            <div className="events-time-split">
              <div>
                <label className="flabel">{L(['Başlangıç', 'Start'], lang)}</label>
                <div className="dateinput events-dateinput"><Clock size={16} /><input type="time" lang="en-GB" value={start} onChange={(e) => setStart(e.target.value)} style={inputBase} /></div>
              </div>
              <div>
                <label className="flabel">{L(['Bitiş', 'End'], lang)}</label>
                <div className="dateinput events-dateinput"><Clock size={16} /><input type="time" lang="en-GB" value={end} onChange={(e) => setEnd(e.target.value)} style={inputBase} /></div>
              </div>
            </div>
            <div>
              <label className="flabel">{L(['Kapasite', 'Capacity'], lang)}</label>
              <input className="finput" type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
            </div>
          </div>
        </section>

        {/* Options */}
        <section className="form-sec">
          <div className="form-sec__t">{L(['Seçenekler', 'Options'], lang)}</div>
          <div className="form-sec__d">{L(['Kayıt, ücretlendirme ve tekrar ayarları.', 'Registration, pricing and recurrence settings.'], lang)}</div>
          <OptRow title={L(['Kayıt zorunlu', 'Registration required'], lang)} desc={L(['Misafirler katılmadan önce kayıt olmalı.', 'Guests must register before attending.'], lang)} on={opt.registrationRequired} onToggle={() => setOpt((o) => ({ ...o, registrationRequired: !o.registrationRequired }))} />
          <OptRow title={L(['Ücretli etkinlik', 'Paid event'], lang)} desc={L(['Etkinlik için ücret alınır.', 'A fee is charged for this event.'], lang)} on={opt.paid} onToggle={() => setOpt((o) => ({ ...o, paid: !o.paid }))} />
          <div className="optrow events-option-row">
            <div><div className="optrow__t">{L(['Maksimum kişi / kayıt', 'Max people per booking'], lang)}</div></div>
            <input className="finput events-max-booking" type="number" value={opt.maxPerBooking} onChange={(e) => setOpt((o) => ({ ...o, maxPerBooking: Number(e.target.value) || 0 }))} />
          </div>
          <OptRow title={L(['Tekrarlayan etkinlik', 'Recurring event'], lang)} desc={L(['Belirli günlerde otomatik tekrarlanır.', 'Repeats automatically on set days.'], lang)} on={opt.recurring} onToggle={() => setOpt((o) => ({ ...o, recurring: !o.recurring }))} />
        </section>
      </div>

      <aside className="events-create-side">
        <section className="card">
          <div className="card__body">
            <label className="flabel">{L(['Kapak görseli (URL)', 'Cover image (URL)'], lang)}</label>
            <input className="finput" value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} placeholder="https://…" />
            <div className="cover-drop" style={{ marginTop: 10, cursor: 'default' }}>
              {coverUrl ? <img src={coverUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--r-md)' }} /> : <><ImageIcon size={26} /><span className="cell-sub">{L(['Yükleme yakında · şimdilik URL', 'Upload soon · URL for now'], lang)}</span></>}
            </div>
          </div>
        </section>

        <section className="card">
          <div className="card__body">
            <label className="flabel">{L(['Durum', 'Status'], lang)}</label>
            <div className="dateinput events-dateinput">
              <select value={status} onChange={(e) => setStatus(e.target.value as EventStatus)} style={inputBase}>
                <option value="draft">{L(['Taslak', 'Draft'], lang)}</option>
                <option value="scheduled">{L(['Planlandı', 'Scheduled'], lang)}</option>
                <option value="live">{L(['Canlı', 'Live'], lang)}</option>
                <option value="full">{L(['Dolu', 'Full'], lang)}</option>
                <option value="completed">{L(['Tamamlandı', 'Completed'], lang)}</option>
                <option value="cancelled">{L(['İptal', 'Cancelled'], lang)}</option>
              </select>
              <ChevronDown size={16} />
            </div>

            <div className="divider" />
            <div className="stat-row"><span className="stat-row__k"><Eye size={15} />{L(['Görünürlük', 'Visibility'], lang)}</span><span className="stat-row__v">{L(['Misafir Portalı', 'Guest Portal'], lang)}</span></div>
            <div className="stat-row"><span className="stat-row__k"><Globe2 size={15} />{L(['Diller', 'Languages'], lang)}</span><span className="stat-row__v">TR · EN · DE · RU</span></div>

            <SaveBtn className="btn btn--primary events-side-action" notify={false} icon={<Check />} />
            <SaveBtn className="btn btn--subtle events-side-action events-side-action--notify" notify icon={<Megaphone />} />
          </div>
        </section>
      </aside>

      {showCat && <AddCategoryModal hotelId={consoleHotelId} onClose={() => setShowCat(false)} onAdded={() => router.refresh()} />}
      {showLoc && <AddLocationModal consoleHotelId={consoleHotelId} hotelId={hotelSel} onClose={() => setShowLoc(false)} onAdded={() => router.refresh()} />}
    </div>
  );
}

function OptRow({ title, desc, on, onToggle }: { title: string; desc: string; on: boolean; onToggle: () => void }) {
  return (
    <div className="optrow events-option-row">
      <div><div className="optrow__t">{title}</div><div className="optrow__d">{desc}</div></div>
      <button type="button" onClick={onToggle} className={['switch', on ? 'on' : null].filter(Boolean).join(' ')} aria-pressed={on} style={{ border: 0, cursor: 'pointer' }} />
    </div>
  );
}
