'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, Cloud, Server } from 'lucide-react';
import { L, type Lang } from '@/lib/i18n';
import { Crumb, FormFoot, FormRow, FormSection } from './form';
import { SubmitButton } from './submit-button';

const STATUSES: [string, readonly [string, string]][] = [
  ['active', ['Aktif', 'Active']],
  ['trial', ['Deneme', 'Trial']],
  ['suspended', ['Askıda', 'Suspended']],
  ['archived', ['Arşiv', 'Archived']],
];

type Backend = 'central_freeradius' | 'local_mikrotik';

export interface HotelFormDefaults {
  name?: string;
  status?: string;
  hotelGroupId?: string;
  radiusBackend?: string | null;
  mikrotikIp?: string | null;
  exitIp?: string | null;
  nasSecret?: string | null;
  mikrotikApiUser?: string | null;
  mikrotikApiPassword?: string | null;
  mikrotikApiPort?: number | null;
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
  const [backend, setBackend] = useState<Backend>(
    defaults?.radiusBackend === 'local_mikrotik' ? 'local_mikrotik' : 'central_freeradius',
  );

  const BackendCard = ({ value, icon, title, sub }: { value: Backend; icon: React.ReactNode; title: string; sub: string }) => {
    const on = backend === value;
    return (
      <button
        type="button"
        onClick={() => setBackend(value)}
        style={{
          flex: 1,
          textAlign: 'left',
          cursor: 'pointer',
          padding: '14px 16px',
          borderRadius: 'var(--radius)',
          border: `1px solid ${on ? 'var(--accent)' : 'var(--border)'}`,
          background: on ? 'var(--accent-soft)' : 'var(--surface)',
          display: 'flex',
          gap: 12,
          alignItems: 'flex-start',
          transition: 'all .15s',
        }}
      >
        <div style={{ color: on ? 'var(--accent)' : 'var(--text-3)', marginTop: 2 }}>{icon}</div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 'var(--text-base)', color: on ? 'var(--accent)' : 'var(--text)' }}>{title}</div>
          <div className="cell-sub" style={{ marginTop: 2 }}>{sub}</div>
        </div>
      </button>
    );
  };

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
        <input type="hidden" name="radiusBackend" value={backend} />
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

          <FormSection
            title={L(['RADIUS backend', 'RADIUS backend'], lang)}
            sub={L(['Bu otel hangi RADIUS’u kullanacak? Seçime göre alanlar değişir.', 'Which RADIUS does this hotel use? Fields change with the choice.'], lang)}
          >
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <BackendCard
                value="central_freeradius"
                icon={<Cloud size={20} />}
                title={L(['Bizim FreeRADIUS', 'Our FreeRADIUS'], lang)}
                sub={L(['AidaHOS sunucusuna NAS + kullanıcı yazılır.', 'NAS + users written to AidaHOS server.'], lang)}
              />
              <BackendCard
                value="local_mikrotik"
                icon={<Server size={20} />}
                title={L(['Otelin kendi MikroTik’i', "Hotel's own MikroTik"], lang)}
                sub={L(['Otelin MikroTik’ine RouterOS API ile (Tailscale).', "To hotel's MikroTik via RouterOS API (Tailscale)."], lang)}
              />
            </div>
          </FormSection>

          {backend === 'central_freeradius' ? (
            <FormSection
              title={L(['Ağ & FreeRADIUS', 'Network & FreeRADIUS'], lang)}
              sub={L(['MikroTik ağ geçidi ve NAS bilgileri — FreeRADIUS nas tablosuna yazılır.', 'MikroTik gateway & NAS — written to the FreeRADIUS nas table.'], lang)}
            >
              <FormRow label="MikroTik IP">
                <input name="mikrotikIp" className="pb-input" defaultValue={defaults?.mikrotikIp ?? ''} placeholder="10.10.0.1" />
              </FormRow>
              <FormRow label={L(['Çıkış IP', 'Exit IP'], lang)} desc={L(['RADIUS’un MikroTik’i gördüğü public IP.', 'Public IP RADIUS sees the MikroTik from.'], lang)}>
                <input name="exitIp" className="pb-input" defaultValue={defaults?.exitIp ?? ''} placeholder="37.155.20.172" />
              </FormRow>
              <FormRow label="NAS Secret" desc={L(['MikroTik ↔ FreeRADIUS paylaşılan sırrı.', 'MikroTik ↔ FreeRADIUS shared secret.'], lang)}>
                <input name="nasSecret" className="pb-input mono" defaultValue={defaults?.nasSecret ?? ''} />
              </FormRow>
            </FormSection>
          ) : (
            <FormSection
              title={L(['MikroTik API', 'MikroTik API'], lang)}
              sub={L(['Otelin MikroTik’ine RouterOS v7 REST API ile bağlanılır (Tailscale üzerinden).', "Connects to the hotel's MikroTik via RouterOS v7 REST API (over Tailscale)."], lang)}
            >
              <FormRow label={L(['MikroTik host / IP', 'MikroTik host / IP'], lang)} desc={L(['Tailscale IP/host ya da erişilebilir IP.', 'Tailscale IP/host or reachable IP.'], lang)}>
                <input name="mikrotikIp" className="pb-input" defaultValue={defaults?.mikrotikIp ?? ''} placeholder="100.x.y.z" />
              </FormRow>
              <FormRow label={L(['API port', 'API port'], lang)} desc={L(['REST için varsayılan 443.', 'Default 443 for REST.'], lang)}>
                <input name="mikrotikApiPort" type="number" className="pb-input" defaultValue={defaults?.mikrotikApiPort ?? ''} placeholder="443" />
              </FormRow>
              <FormRow label={L(['API kullanıcı', 'API user'], lang)}>
                <input name="mikrotikApiUser" className="pb-input" defaultValue={defaults?.mikrotikApiUser ?? ''} placeholder="aidahos" />
              </FormRow>
              <FormRow label={L(['API parola', 'API password'], lang)}>
                <input name="mikrotikApiPassword" type="password" className="pb-input mono" defaultValue={defaults?.mikrotikApiPassword ?? ''} />
              </FormRow>
            </FormSection>
          )}

          <FormFoot note={isEdit ? L(['Değişiklikler kaydedildiğinde uygulanır.', 'Changes apply when saved.'], lang) : L(['Otel kurulum durumunda oluşturulur.', 'The hotel is created in setup state.'], lang)}>
            <Link className="btn btn--subtle btn--sm" href="/hotels">
              {L(['Vazgeç', 'Cancel'], lang)}
            </Link>
            <SubmitButton className="btn btn--primary btn--sm">
              <Check size={15} /> {isEdit ? L(['Kaydet', 'Save'], lang) : L(['Otel oluştur', 'Create hotel'], lang)}
            </SubmitButton>
          </FormFoot>
        </div>
      </form>
    </>
  );
}
