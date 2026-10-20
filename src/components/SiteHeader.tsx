import { MapPin, Phone } from 'lucide-react';

export const MGG_SITE = 'https://www.mggpanama.com/';
export const MGG_LOGO = 'https://www.mggpanama.com/wp-content/uploads/2021/09/mgg-favicon.png';

export function SiteHeader() {
  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <a href={MGG_SITE} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <img src={MGG_LOGO} alt="" className="size-10 rounded-md" />
          <span className="text-base font-semibold">MGG Panamá</span>
        </a>
        <div className="flex flex-col gap-1 text-sm text-muted-foreground sm:items-end">
          <a href="tel:+5073979424" className="inline-flex items-center gap-1.5 hover:text-foreground">
            <Phone className="size-4" /> 397-9424
          </a>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="size-4" /> Calle Séptima, Río Abajo, Ciudad de Panamá
          </span>
        </div>
      </div>
    </header>
  );
}
