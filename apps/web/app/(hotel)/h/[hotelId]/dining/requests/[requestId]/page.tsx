import Link from 'next/link';
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Check,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  ExternalLink,
  Gift,
  Heart,
  Layers,
  Leaf,
  Mail,
  MapPin,
  Phone,
  Plus,
  Shield,
  Star,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { GAvatar, Subhero } from '@/components/console/survey-helpers';
import { L, type Lang } from '@/lib/i18n';
import { getLang } from '@/lib/i18n-server';

type RequestType = 'allergy' | 'vegan' | 'anniv' | 'vip' | 'seating' | 'birthday';
type RequestTone = 'danger' | 'success' | 'purple' | 'warning' | 'info' | 'accent';
type ToneMeta = {
  color: string;
  soft: string;
  priority: readonly [string, string];
};
type GuestRequest = {
  id: string;
  index: number;
  guest: string;
  room: string;
  type: RequestType;
  title: readonly [string, string];
  body: readonly [string, string];
  when: readonly [string, string];
  icon: LucideIcon;
  tone: RequestTone;
};

type DetailTag = {
  icon: LucideIcon;
  label: readonly [string, string];
  tone: RequestTone;
};

const TONES: Record<RequestTone, { color: string; soft: string }> = {
  danger: { color: 'var(--danger)', soft: 'var(--danger-soft)' },
  success: { color: 'var(--success)', soft: 'var(--success-soft)' },
  purple: { color: 'var(--purple)', soft: 'var(--purple-soft)' },
  warning: { color: 'var(--warning)', soft: 'var(--warning-soft)' },
  info: { color: 'var(--info)', soft: 'var(--info-soft)' },
  accent: { color: 'var(--accent)', soft: 'var(--accent-soft)' },
};

const REQUESTS: GuestRequest[] = [
  {
    id: 'req-402-001',
    index: 1,
    guest: 'Eleanor James',
    room: '402',
    type: 'allergy',
    title: ['Alerji Notu', 'Allergy Note'],
    body: [
      'Fıstık ve kabuklu deniz ürünleri alerjisi. Mutfak bilgilendirildi.',
      'Peanut and shellfish allergy. Kitchen notified.',
    ],
    when: ['Bugün 12:40', 'Today 12:40'],
    icon: Shield,
    tone: 'danger',
  },
  {
    id: 'req-210-002',
    index: 2,
    guest: 'Familie Hoffmann',
    room: '210',
    type: 'vegan',
    title: ['Vegan Talebi', 'Vegan Request'],
    body: [
      "3 vegan menü, akşam yemeği için A'la Carte.",
      "3 vegan menus for dinner at A'la Carte.",
    ],
    when: ['Bugün 09:15', 'Today 09:15'],
    icon: Leaf,
    tone: 'success',
  },
  {
    id: 'req-615-003',
    index: 3,
    guest: 'Davide Russo',
    room: '615',
    type: 'anniv',
    title: ['Yıldönümü Yemeği', 'Anniversary Dinner'],
    body: [
      'Sürpriz pasta ve manzaralı masa talebi. Saat 21:00.',
      'Surprise cake and a table with a view. 21:00.',
    ],
    when: ['Dün 18:20', 'Yesterday 18:20'],
    icon: Heart,
    tone: 'purple',
  },
  {
    id: 'req-718-004',
    index: 4,
    guest: 'Lena Bauer',
    room: '718',
    type: 'vip',
    title: ['VIP Rezervasyon', 'VIP Reservation'],
    body: [
      'Genel müdür misafiri — özel ilgi ve karşılama içeceği.',
      'GM guest — special attention and welcome drink.',
    ],
    when: ['Dün 14:05', 'Yesterday 14:05'],
    icon: Star,
    tone: 'warning',
  },
  {
    id: 'req-312-005',
    index: 5,
    guest: 'Sarah Palmer',
    room: '312',
    type: 'seating',
    title: ['Özel Oturma Talebi', 'Special Seating'],
    body: ['Sahil kenarı, sessiz bölge tercihi.', 'Beachside, quiet area preferred.'],
    when: ['2 gün önce', '2 days ago'],
    icon: MapPin,
    tone: 'info',
  },
  {
    id: 'req-508-006',
    index: 6,
    guest: 'Ahmet Yıldız',
    room: '508',
    type: 'birthday',
    title: ['Doğum Günü Yemeği', 'Birthday Dinner'],
    body: [
      'Çocuk için doğum günü kutlaması, balon süsleme.',
      'Birthday celebration for a child, balloon decoration.',
    ],
    when: ['2 gün önce', '2 days ago'],
    icon: Gift,
    tone: 'accent',
  },
];

function priorityFor(type: RequestType): ToneMeta {
  if (type === 'allergy')
    return {
      ...TONES.danger,
      priority: ['Kritik · Mutfak uyarısı', 'Critical · Kitchen alert'],
    };
  if (type === 'vip')
    return {
      ...TONES.warning,
      priority: ['Yüksek · VIP misafir', 'High · VIP guest'],
    };
  if (type === 'anniv' || type === 'birthday')
    return {
      ...TONES.purple,
      priority: ['Yüksek · Özel kutlama', 'High · Special occasion'],
    };
  if (type === 'vegan')
    return {
      ...TONES.success,
      priority: ['Orta · Menü hazırlığı', 'Medium · Menu preparation'],
    };
  return {
    ...TONES.info,
    priority: ['Orta · Tercih notu', 'Medium · Preference note'],
  };
}

function teamFor(type: RequestType) {
  if (type === 'allergy')
    return {
      dept: ['Mutfak', 'Kitchen'] as const,
      person: 'Andrea Ricci',
      role: ['Baş Şef', 'Head Chef'] as const,
    };
  if (type === 'vegan')
    return {
      dept: ['Mutfak', 'Kitchen'] as const,
      person: 'Lucia Romano',
      role: ['Souschef', 'Sous Chef'] as const,
    };
  if (type === 'anniv' || type === 'birthday')
    return {
      dept: ['Servis', 'Service'] as const,
      person: 'Marco Bianchi',
      role: ['Şef Garson', 'Head Waiter'] as const,
    };
  if (type === 'vip')
    return {
      dept: ['Yönetim', 'Management'] as const,
      person: 'Lara Conti',
      role: ['Restoran Müdürü', 'Restaurant Manager'] as const,
    };
  return {
    dept: ['Servis', 'Service'] as const,
    person: 'Hannah Weiss',
    role: ['Hostes', 'Host'] as const,
  };
}

function tagsFor(type: RequestType): DetailTag[] {
  if (type === 'allergy')
    return [
      { tone: 'danger', icon: Shield, label: ['Fıstık', 'Peanut'] },
      { tone: 'danger', icon: Shield, label: ['Deniz ürünü', 'Shellfish'] },
    ];
  if (type === 'vegan')
    return [
      { tone: 'success', icon: Leaf, label: ['Vegan', 'Vegan'] },
      { tone: 'success', icon: Leaf, label: ['Bitki bazlı', 'Plant-based'] },
    ];
  if (type === 'anniv')
    return [
      { tone: 'purple', icon: Heart, label: ['Yıldönümü', 'Anniversary'] },
      { tone: 'accent', icon: Gift, label: ['Sürpriz pasta', 'Surprise cake'] },
    ];
  if (type === 'birthday')
    return [
      { tone: 'accent', icon: Gift, label: ['Doğum günü', 'Birthday'] },
      { tone: 'purple', icon: Star, label: ['Çocuk misafir', 'Child guest'] },
    ];
  if (type === 'vip')
    return [
      { tone: 'warning', icon: Star, label: ['VIP', 'VIP'] },
      { tone: 'accent', icon: Gift, label: ['Karşılama içeceği', 'Welcome drink'] },
    ];
  return [{ tone: 'info', icon: MapPin, label: ['Oturma tercihi', 'Seating preference'] }];
}

function checklistFor(type: RequestType) {
  if (type === 'allergy')
    return [
      { done: true, label: ['Mutfak bilgilendirildi', 'Kitchen notified'] as const },
      {
        done: true,
        label: [
          'Alerjen kartı misafir dosyasına eklendi',
          'Allergen card added to guest profile',
        ] as const,
      },
      { done: false, label: ['Servis ekibi brifingi', 'Service team briefing'] as const },
      { done: false, label: ['Yedek menü hazırlığı onayı', 'Backup menu prep approval'] as const },
    ];
  if (type === 'anniv' || type === 'birthday')
    return [
      {
        done: true,
        label: [
          "Pasta siparişi pâtisserie'ye gönderildi",
          'Cake order sent to pâtisserie',
        ] as const,
      },
      { done: true, label: ['Manzaralı masa rezerve edildi', 'Table with view reserved'] as const },
      {
        done: false,
        label: [
          'Sürpriz zamanlaması ile servis koordinasyonu',
          'Coordinate surprise timing with service',
        ] as const,
      },
      {
        done: false,
        label: [
          'Fotoğrafçı veya hatıra düzenlemesi',
          'Photographer or keepsake arrangement',
        ] as const,
      },
    ];
  if (type === 'vegan')
    return [
      {
        done: true,
        label: ['Vegan menü seçenekleri belirlendi', 'Vegan menu options selected'] as const,
      },
      { done: false, label: ['Şef onayı', 'Chef approval'] as const },
      { done: false, label: ['Servis brifi', 'Service briefing'] as const },
    ];
  if (type === 'vip')
    return [
      { done: true, label: ['Genel Müdür bilgilendirildi', 'GM notified'] as const },
      { done: true, label: ['Karşılama içeceği planlandı', 'Welcome drink planned'] as const },
      { done: false, label: ['Özel masa atandı', 'Special table assigned'] as const },
      {
        done: false,
        label: ['Restoran müdürü karşılayacak', 'Restaurant manager to greet'] as const,
      },
    ];
  return [
    { done: true, label: ['Talep alındı', 'Request received'] as const },
    { done: false, label: ['Hostese iletildi', 'Forwarded to host'] as const },
    { done: false, label: ['Misafire onay mesajı', 'Confirmation message to guest'] as const },
  ];
}

export default async function DiningRequestDetailPage({
  params,
}: {
  params: Promise<{ hotelId: string; requestId: string }>;
}) {
  const { hotelId, requestId } = await params;
  const lang = await getLang();
  const base = `/h/${hotelId}/dining`;
  const request = REQUESTS.find((item) => item.id === requestId) ?? REQUESTS[0]!;
  const Icon = request.icon;
  const priority = priorityFor(request.type);
  const team = teamFor(request.type);
  const checklist = checklistFor(request.type);
  const doneCount = checklist.filter((item) => item.done).length;
  const progress = Math.round((doneCount / checklist.length) * 100);

  return (
    <div className="dining-request-detail fade-in">
      <Subhero
        backHref={`${base}/requests`}
        crumb={
          <>
            <Link href={`${base}/requests`}>{L(['Özel Talepler', 'Guest Requests'], lang)}</Link>
            <ChevronRight size={15} />
            <b>{`#REQ-${request.room}-${String(request.index).padStart(3, '0')}`}</b>
          </>
        }
        title={L(request.title, lang)}
        pill={
          <span
            className="catbadge dining-request-detail-priority"
            style={{ background: priority.soft, color: priority.color }}
          >
            <Icon size={12} />
            {L(priority.priority, lang)}
          </span>
        }
        sub={`${request.guest} · ${L(['Oda', 'Room'], lang)} ${request.room} · ${L(request.when, lang)}`}
        actions={
          <div className="page-hero__actions">
            <button className="btn btn--ghost" type="button">
              <Mail />
              {L(['Misafire mesaj', 'Message guest'], lang)}
            </button>
            <button className="btn btn--ghost" type="button">
              <ExternalLink />
              {L(['Yazdır', 'Print'], lang)}
            </button>
            <button className="btn btn--primary" type="button">
              <Check />
              {L(['Onayla & Tamamla', 'Acknowledge & complete'], lang)}
            </button>
          </div>
        }
      />

      <div className="dining-request-detail-grid">
        <main className="dining-request-detail-main">
          <section className="card">
            <div className="card__body">
              <div className="gprofile dining-request-profile">
                <GAvatar name={request.guest} size={48} />
                <div>
                  <div className="gprofile__name">{request.guest}</div>
                  <div className="gprofile__meta">
                    <Meta
                      label={L(['Oda', 'Room'], lang)}
                      value={`${request.room} · ${L(['Deluxe Oda', 'Deluxe Room'], lang)}`}
                    />
                    <Meta
                      label={L(['Konaklama', 'Stay'], lang)}
                      value={L(['10-14 Haz 2026', 'Jun 10-14, 2026'], lang)}
                    />
                    <Meta
                      label={L(['Misafir Tipi', 'Guest Type'], lang)}
                      value={L(['VIP · Sadakat Altın', 'VIP · Loyalty Gold'], lang)}
                    />
                    <Meta label={L(['Dil', 'Language'], lang)} value="English" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="card">
            <div className="card__body">
              <div className="card__title dining-card-title-icon">
                <Icon size={16} />
                {L(['Talep İçeriği', 'Request Details'], lang)}
              </div>

              <div
                className={`dining-request-card dining-request-card--${request.tone} dining-request-detail-summary`}
              >
                <div className="dining-request-card__icon">
                  <Icon size={18} />
                </div>
                <div>
                  <div className="dining-request-detail-summary-title">
                    {L(request.title, lang)}
                  </div>
                  <p className="dining-request-card__body">{L(request.body, lang)}</p>
                </div>
              </div>

              <div className="dining-request-detail-facts">
                <Fact
                  icon={<Phone size={14} />}
                  label={L(['Kaynak', 'Source'], lang)}
                  value={L(['Concierge', 'Concierge'], lang)}
                />
                <Fact label={L(['Oluşturma', 'Created'], lang)} value={L(request.when, lang)} />
                <Fact
                  label={L(['Hedef mekan', 'Target venue'], lang)}
                  value={L(["A'la Carte Restoran", "A'la Carte"], lang)}
                />
              </div>

              <div className="divider" />
              <div className="cell-sub dining-request-tags-label">
                {L(['Etiketler', 'Tags'], lang)}
              </div>
              <div className="tagrow">
                {tagsFor(request.type).map((tag) => {
                  const TagIcon = tag.icon;
                  const tone = TONES[tag.tone];
                  return (
                    <span
                      className="tag dining-request-detail-tag"
                      key={L(tag.label, lang)}
                      style={{ background: tone.soft, color: tone.color }}
                    >
                      <TagIcon size={12} />
                      {L(tag.label, lang)}
                    </span>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="card">
            <div className="card__body">
              <div className="dining-request-checklist-head">
                <div className="card__title dining-card-title-icon">
                  <Check size={16} />
                  {L(['Eylem Listesi', 'Action Checklist'], lang)}
                </div>
                <span className="cell-sub mono">{`${doneCount}/${checklist.length} · ${progress}%`}</span>
              </div>
              <div className="minibar dining-request-progress">
                <div
                  className="minibar__f"
                  style={{ width: `${progress}%`, background: TONES[request.tone].color }}
                />
              </div>
              <div className="dining-request-checklist">
                {checklist.map((item) => (
                  <div className="optrow dining-request-check-row" key={L(item.label, lang)}>
                    <span className={item.done ? 'set-chk on' : 'set-chk'}>
                      <Check size={13} />
                    </span>
                    <div className={item.done ? 'optrow__t is-done' : 'optrow__t'}>
                      {L(item.label, lang)}
                    </div>
                  </div>
                ))}
              </div>
              <button className="btn btn--subtle btn--sm dining-request-add-step" type="button">
                <Plus size={14} />
                {L(['Adım ekle', 'Add step'], lang)}
              </button>
            </div>
          </section>

          <section className="card">
            <div className="card__body">
              <div className="card__title dining-request-timeline-title">
                {L(['Aktivite Geçmişi', 'Activity Timeline'], lang)}
              </div>
              <div className="dining-request-timeline">
                <TimelineItem
                  color="var(--accent)"
                  icon={<Check size={10} />}
                  title={L(['Talep oluşturuldu', 'Request created'], lang)}
                  sub={`${L(['Concierge', 'Concierge'], lang)} · ${L(request.when, lang)}`}
                />
                <TimelineItem
                  color="var(--info)"
                  icon={<Mail size={10} />}
                  title={L(
                    ["Mutfak'a otomatik bildirim gönderildi", 'Auto-notification sent to Kitchen'],
                    lang,
                  )}
                  sub={`${L(['Sistem', 'System'], lang)} · ${L(request.when, lang)}`}
                />
                <TimelineItem
                  color="var(--success)"
                  icon={<Users size={10} />}
                  title={L(['Atama yapıldı', 'Assignment made'], lang)}
                  sub={`${team.person} (${L(team.role, lang)})`}
                />
                {request.type === 'allergy' ? (
                  <TimelineItem
                    color="var(--warning)"
                    icon={<Shield size={10} />}
                    title={L(
                      [
                        'Alerjen kartı misafir profiline işlendi',
                        'Allergen flag added to guest profile',
                      ],
                      lang,
                    )}
                    sub={L(['PMS senkron · 2 dk önce', 'PMS sync · 2m ago'], lang)}
                  />
                ) : null}
              </div>
            </div>
          </section>
        </main>

        <aside className="card dining-request-side">
          <div className="ipanel__sec">
            <div className="card__title dining-card-title-icon">
              <Zap size={16} />
              {L(['Hızlı İşlemler', 'Quick Actions'], lang)}
            </div>
          </div>
          <PanelSelect
            label={L(['Öncelik', 'Priority'], lang)}
            value={L(priority.priority, lang)}
            dot={priority.color}
          />
          <PanelSelect
            label={L(['Durum', 'Status'], lang)}
            value={L(['İşleme alındı', 'In progress'], lang)}
            dot="var(--accent)"
          />
          <div className="ipanel__sec">
            <div className="ipanel__l">{L(['Eylemler', 'Actions'], lang)}</div>
            <div className="dining-request-side-actions">
              <button className="btn btn--ghost" type="button">
                <Check size={15} />
                {L(['Tamamlandı olarak işaretle', 'Mark Completed'], lang)}
              </button>
              <button className="btn btn--ghost" type="button">
                <Users size={15} />
                {L(['Başka ekibe ata', 'Reassign team'], lang)}
              </button>
              <button className="btn btn--ghost" type="button">
                <Mail size={15} />
                {L(['Misafire mesaj', 'Message Guest'], lang)}
              </button>
              <Link className="btn btn--ghost" href={`${base}/reservations`}>
                <ClipboardList size={15} />
                {L(['Rezervasyona bağla', 'Link to reservation'], lang)}
              </Link>
              <button className="btn btn--subtle dining-request-cancel" type="button">
                <X size={15} />
                {L(['Talebi iptal et', 'Cancel Request'], lang)}
              </button>
            </div>
          </div>
          <div className="ipanel__sec">
            <div className="ipanel__l">{L(['Atanan Ekip', 'Assigned Team'], lang)}</div>
            <div className="stat-row">
              <span className="stat-row__k">
                <Layers size={15} />
                {L(['Departman', 'Department'], lang)}
              </span>
              <span className="stat-row__v">{L(team.dept, lang)}</span>
            </div>
            <div className="assignee dining-request-assignee">
              <GAvatar name={team.person} />
              <div>
                <div className="dining-request-assignee-name">{team.person}</div>
                <div className="cell-sub">{L(team.role, lang)}</div>
              </div>
            </div>
          </div>
          <div className="ipanel__sec">
            <div className="ipanel__l">{L(['İlgili Rezervasyon', 'Linked Reservation'], lang)}</div>
            <Link className="dining-request-linked-reservation" href={`${base}/reservations`}>
              <div>{L(["A'la Carte Restoran", "A'la Carte"], lang)} · 20:00</div>
              <span>{L(['Bugün · 2 kişi · Masa', 'Today · 2 guests · Table'], lang)} A-12</span>
            </Link>
          </div>
          <div className="ipanel__sec">
            <div className="ipanel__l">{L(['Dahili Notlar', 'Internal Notes'], lang)}</div>
            <textarea
              className="noteinput"
              placeholder={L(
                ['Bu talep hakkında not ekleyin...', 'Add a note about this request...'],
                lang,
              )}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="k">{label}</div>
      <div className="v">{value}</div>
    </div>
  );
}

function Fact({ icon, label, value }: { icon?: ReactNode; label: string; value: string }) {
  return (
    <div>
      <div className="cell-sub">{label}</div>
      <div className="dining-request-fact-value">
        {icon}
        {value}
      </div>
    </div>
  );
}

function TimelineItem({
  color,
  icon,
  title,
  sub,
}: {
  color: string;
  icon: ReactNode;
  title: string;
  sub: string;
}) {
  return (
    <div className="dining-request-timeline-item">
      <span className="dining-request-timeline-dot" style={{ background: color }}>
        {icon}
      </span>
      <div>
        <div className="dining-request-timeline-item-title">{title}</div>
        <div className="cell-sub">{sub}</div>
      </div>
    </div>
  );
}

function PanelSelect({ label, value, dot }: { label: string; value: string; dot: string }) {
  return (
    <div className="ipanel__sec">
      <div className="ipanel__l">{label}</div>
      <div className="fselect dining-request-panel-select">
        <span>
          <span className="ico-dot" style={{ background: dot }} />
          {value}
        </span>
        <ChevronDown size={16} />
      </div>
    </div>
  );
}
