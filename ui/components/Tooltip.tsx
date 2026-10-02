import { cloneElement, useEffect, useId, useRef, useState, type ReactElement } from 'react';

export type TooltipProps = { children: ReactElement; content: string };

export function Tooltip({ children, content }: TooltipProps) {
  const [open, setOpen] = useState(false);

  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLSpanElement>(null);
  const hoveredRef = useRef(false);
  const focusedRef = useRef(false);
  const dismissedRef = useRef(false);
  const closeTimeoutRef = useRef<number | undefined>(undefined);

  const tooltipId = useId();
  const child = children as ReactElement<{ 'aria-describedby'?: string }>;
  const describedBy = [child.props['aria-describedby'], open ? tooltipId : undefined].filter(Boolean).join(' ') || undefined;

  useEffect(() => () => window.clearTimeout(closeTimeoutRef.current), []);

  useEffect(() => {
    const tooltip = tooltipRef.current;
    const trigger = triggerRef.current;
    if (!open || !tooltip || !trigger) return;

    tooltip.showPopover();
    function positionTooltip() {
      const bounds = trigger?.getBoundingClientRect();
      if (!bounds || !tooltip) return;

      const width = tooltip.offsetWidth;
      const height = tooltip.offsetHeight;
      const left = Math.max(8, Math.min(bounds.left + bounds.width / 2 - width / 2, window.innerWidth - width - 8));
      const top = bounds.bottom + height + 8 <= window.innerHeight
        ? bounds.bottom + 6
        : Math.max(8, bounds.top - height - 6);
      tooltip.style.left = `${left}px`;
      tooltip.style.top = `${top}px`;
    }
    function dismissOnEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;

      dismissedRef.current = true;
      setOpen(false);
    }
    positionTooltip();
    window.addEventListener('resize', positionTooltip);
    window.addEventListener('scroll', positionTooltip, true);
    document.addEventListener('keydown', dismissOnEscape);
    return () => {
      tooltip.hidePopover();
      window.removeEventListener('resize', positionTooltip);
      window.removeEventListener('scroll', positionTooltip, true);
      document.removeEventListener('keydown', dismissOnEscape);
    };
  }, [open, content]);

  function updateOpen() {
    if (!hoveredRef.current && !focusedRef.current) dismissedRef.current = false;
    setOpen((hoveredRef.current || focusedRef.current) && !dismissedRef.current);
  }

  function handleMouseEnter() {
    window.clearTimeout(closeTimeoutRef.current);
    hoveredRef.current = true;
    updateOpen();
  }

  function handleMouseLeave() {
    window.clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = window.setTimeout(() => {
      hoveredRef.current = false;
      updateOpen();
    }, 120);
  }

  return (
    <span
      ref={triggerRef}
      className="yb-tooltip-trigger"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={() => { focusedRef.current = true; updateOpen(); }}
      onBlur={(event) => {
        if (event.currentTarget.contains(event.relatedTarget)) return;
        focusedRef.current = false;
        updateOpen();
      }}
    >
      {cloneElement(child, { 'aria-describedby': describedBy })}
      <span
        ref={tooltipRef}
        id={tooltipId}
        className="yb-tooltip"
        role="tooltip"
        popover="manual"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {content}
      </span>
    </span>
  );
}
