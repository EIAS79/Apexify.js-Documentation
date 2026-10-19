"use client";
import { XMarkIcon, ArrowsPointingOutIcon } from "@heroicons/react/24/outline";
import type { ComponentType, ReactNode, SVGProps } from "react";
export type IconType = ComponentType<SVGProps<SVGSVGElement>>;
export function IconButton({
  label,
  onClick,
  children,
  active,
  disabled = false,
}: {
  label: string;
  onClick?: () => void;
  children: ReactNode;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={`aw-icon-button${active ? " is-active" : ""}`}
      title={label}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
export function Panel({
  title,
  icon: Icon,
  children,
  actions,
  onClose,
  onMaximize,
  className = "",
}: {
  title: string;
  icon?: IconType;
  children: ReactNode;
  actions?: ReactNode;
  onClose: () => void;
  onMaximize?: () => void;
  className?: string;
}) {
  return (
    <section className={`aw-panel ${className}`} aria-label={`${title} panel`}>
      <header className="aw-panel-header">
        <div className="aw-panel-title">
          {Icon ? <Icon /> : null}
          <span>{title}</span>
        </div>
        <div className="aw-panel-actions">
          {actions}
          {onMaximize ? (
            <IconButton label={`Maximize ${title}`} onClick={onMaximize}>
              <ArrowsPointingOutIcon />
            </IconButton>
          ) : null}
          <IconButton label={`Close ${title}`} onClick={onClose}>
            <XMarkIcon />
          </IconButton>
        </div>
      </header>
      <div className="aw-panel-content">{children}</div>
    </section>
  );
}
export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="aw-field">
      <span>{label}</span>
      {children}
    </label>
  );
}
export function NumberField({
  label,
  value,
  onChange,
  min = -4096,
  max = 4096,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <Field label={label}>
      <input
        aria-label={label}
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          if (e.target.value !== "") {
            const n = Number(e.target.value);
            if (Number.isFinite(n)) onChange(Math.max(min, Math.min(max, n)));
          }
        }}
      />
    </Field>
  );
}
