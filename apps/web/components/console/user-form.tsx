'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { L } from '@/lib/i18n';
import { Crumb, FormFoot, FormRow, FormSection } from './form';
import { useLang } from './lang-provider';

export interface UserFormDefaults {
  name?: string;
  email?: string;
  role?: 'super_admin' | 'admin' | 'user' | 'customer';
  banned?: boolean;
  hotelGroupId?: string | null;
  hotelId?: string | null;
}

export function UserForm({
  action,
  groups,
  hotels,
  defaults,
  mode,
  embedded,
  backHref = '/users',
  roles = ['super_admin', 'admin', 'user'],
}: {
  action: (fd: FormData) => void;
  groups: { id: string; name: string }[];
  hotels: { id: string; name: string }[];
  defaults?: UserFormDefaults;
  mode: 'new' | 'edit';
  embedded?: boolean;
  backHref?: string;
  roles?: ('super_admin' | 'admin' | 'user')[];
}) {
  const lang = useLang();
  const isEdit = mode === 'edit';
  const initialRole =
    defaults?.role && roles.includes(defaults.role as 'super_admin' | 'admin' | 'user')
      ? (defaults.role as 'super_admin' | 'admin' | 'user')
      : roles[0]!;
  const [role, setRole] = useState<'super_admin' | 'admin' | 'user'>(initialRole);

  return (
    <>
      {!embedded && (
        <>
          <Crumb parent={L(['Kullanıcılar', 'Users'], lang)} parentHref={backHref} current={isEdit ? L(['Düzenle', 'Edit'], lang) : L(['Yeni kullanıcı', 'New user'], lang)} />
          <div className="page-hero">
            <div>
              <h1 className="page-hero__h">{isEdit ? L(['Kullanıcıyı düzenle', 'Edit user'], lang) : L(['Yeni kullanıcı oluştur', 'Create new user'], lang)}</h1>
              <p className="page-hero__sub">
                {isEdit ? L(['Rolü, atandığı yeri ve erişimi güncelleyin.', 'Update role, assignment and access.'], lang) : L(['Bir yönetici hesabı açın ve tenant’a atayın.', 'Open a manager account and assign a tenant.'], lang)}
              </p>
            </div>
          </div>
        </>
      )}

      <form action={action}>
        <div className="set-wrap" style={{ maxWidth: 760 }}>
          <FormSection title={L(['Kimlik', 'Identity'], lang)} sub={L(['Hesaplar yöneticiler tarafından oluşturulur (açık kayıt yok).', 'Accounts are created by admins (no open sign-up).'], lang)}>
            <FormRow label={L(['Ad Soyad', 'Full name'], lang)}>
              <input name="name" className="pb-input" defaultValue={defaults?.name} required minLength={2} placeholder={L(['Örn. Admin Bir', 'e.g. Admin One'], lang)} />
            </FormRow>
            <FormRow label={L(['E-posta', 'Email'], lang)}>
              <input name="email" type="email" className="pb-input" defaultValue={defaults?.email} required disabled={isEdit} placeholder="ornek@otel.com" />
            </FormRow>
            {!isEdit && (
              <FormRow label={L(['Parola', 'Password'], lang)} desc={L(['En az 8 karakter.', 'At least 8 characters.'], lang)}>
                <input name="password" type="password" className="pb-input" required minLength={8} placeholder="••••••••" />
              </FormRow>
            )}
          </FormSection>

          <FormSection title={L(['Rol & Erişim', 'Role & Access'], lang)} sub={L(['Rol, kullanıcının panel yetkisini ve kapsamını belirler.', "Role sets the user's console permissions and scope."], lang)}>
            <FormRow label={L(['Rol', 'Role'], lang)}>
              <select name="role" className="pb-select" value={role} onChange={(e) => setRole(e.target.value as typeof role)}>
                {roles.includes('user') && <option value="user">{L(['Kullanıcı (otel yöneticisi)', 'User (hotel manager)'], lang)}</option>}
                {roles.includes('admin') && <option value="admin">{L(['Admin (grup yöneticisi)', 'Admin (group manager)'], lang)}</option>}
                {roles.includes('super_admin') && <option value="super_admin">{L(['Süper Admin', 'Super Admin'], lang)}</option>}
              </select>
            </FormRow>
            {role === 'admin' && (
              <FormRow label={L(['Otel Grubu', 'Hotel Group'], lang)} desc={L(['Yönettiği grup.', 'The group they manage.'], lang)}>
                <select name="hotelGroupId" className="pb-select" defaultValue={defaults?.hotelGroupId ?? ''} required>
                  <option value="">{L(['Grup seçin…', 'Select a group…'], lang)}</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </FormRow>
            )}
            {role === 'user' && (
              <FormRow label={L(['Otel', 'Hotel'], lang)} desc={L(['Yönettiği tesis.', 'The property they manage.'], lang)}>
                <select name="hotelId" className="pb-select" defaultValue={defaults?.hotelId ?? ''} required>
                  <option value="">{L(['Otel seçin…', 'Select a hotel…'], lang)}</option>
                  {hotels.map((h) => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
              </FormRow>
            )}
            {isEdit && (
              <FormRow label={L(['Erişim', 'Access'], lang)} center>
                <label style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 'var(--text-base)', color: 'var(--text-2)' }}>
                  <input type="checkbox" name="banned" defaultChecked={defaults?.banned} /> {L(['Hesabı engelle', 'Ban account'], lang)}
                </label>
              </FormRow>
            )}
          </FormSection>

          <FormFoot note={isEdit ? L(['Rol/atama değişikliği erişimi anında etkiler.', 'Role/assignment changes affect access immediately.'], lang) : L(['Kullanıcı hemen oluşturulur.', 'The user is created immediately.'], lang)}>
            <Link className="btn btn--subtle btn--sm" href={backHref}>{L(['Vazgeç', 'Cancel'], lang)}</Link>
            <button className="btn btn--primary btn--sm" type="submit">
              <Check size={15} /> {isEdit ? L(['Kaydet', 'Save'], lang) : L(['Kullanıcı oluştur', 'Create user'], lang)}
            </button>
          </FormFoot>
        </div>
      </form>
    </>
  );
}
