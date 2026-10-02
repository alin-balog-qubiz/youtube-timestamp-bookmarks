import type { ButtonHTMLAttributes } from 'react';

import { Icon, type IconName } from './Icon';
import { Tooltip } from './Tooltip';

export type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  label: string;
  icon: IconName;
};

export function IconButton({ label, icon, className = '', type = 'button', ...props }: IconButtonProps) {
  return (
    <Tooltip content={label}>
      <button {...props} type={type} aria-label={label} className={`yb-icon-button ${className}`.trim()}>
        <Icon name={icon} />
      </button>
    </Tooltip>
  );
}
