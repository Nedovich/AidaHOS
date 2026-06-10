import { Eye, Send } from 'lucide-react';
import { getLang } from '@/lib/i18n-server';
import { L } from '@/lib/i18n';
import { PortalComposer } from '@/components/console/portal/portal-composer';

// Guest Portal composer — drag-and-drop builder + live phone preview for the mobile portal
// guests see. Mock data for now; persistence to the hotel + Publish wiring come in a later pass.
export default async function GuestPortalPage() {
  const lang = await getLang();
  return (
    <>
      <div className="page-hero">
        <div>
          <h1 className="page-hero__h">{L(['Misafir Portalı', 'Guest Portal'], lang)}</h1>
          <p className="page-hero__sub">
            {L([
              'Misafirlerinizin gördüğü mobil portalı sürükle-bırak ile tasarlayın ve markanıza göre özelleştirin.',
              'Compose the mobile portal your guests see — drag to arrange, brand it, and publish.',
            ], lang)}
          </p>
        </div>
        <div className="page-hero__actions">
          <span className="pb-status"><span className="ico-dot" />{L(['Taslak · yayınlanmamış değişiklikler', 'Draft · unpublished changes'], lang)}</span>
          <button className="btn btn--ghost" type="button"><Eye size={16} />{L(['Önizleme', 'Preview'], lang)}</button>
          <button className="btn btn--primary" type="button"><Send size={16} />{L(['Yayınla', 'Publish'], lang)}</button>
        </div>
      </div>
      <PortalComposer />
    </>
  );
}
