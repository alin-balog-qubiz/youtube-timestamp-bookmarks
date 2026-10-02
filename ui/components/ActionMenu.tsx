import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';

import type { IconName } from './Icon';

import { Icon } from './Icon';

import '../styles/overlays.css';

export interface ActionMenuProps {
  label: string;
  items: readonly {
    label: string;
    icon?: IconName;
    onSelect: () => void;
    danger?: boolean;
    disabled?: boolean;
  }[];
  disabled?: boolean;
}

export function ActionMenu({ label, items, disabled = false }: ActionMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const activeIndexRef = useRef(0);
  const searchRef = useRef({ text: '', time: 0 });

  const menuId = useId();
  const triggerId = useId();

  useEffect(() => {
    if (!menuOpen) return;

    const menu = menuRef.current;
    if (!menu) return;

    function dismiss(event: PointerEvent) {
      if (!(event.target instanceof Node) || menu?.contains(event.target) || triggerRef.current?.contains(event.target)) return;
      menu?.hidePopover();
      setMenuOpen(false);
      triggerRef.current?.focus({ preventScroll: true });
    }

    function reposition() {
      if (menu && triggerRef.current) positionMenu(menu, triggerRef.current);
    }

    function dismissOnEscape(event: globalThis.KeyboardEvent) {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      menu?.hidePopover();
      setMenuOpen(false);
      triggerRef.current?.focus({ preventScroll: true });
    }

    const resizeObserver = new ResizeObserver(reposition);
    resizeObserver.observe(menu);
    document.addEventListener('pointerdown', dismiss, true);
    document.addEventListener('keydown', dismissOnEscape, true);
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    window.visualViewport?.addEventListener('resize', reposition);
    window.visualViewport?.addEventListener('scroll', reposition);

    return () => {
      resizeObserver.disconnect();
      document.removeEventListener('pointerdown', dismiss, true);
      document.removeEventListener('keydown', dismissOnEscape, true);
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
      window.visualViewport?.removeEventListener('resize', reposition);
      window.visualViewport?.removeEventListener('scroll', reposition);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!disabled || !menuOpen) return;
    menuRef.current?.hidePopover();
    setMenuOpen(false);
  }, [disabled, menuOpen]);

  function openMenu(fromEnd = false) {
    const menu = menuRef.current;
    const trigger = triggerRef.current;
    if (disabled || !menu || !trigger) return;

    menu.showPopover();
    positionMenu(menu, trigger);
    setMenuOpen(true);
    searchRef.current = { text: '', time: 0 };
    const buttons = Array.from(menu.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)'));
    const index = fromEnd ? buttons.length - 1 : 0;
    activeIndexRef.current = Math.max(0, index);
    if (buttons[index]) buttons[index].focus();
    else menu.focus();
  }

  function closeMenu() {
    menuRef.current?.hidePopover();
    setMenuOpen(false);
    triggerRef.current?.focus({ preventScroll: true });
  }

  function navigateMenu(event: KeyboardEvent<HTMLDivElement>) {
    const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)'));
    const current = buttons.findIndex((button) => button === document.activeElement);
    let target = current < 0 ? activeIndexRef.current : current;

    if (event.key === 'Tab') {
      closeMenu();
      return;
    }

    if (buttons.length === 0) return;

    if (event.key === 'ArrowDown') target = (target + 1) % buttons.length;
    else if (event.key === 'ArrowUp') target = (target - 1 + buttons.length) % buttons.length;
    else if (event.key === 'Home') target = 0;
    else if (event.key === 'End') target = buttons.length - 1;
    else if (event.key.length === 1 && event.key !== ' ' && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const now = Date.now();
      const previous = searchRef.current;
      const text = now - previous.time < 700 ? previous.text + event.key.toLowerCase() : event.key.toLowerCase();
      searchRef.current = { text, time: now };
      const ordered = [...buttons.slice(target + 1), ...buttons.slice(0, target + 1)];
      const match = ordered.find((button) => button.textContent?.trim().toLowerCase().startsWith(text));
      if (match) target = buttons.indexOf(match);
    } else return;

    event.preventDefault();
    const targetButton = buttons[target];
    if (targetButton) {
      activeIndexRef.current = target;
      targetButton.focus();
    }
  }

  return (
    <span className="yb-action-menu">
      <button
        ref={triggerRef}
        id={triggerId}
        className="yb-action-menu-trigger"
        type="button"
        aria-label={label}
        title={label}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-controls={menuId}
        disabled={disabled}
        onClick={() => menuOpen ? closeMenu() : openMenu()}
        onKeyDown={(event) => {
          if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
          event.preventDefault();
          openMenu(event.key === 'ArrowUp');
        }}
      >
        <Icon name="more" />
      </button>

      <div
        ref={menuRef}
        id={menuId}
        className="yb-action-menu-panel"
        popover="manual"
        role="menu"
        aria-labelledby={triggerId}
        tabIndex={-1}
        onKeyDown={navigateMenu}
      >
        {items.map((item, index) => (
          <button
            key={`${item.label}-${index}`}
            type="button"
            role="menuitem"
            className={`yb-action-menu-item${item.danger ? ' yb-action-menu-item-danger' : ''}`}
            disabled={item.disabled}
            tabIndex={-1}
            onClick={() => {
              closeMenu();
              item.onSelect();
            }}
          >
            {item.icon && <Icon name={item.icon} size="small" />}
            {item.label}
          </button>
        ))}
      </div>
    </span>
  );
}

function positionMenu(menu: HTMLDivElement, trigger: HTMLButtonElement) {
  const margin = 8;
  const gap = 4;
  const viewport = window.visualViewport;
  const viewportLeft = viewport?.offsetLeft ?? 0;
  const viewportTop = viewport?.offsetTop ?? 0;
  const viewportWidth = viewport?.width ?? document.documentElement.clientWidth;
  const viewportHeight = viewport?.height ?? document.documentElement.clientHeight;
  menu.style.maxWidth = `${Math.max(0, viewportWidth - margin * 2)}px`;
  menu.style.maxHeight = `${Math.max(0, viewportHeight - margin * 2)}px`;

  const anchor = trigger.getBoundingClientRect();
  const bounds = menu.getBoundingClientRect();
  const left = Math.max(viewportLeft + margin, Math.min(anchor.right - bounds.width, viewportLeft + viewportWidth - bounds.width - margin));
  const below = anchor.bottom + gap;
  const preferredTop = below + bounds.height <= viewportTop + viewportHeight - margin ? below : anchor.top - bounds.height - gap;
  const top = Math.max(viewportTop + margin, Math.min(preferredTop, viewportTop + viewportHeight - bounds.height - margin));
  menu.style.left = `${left}px`;
  menu.style.top = `${top}px`;
}
