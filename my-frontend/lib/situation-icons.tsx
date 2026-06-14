import type { ReactNode } from "react";

export type SituationIconName =
  | "cart"
  | "restaurant"
  | "hospital"
  | "bus"
  | "salon"
  | "bank"
  | "taxi"
  | "cafe"
  | "hotel"
  | "school"
  | "other";

type IconComponent = (props: { className?: string }) => ReactNode;

function CartIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="8" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
    </svg>
  );
}

function RestaurantIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
      <path d="M7 2v20" />
      <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
    </svg>
  );
}

function HospitalIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 21h18" />
      <path d="M7 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16" />
      <path d="M3 21v-9a2 2 0 0 1 2-2h2" />
      <path d="M17 10h2a2 2 0 0 1 2 2v9" />
      <path d="M12 7v4" />
      <path d="M10 9h4" />
    </svg>
  );
}

function BusIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 17H4v-9c0-1.1.9-2 2-2h12c1.6 0 3 1.2 3.4 2.7l.6 2.3v4c0 1.1-.9 2-2 2h-1" />
      <circle cx="17" cy="17" r="2" />
      <path d="M9 17h6" />
      <circle cx="7" cy="17" r="2" />
      <path d="M4 11h18" />
      <path d="M10 6v5" />
      <path d="M15 6v5" />
    </svg>
  );
}

function SalonIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <line x1="20" y1="4" x2="8.12" y2="15.88" />
      <line x1="14.47" y1="14.48" x2="20" y2="20" />
      <line x1="8.12" y1="8.12" x2="12" y2="12" />
    </svg>
  );
}

function BankIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 9h16l-8-6-8 6Z" />
      <path d="M6 12v6" />
      <path d="M10 12v6" />
      <path d="M14 12v6" />
      <path d="M18 12v6" />
      <path d="M3 21h18" />
    </svg>
  );
}

function TaxiIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
      <circle cx="7" cy="17" r="2" />
      <path d="M9 17h6" />
      <circle cx="17" cy="17" r="2" />
    </svg>
  );
}

function CafeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
      <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
      <line x1="6" x2="6" y1="2" y2="4" />
      <line x1="10" x2="10" y1="2" y2="4" />
      <line x1="14" x2="14" y1="2" y2="4" />
    </svg>
  );
}

function HotelIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 4v16" />
      <path d="M2 8h18a2 2 0 0 1 2 2v10" />
      <path d="M2 17h20" />
      <path d="M6 8v9" />
    </svg>
  );
}

function SchoolIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m4 6 8-4 8 4" />
      <path d="m18 10 4 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8l4-2" />
      <path d="M14 22v-4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v4" />
      <path d="M18 5v17" />
      <path d="M6 5v17" />
      <circle cx="12" cy="9" r="2" />
    </svg>
  );
}

function OtherIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

/** Map of icon name → React component */
export const SITUATION_ICONS: Record<string, IconComponent> = {
  cart: CartIcon,
  restaurant: RestaurantIcon,
  hospital: HospitalIcon,
  bus: BusIcon,
  salon: SalonIcon,
  bank: BankIcon,
  taxi: TaxiIcon,
  cafe: CafeIcon,
  hotel: HotelIcon,
  school: SchoolIcon,
  other: OtherIcon,
};

/** Ordered list of available icon names for dropdown selectors */
export const SITUATION_ICON_NAMES: SituationIconName[] = [
  "cart",
  "restaurant",
  "hospital",
  "bus",
  "salon",
  "bank",
  "taxi",
  "cafe",
  "hotel",
  "school",
  "other",
];

/** Display labels for each icon (Vietnamese) */
export const SITUATION_ICON_LABELS: Record<SituationIconName, string> = {
  cart: "スーパー",
  restaurant: "レストラン",
  hospital: "病院",
  bus: "バス",
  salon: "美容室",
  bank: "銀行",
  taxi: "タクシー",
  cafe: "カフェ",
  hotel: "ホテル",
  school: "学校",
  other: "その他",
};

/**
 * Render a situation icon by name.
 * Falls back to OtherIcon when the name is not found.
 */
export function SituationIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Component = SITUATION_ICONS[name] ?? SITUATION_ICONS.other;
  return <Component className={className} />;
}
