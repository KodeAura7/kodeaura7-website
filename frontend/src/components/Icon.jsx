import { Icon as IconifyIcon } from '@iconify/react';

export default function Icon({ icon, width = 18, className = '' }) {
  return <IconifyIcon icon={icon} width={width} className={className} aria-hidden="true" />;
}
