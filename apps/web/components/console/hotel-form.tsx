import Link from 'next/link';
import { Check } from 'lucide-react';
import { L, type Lang } from '@/lib/i18n';
import { Crumb, FormFoot, FormRow, FormSection } from './form';

const STATUSES: [string, readonly [string, string]][] = [
  ['active', ['Aktif', 'Active']],
  ['trial', ['Deneme', 'Trial']],
  ['suspended', ['Askıda', 'Suspended']],
  ['archived', ['Arşiv', 'Archived']],
];

export interface HotelFormDefaults {
  name?: string;
  status?: string;
  hotelGroupId?: string;
  mikrotikIp?: string | null;
  exitIp?: string | null;
  nasSecret?: string | null;
}

export function HotelForm({
  action,
  groups,
  defaults,
  mode,
  lang,
  embedded,
}: {
  action: (fd: FormData) => void;
  groups: { id: string; name: string }[];
  defaults?: HotelFormDefaults;
  mode: 'new' | 'edit';
  lang: Lang;
  embedded?: boolean;
}) {
  const isEdit = mode === 'edit';
  return (
    <>
      {!embedded && (
        <>
          <Crumb parent={L(['Oteller', 'Hotels'], lang)} parentHref="/hotels" current={isEdit ? L(['Düzenle', 'Edit'], lang) : L(['Yeni otel', 'New hotel'], lang)} />
          <div className="page-hero">
            <div>
              <h1 className="page-hero__h">{isEdit ? L(['Oteli düzenle', 'Edit hotel'], lang) : L(['Yeni otel ekle', 'Add new hotel'], lang)}</h1>
              <p className="page-hero__sub">
                {isEdit
                  ? L(['Tesis bilgilerini ve ağ provisioning ayarlarını güncelleyin.', 'Update property info and network provisioning.'], lang)
                  : L(['Bir hesaba yeni bir tesis bağlayın ve ağını kurun.', 'Attach a property to an account and set up its network.'], lang)}
              </p>
            </div>
          </div>
        </>
      )}

      <form action={action}>
        <div className="set-wrap" style={{ maxWidth: 760 }}>
          <FormSection title={L(['Tesis bilgileri', 'Property information'], lang)} sub={L(['Otelin temel kimlik bilgileri.', "The hotel's core identity."], lang)}>
            <FormRow label={L(['Otel adı', 'Hotel name'], lang)}>
              <input name="name" className="pb-input" defaultValue={defaults?.name} required minLength={2} placeholder="Örn. Esken Hotel Bodrum" />
            </FormRow>
            <FormRow label={L(['Hesap', 'Account'], lang)} desc={L(['Bu otelin bağlı olacağı grup.', 'The group this hotel belongs to.'], lang)}>
              <select name="hotelGroupId" className="pb-select" defaultValue={defaults?.hotelGroupId ?? ''} required>
                <option value="">{L(['Grup seçin…', 'Select a group…'], lang)}</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </FormRow>
            {isEdit && (
              <FormRow label={L(['Durum', 'Status'], lang)}>
                <select name="status" className="pb-select" defaultValue={defaults?.status}>
                  {STATUSES.map(([v, l]) => (
                    <option key={v} value={v}>
                      {L(l, lang)}
                    </option>
                  ))}
                </select>
              </FormRow>
            )}
          </FormSection>

          <FormSection title={L(['Ağ & RADIUS', 'Network & RADIUS'], lang)} sub={L(["MikroTik ağ geçidi ve RADIUS bilgileri — Faz 3'te FreeRADIUS nas tablosuna yazılır.", 'MikroTik gateway & RADIUS — written to FreeRADIUS nas in Phase 3.'], lang)}>
            <FormRow label="MikroTik IP">
              <input name="mikrotikIp" className="pb-input" defaultValue={defaults?.mikrotikIp ?? ''} placeholder="10.10.0.1" />
            </FormRow>
            <FormRow label={L(['Çıkış IP', 'Exit IP'], lang)}>
              <input name="exitIp" className="pb-input" defaultValue={defaults?.exitIp ?? ''} placeholder="37.155.20.172" />
            </FormRow>
            <FormRow label="NAS Secret" desc={L(['MikroTik ↔ FreeRADIUS paylaşılan sırrı.', 'MikroTik ↔ FreeRADIUS shared secret.'], lang)}>
              <input name="nasSecret" className="pb-input mono" defaultValue={defaults?.nasSecret ?? ''} />
            </FormRow>
          </FormSection>

          <FormFoot note={isEdit ? L(['Değişiklikler kaydedildiğinde uygulanır.', 'Changes apply when saved.'], lang) : L(['Otel kurulum durumunda oluşturulur.', 'The hotel is created in setup state.'], lang)}>
            <Link className="btn btn--subtle btn--sm" href="/hotels">
              {L(['Vazgeç', 'Cancel'], lang)}
            </Link>
            <button className="btn btn--primary btn--sm" type="submit">
              <Check size={15} /> {isEdit ? L(['Kaydet', 'Save'], lang) : L(['Otel oluştur', 'Create hotel'], lang)}
            </button>
          </FormFoot>
        </div>
      </form>
    </>
  );
}
