'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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
type HotelOpt = { id: string; name: string; slug: string };
type EventStatus = 'draft' | 'scheduled' | 'live' | 'full' | 'completed' | 'cancelled';
type RecurringType = 'daily' | 'weekly' | 'custom';
type EventOpt = {
  registrationRequired?: boolean;
  paid?: boolean;
  maxPerBooking?: number;
  recurring?: boolean;
  recurringType?: RecurringType;
  recurringDays?: number[]; // 0=Sun … 6=Sat
  recurringUntil?: string | null; // ISO date string
};
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
  hotels: HotelOpt[];
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
  const todayIso = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(sDT.date || todayIso);
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
    recurringType: (event?.options?.recurringType ?? 'daily') as RecurringType,
    recurringDays: event?.options?.recurringDays ?? [],
    recurringUntil: event?.options?.recurringUntil ?? null,
  });
  const [showCat, setShowCat] = useState(false);
  const [showLoc, setShowLoc] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const originalCoverUrl = useRef<string | null>(event?.coverUrl ?? null);
  const pendingDeleteUrl = useRef<string | null>(null);
  // Set to true right before redirect so unmount cleanup knows save succeeded.
  const savedRef = useRef(false);

  const deleteUrl = (url: string | null) => {
    if (!url) return;
    void fetch('/api/upload/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    }).catch(() => {});
  };

  // On unmount: if save didn't complete, delete any newly uploaded file that wasn't persisted.
  useEffect(() => {
    return () => {
      if (!savedRef.current && pendingDeleteUrl.current) deleteUrl(pendingDeleteUrl.current);
    };
  }, []);

  const locForHotel = useMemo(() => locations.filter((l) => l.hotelId === hotelSel), [locations, hotelSel]);
  const hasName = !!(name.en || name.tr || name.de || name.ru);
  // A time without a date can't be stored — flag it so we don't silently drop it.
  const timeWithoutDate = !date && (!!start || !!end);
  // A date with no start time also can't form a timestamp → would be silently dropped.
  const dateWithoutTime = !!date && !start;
  const valid = hasName && !timeWithoutDate && !dateWithoutTime;

  const toIso = (t: string) => (date && t ? new Date(`${date}T${t}:00`).toISOString() : null);

  const uploadFile = async (file: File) => {
    setUploading(true);
    const hotelSlug = hotels.find((h) => h.id === hotelSel)?.slug ?? 'events';
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', `events/${hotelSlug}`);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const json = await res.json() as { url?: string; error?: string };
      if (!res.ok || !json.url) throw new Error(json.error ?? 'Upload failed');
      // If there was already a pending (unsaved) upload, delete it now — user replaced it.
      if (pendingDeleteUrl.current) deleteUrl(pendingDeleteUrl.current);
      // Track the newly uploaded URL: will be deleted on unmount if not saved.
      pendingDeleteUrl.current = json.url;
      setCoverUrl(json.url);
    } catch (e) {
      alert(L(['Görsel yüklenemedi. Tekrar deneyin.', 'Could not upload image. Please try again.'], lang));
      console.error(e);
    } finally {
      setUploading(false);
    }
  };

  const save = async (notify: boolean) => {
    if (saving) return;
    if (!hasName) {
      alert(L(['Lütfen etkinlik adını girin.', 'Please enter an event name.'], lang));
      return;
    }
    if (timeWithoutDate) {
      alert(L(['Saat girdiniz ama tarih seçmediniz. Lütfen bir tarih seçin.', 'You entered a time but no date. Please pick a date.'], lang));
      return;
    }
    if (dateWithoutTime) {
      alert(L(['Tarih seçtiniz ama başlangıç saati girmediniz. Lütfen başlangıç saatini girin.', 'You picked a date but no start time. Please enter a start time.'], lang));
      return;
    }
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
    } catch (e) {
      // Server actions redirect by throwing NEXT_REDIRECT — that's success, not an error.
      if ((e as { digest?: string })?.digest?.startsWith('NEXT_REDIRECT')) {
        savedRef.current = true;
        if (coverUrl !== originalCoverUrl.current) deleteUrl(originalCoverUrl.current);
        throw e;
      }
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
                <TimeSelect value={start} onChange={setStart} placeholder={L(['Seçin…', 'Select…'], lang)} />
              </div>
              <div>
                <label className="flabel">{L(['Bitiş', 'End'], lang)}</label>
                <TimeSelect value={end} onChange={setEnd} placeholder={L(['Seçin…', 'Select…'], lang)} />
              </div>
            </div>
            <div>
              <label className="flabel">{L(['Kapasite', 'Capacity'], lang)}</label>
              <input className="finput" type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
            </div>
          </div>
          {(timeWithoutDate || dateWithoutTime) && (
            <div className="form-sec__d" style={{ color: 'var(--danger)', marginTop: 6 }}>
              {timeWithoutDate
                ? L(['Saatin kaydedilebilmesi için bir tarih seçin.', 'Pick a date so the time can be saved.'], lang)
                : L(['Tarihin kaydedilebilmesi için başlangıç saatini girin.', 'Enter a start time so the date can be saved.'], lang)}
            </div>
          )}
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
          {opt.recurring && (
            <div className="events-recurring-panel">
              <div className="events-recurring-row">
                <label className="flabel">{L(['Tekrar tipi', 'Repeat type'], lang)}</label>
                <div className="seg-pills">
                  {([
                    ['daily', L(['Her gün', 'Daily'], lang)],
                    ['weekly', L(['Haftalık', 'Weekly'], lang)],
                    ['custom', L(['Özel günler', 'Custom days'], lang)],
                  ] as const).map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      className={['seg-pill', opt.recurringType === val ? 'on' : null].filter(Boolean).join(' ')}
                      onClick={() => setOpt((o) => ({ ...o, recurringType: val, recurringDays: [] }))}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {opt.recurringType === 'custom' && (
                <div className="events-recurring-row">
                  <label className="flabel">{L(['Günler', 'Days'], lang)}</label>
                  <div className="seg-pills">
                    {(lang === 'tr'
                      ? ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz']
                      : ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
                    ).map((label, i) => {
                      const dayIndex = i === 6 ? 0 : i + 1; // Mon=1…Sun=0
                      const active = opt.recurringDays.includes(dayIndex);
                      return (
                        <button
                          key={dayIndex}
                          type="button"
                          className={['seg-pill', active ? 'on' : null].filter(Boolean).join(' ')}
                          onClick={() => setOpt((o) => ({
                            ...o,
                            recurringDays: active
                              ? o.recurringDays.filter((d) => d !== dayIndex)
                              : [...o.recurringDays, dayIndex].sort(),
                          }))}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="events-recurring-row">
                <label className="flabel">{L(['Bitiş tarihi', 'End date'], lang)}</label>
                <div className="dateinput events-dateinput" style={{ maxWidth: 240 }}>
                  <CalendarDays size={16} />
                  <input
                    type="date"
                    lang="en-GB"
                    value={opt.recurringUntil ?? ''}
                    min={date || undefined}
                    onChange={(e) => setOpt((o) => ({ ...o, recurringUntil: e.target.value || null }))}
                    style={inputBase}
                  />
                </div>
                <span className="flabel" style={{ marginTop: 4, fontWeight: 400, color: 'var(--text-3)' }}>
                  {L(['Boş bırakılırsa süresiz tekrarlanır.', 'Leave empty to repeat indefinitely.'], lang)}
                </span>
              </div>
            </div>
          )}
        </section>
      </div>

      <aside className="events-create-side">
        <section className="card">
          <div className="card__body">
            <label className="flabel">{L(['Kapak görseli', 'Cover image'], lang)}</label>
            <label
              className="cover-drop"
              style={{ cursor: uploading ? 'wait' : 'pointer', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={async (e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (!file) return;
                await uploadFile(file);
              }}
            >
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'inherit' }}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  await uploadFile(file);
                  e.target.value = '';
                }}
              />
              {coverUrl ? (
                <>
                  <img src={coverUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--r-md)', position: 'absolute', inset: 0 }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.35)', borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: 0, transition: 'opacity .2s' }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
                  >
                    <ImageIcon size={22} color="#fff" />
                    <span style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>{L(['Değiştir', 'Replace'], lang)}</span>
                  </div>
                </>
              ) : uploading ? (
                <><ImageIcon size={26} /><span className="cell-sub">{L(['Yükleniyor…', 'Uploading…'], lang)}</span></>
              ) : (
                <><ImageIcon size={26} /><span className="cell-sub">{L(['Tıkla veya sürükle · JPEG, PNG, WebP · maks 8 MB', 'Click or drag · JPEG, PNG, WebP · max 8 MB'], lang)}</span></>
              )}
            </label>
            {coverUrl && (
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                style={{ marginTop: 8, width: '100%' }}
                onClick={() => {
                  // If the current photo was uploaded this session (not the original), delete it now.
                  if (coverUrl !== originalCoverUrl.current) deleteUrl(coverUrl);
                  pendingDeleteUrl.current = null;
                  setCoverUrl('');
                }}
              >
                {L(['Görseli kaldır', 'Remove image'], lang)}
              </button>
            )}
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

// 24-hour HH:mm options in 15-minute steps (00:00 … 23:45).
const TIME_OPTIONS: string[] = (() => {
  const out: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      out.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  return out;
})();

/** 24-hour time picker — locale-independent, always emits HH:mm. */
function TimeSelect({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  // If an existing value is off-grid (e.g. 16:05), keep it selectable.
  const options = value && !TIME_OPTIONS.includes(value) ? [value, ...TIME_OPTIONS] : TIME_OPTIONS;
  return (
    <div className="dateinput events-dateinput">
      <Clock size={16} />
      <select value={value} onChange={(e) => onChange(e.target.value)} style={inputBase}>
        <option value="">{placeholder}</option>
        {options.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>
      <ChevronDown size={16} />
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
