import {
  ArrowUpRight,
  Clock,
  MessageSquare,
  Monitor,
  Phone,
  Smartphone,
  Video,
} from "lucide-react";

const icons = {
  video: Video,
  phone: Phone,
  smartphone: Smartphone,
  message: MessageSquare,
  monitor: Monitor,
  clock: Clock,
  "arrow-up-right": ArrowUpRight,
};

export function HeaderButtonIcon({ name, size = 16 }) {
  if (name === "whatsapp")
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
        data-header-icon={name}
      >
        <path d="M21 11.5a9 9 0 0 1-13.4 7.9L3 21l1.6-4.6A9 9 0 1 1 21 11.5Z" />
        <path d="m8.1 6.8 1.6-.3 1.1 2.7-1.1 1.1a7.5 7.5 0 0 0 3 3l1.1-1.1 2.7 1.1-.3 1.6c-.1.7-.8 1.2-1.5 1.1-4.2-.6-7.5-3.9-8.1-8.1-.1-.7.4-1.4 1.1-1.5Z" />
      </svg>
    );
  const Icon = icons[name] || ArrowUpRight;
  return (
    <Icon
      size={size}
      aria-hidden="true"
      focusable="false"
      data-header-icon={name}
    />
  );
}
