"use client";
import { XMarkIcon, ArrowsPointingOutIcon } from "@heroicons/react/24/outline";
import {cloneElement, isValidElement, useEffect,useId,useState} from "react";
import type { ComponentType, ReactNode, SVGProps, ReactElement } from "react";
import ControlHelp from './ControlHelp';
import {controlHelp,readableLabel} from '../control-help';
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
  tabs,
  tabPanelId,
}: {
  title: string;
  icon?: IconType;
  children: ReactNode;
  actions?: ReactNode;
  onClose: () => void;
  onMaximize?: () => void;
  className?: string;
  tabs?: ReactNode;
  tabPanelId?: string;
}) {
  return (
    <section className={`aw-panel ${className}`} aria-label={`${title} panel`}
      id={tabPanelId} role={tabPanelId ? "tabpanel" : undefined}
      aria-labelledby={tabPanelId ? tabPanelId + "-tab" : undefined}>
      <header className="aw-panel-header">
        {tabs ?? <div className="aw-panel-title">
          {Icon ? <Icon /> : null}
          <span>{title}</span>
        </div>}
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
  help,
}: {
  label: string;
  children: ReactNode;
  help?: string;
}) {
  const id=useId();
  const directControl=isValidElement(children)&&typeof children.type==='string'&&['input','select','textarea'].includes(children.type);
  return (
    <div className="aw-field">
      <div className="aw-field-label"><label htmlFor={directControl?id:undefined}>{readableLabel(label)}</label><ControlHelp label={label} description={help}/></div>
      {directControl?cloneElement(children as ReactElement,{id}):children}
    </div>
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
  // Preserve intermediate drafts: never silently clamp a valid-looking numeric edit.
  // A complete in-range value commits immediately (also works with browser .fill);
  // incomplete/out-of-range drafts are restored on blur rather than corrupting history.
  const [draft,setDraft]=useState(String(value));
  useEffect(()=>setDraft(String(value)),[value]);
  const valid=(text:string):number|undefined=>{
    if(!text.trim())return undefined;
    const n=Number(text);
    return Number.isFinite(n)&&n>=min&&n<=max?n:undefined;
  };
  return (
    <Field label={label} help={`${controlHelp(label)} Supported range: ${min} to ${max}${step!==1?`; step ${step}`:''}.`}>
      <input
        aria-label={label}
        type="number"
        value={draft}
        min={min}
        max={max}
        step={step}
        title={'Supported Workspace range: '+min+' to '+max}
        onChange={(e)=>{
          const text=e.target.value;
          setDraft(text);
          const n=valid(text);
          if(n!==undefined&&n!==value)onChange(n);
        }}
        onBlur={()=>{
          const n=valid(draft);
          if(n===undefined)setDraft(String(value));
          else if(n!==value)onChange(n);
        }}
      />
    </Field>
  );
}
