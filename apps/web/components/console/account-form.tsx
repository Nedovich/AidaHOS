import Link from 'next/link';
import { Check } from 'lucide-react';
import { L, type Lang } from '@/lib/i18n';
import { PLAN_OPTIONS } from '@/lib/plans';
import { Crumb, FormFoot, FormRow, FormSection } from './form';

const STATUSES: [string, readonly [string, string]][] = [
  ['active', ['Aktif', 'Active']],
  ['trial', ['Deneme', 'Trial']],
  ['suspended', ['Askıda', 'Suspended']],
  ['archived', ['Arşiv', 'Archived']],
];

export interface AccountFormDefaults {
  name: string;
  slug?: string;
  status?: string;
  ownerUserId?: string | null;
  region?: string | null;
  plan?: string;
}

export function AccountForm({
  action,
  defaults,
  mode,
  lang,
  embedded,
  users,
}: {
  action: (fd: FormData) => void;
  defaults?: AccountFormDefaults;
  mode: 'new' | 'edit';
  lang: Lang;
  embedded?: boolean;
  users: { id: string; name: string; email: string }[];
}) {
  const isEdit = mode === 'edit';
  const planOpts = PLAN_OPTIONS(lang);
  return (
    <>
      {!embedded && (
        <>
          <Crumb parent={L(['Hesaplar', 'Accounts'], lang)} parentHref="/accounts" current={isEdit ? L(['Düzenle', 'Edit'], lang) : L(['Yeni hesap', 'New account'], lang)} />
          <div className="page-hero">
            <div>
              <h1 className="page-hero__h">{isEdit ? L(['Hesabı düzenle', 'Edit account'], lang) : L(['Yeni hesap oluştur', 'Create new account'], lang)}</h1>
              <p className="page-hero__sub">
                {isEdit
                  ? L(['Otel grubu hesabının bilgilerini güncelleyin.', 'Update this hotel-group account.'], lang)
                  : L(['Yeni bir otel grubu hesabı açın, sahibini ve planı atayın.', 'Open a new hotel-group account, assign owner and plan.'], lang)}
              </p>
            </div>
          </div>
        </>
      )}

      <form action={action}>
        <div className="set-wrap" style={{ maxWidth: 760 }}>
          <FormSection title={L(['Organizasyon', 'Organization'], lang)} sub={L(['Otel grubu (şirket) kimliği.', 'Hotel group (company) identity.'], lang)}>
            <FormRow label={L(['Hesap adı', 'Account name'], lang)}>
              <input name="name" className="pb-input" defaultValue={defaults?.name} required minLength={2} placeholder="Örn. Esken Otel Group" />
            </FormRow>
            <FormRow label={L(['Bölge / ülke', 'Region / country'], lang)}>
              <input name="region" className="pb-input" defaultValue={defaults?.region ?? ''} placeholder={L(['Şehir, Ülke', 'City, Country'], lang)} />
            </FormRow>
            {isEdit && (
              <>
                <FormRow label="Slug" desc={L(['Sistemde benzersiz kimlik (otomatik).', 'Unique identifier (auto).'], lang)}>
                  <input className="pb-input" defaultValue={defaults?.slug} disabled />
                </FormRow>
                <FormRow label={L(['Durum', 'Status'], lang)}>
                  <select name="status" className="pb-select" defaultValue={defaults?.status}>
                    {STATUSES.map(([v, l]) => (
                      <option key={v} value={v}>{L(l, lang)}</option>
                    ))}
                  </select>
                </FormRow>
              </>
            )}
          </FormSection>

          <FormSection
            title={L(['Hesap sahibi', 'Account owner'], lang)}
            sub={L(
              ['Sistemdeki bir kullanıcıyı seçin — bu grubun admin’i olur. Şimdilik boş bırakıp sonra atayabilirsiniz.',
                'Pick an existing user — they become this group’s admin. You can leave it empty and assign later.'],
              lang,
            )}
          >
            <FormRow label={L(['Sahip (kullanıcı)', 'Owner (user)'], lang)} desc={L(['Seçilen kişi grup admini olur.', 'The selected person becomes the group admin.'], lang)}>
              <select name="ownerUserId" className="pb-select" defaultValue={defaults?.ownerUserId ?? ''}>
                <option value="">{L(['Yok (sonra ata)', 'None (assign later)'], lang)}</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} · {u.email}
                  </option>
                ))}
              </select>
            </FormRow>
          </FormSection>

          <FormSection title={L(['Plan', 'Plan'], lang)} sub={L(['Abonelik planı; limitler buradan devralınır.', 'Subscription plan; limits inherit from it.'], lang)}>
            <FormRow label={L(['Plan', 'Plan'], lang)}>
              <select name="plan" className="pb-select" defaultValue={defaults?.plan ?? 'scale'}>
                {planOpts.map((p) => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </FormRow>
          </FormSection>

          <FormFoot note={isEdit ? L(['Değişiklikler kaydedildiğinde uygulanır.', 'Changes apply when saved.'], lang) : L(['Hesap hemen oluşturulur.', 'The account is created immediately.'], lang)}>
            <Link className="btn btn--subtle btn--sm" href="/accounts">{L(['Vazgeç', 'Cancel'], lang)}</Link>
            <button className="btn btn--primary btn--sm" type="submit">
              <Check size={15} /> {isEdit ? L(['Kaydet', 'Save'], lang) : L(['Hesap oluştur', 'Create account'], lang)}
            </button>
          </FormFoot>
        </div>
      </form>
    </>
  );
}
