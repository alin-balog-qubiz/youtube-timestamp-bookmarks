import {
  IconAlertTriangle, IconBookmark, IconCheck, IconChevronDown, IconCopy,
  IconDeviceDesktop, IconDots, IconDownload, IconExternalLink, IconInfoCircle,
  IconMoon, IconPencil, IconPlayerPlay, IconSearch, IconSun, IconTrash,
  IconUpload, IconX,
} from '@tabler/icons-react';

const icons = {
  search: IconSearch,
  close: IconX,
  more: IconDots,
  chevron: IconChevronDown,
  play: IconPlayerPlay,
  info: IconInfoCircle,
  warning: IconAlertTriangle,
  bookmark: IconBookmark,
  check: IconCheck,
  copy: IconCopy,
  edit: IconPencil,
  trash: IconTrash,
  external: IconExternalLink,
  sun: IconSun,
  moon: IconMoon,
  system: IconDeviceDesktop,
  download: IconDownload,
  upload: IconUpload,
} as const;

export type IconName = keyof typeof icons;
export type IconProps = { name: IconName; size?: 'small' | 'default'; label?: string };

export function Icon({ name, size = 'default', label }: IconProps) {
  const OutlineIcon = icons[name];

  return (
    <OutlineIcon
      className={`yb-icon yb-icon--${size}`}
      size={size === 'small' ? 15 : 18}
      stroke={1.8}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    />
  );
}
