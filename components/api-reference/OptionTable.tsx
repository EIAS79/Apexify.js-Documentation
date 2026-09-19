"use client";

import { Fragment, useMemo, useState } from 'react';
import type { ApiOption } from '@/lib/api-reference/schema';
import { InlineEnumValueList } from './EnumValueList';

type AllowedValue = string | number | boolean | null;

function flatten(options: ApiOption[]): ApiOption[] {
  return options.flatMap((option) => [option, ...flatten(option.children || [])]);
}

const fragment = (path: string) =>
  `option-${path.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase()}`;

function DefaultValue({ option: o }: { option: ApiOption }) {
  return (
    <>
      {o.defaultState === 'explicit' ? (
        <code>{JSON.stringify(o.defaultValue)}</code>
      ) : o.defaultState === 'required' ? (
        'Required'
      ) : o.defaultState === 'runtime' ? (
        'Runtime-dependent'
      ) : o.defaultState === 'derived' ? (
        'Derived'
      ) : (
        '—'
      )}
    </>
  );
}

function CapabilityValue({ option: o }: { option: ApiOption }) {
  return <>{o.capabilityIds?.length ? o.capabilityIds.join(', ') : '—'}</>;
}

function AllowedValues({ values }: { values?: AllowedValue[] }) {
  if (!values?.length) return <>—</>;

  if (values.length <= 4) {
    return <InlineEnumValueList values={values} />;
  }

  return (
    <details className="apx-api-enum-details">
      <summary>
        <span>{values.length} values</span>
        <span aria-hidden>+</span>
      </summary>
      <div className="apx-api-enum-details__body">
        <InlineEnumValueList values={values} />
      </div>
    </details>
  );
}

function OptionPath({ path }: { path: string }) {
  const parts = path.split('.');
  const leaf = parts.pop() ?? path;
  const prefix = parts.join('.');

  return (
    <code className="apx-api-option-path">
      {prefix ? <span className="apx-api-option-path__prefix">{prefix}.</span> : null}
      <span className="apx-api-option-path__leaf">{leaf}</span>
    </code>
  );
}

function groupName(path: string) {
  return path.split('.')[0] || 'options';
}

export function OptionCard({ option: o }: { option: ApiOption }) {
  return (
    <article
      id={`${fragment(o.path)}-card`}
      className="apx-api-option-card"
      data-doc4-component="OptionCard"
    >
      <div className="apx-api-option-card__head">
        <h3>
          <a href={`#${fragment(o.path)}`}>
            <OptionPath path={o.path} />
          </a>
        </h3>
        <span className="apx-api-contract-pill" data-required={o.required ? 'true' : 'false'}>
          {o.required ? 'Required' : 'Optional'}
        </span>
      </div>

      <p className="apx-api-option-card__description">{o.description}</p>

      <dl>
        <div>
          <dt>Type</dt>
          <dd><code>{o.type.text}</code></dd>
        </div>
        <div>
          <dt>Default</dt>
          <dd><DefaultValue option={o} /></dd>
        </div>
        <div>
          <dt>Allowed</dt>
          <dd><AllowedValues values={o.allowedValues as AllowedValue[] | undefined} /></dd>
        </div>
        <div>
          <dt>Runtime</dt>
          <dd>{o.runtimeTargets.join(', ')}</dd>
        </div>
        {o.capabilityIds?.length ? (
          <div>
            <dt>Capabilities</dt>
            <dd><CapabilityValue option={o} /></dd>
          </div>
        ) : null}
      </dl>
    </article>
  );
}

export function OptionTable({
  options,
  ownerLabel,
}: {
  options: ApiOption[];
  ownerLabel: string;
}) {
  const [query, setQuery] = useState('');
  const rows = useMemo(() => flatten(options), [options]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((o) =>
      [
        o.path,
        o.description,
        o.type.text,
        ...(o.allowedValues || []).map(String),
        ...(o.capabilityIds || []),
      ].some((value) => value.toLowerCase().includes(q)),
    );
  }, [query, rows]);

  return (
    <section data-doc4-component="OptionTable" aria-labelledby="api-options-heading">
      <div className="apx-api-option-search">
        <label htmlFor="api-option-search">Search {ownerLabel} options</label>
        <input
          id="api-option-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="name, path, type, value, capability…"
        />
        <span aria-live="polite" className="apx-api-option-count">
          <strong>{filtered.length}</strong>
          <span> / {rows.length} option paths</span>
        </span>
      </div>

      <div
        className="apx-api-option-table-wrap"
        tabIndex={0}
        role="group"
        aria-label={`${ownerLabel} option table`}
      >
        <table>
          <colgroup>
            <col className="apx-api-col-option" />
            <col className="apx-api-col-type" />
            <col className="apx-api-col-contract" />
            <col className="apx-api-col-values" />
            <col className="apx-api-col-availability" />
          </colgroup>
          <thead>
            <tr>
              <th scope="col">Option</th>
              <th scope="col">Type</th>
              <th scope="col">Contract</th>
              <th scope="col">Allowed values</th>
              <th scope="col">Runtime & capabilities</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o, index) => {
              const currentGroup = groupName(o.path);
              const previousGroup = index > 0 ? groupName(filtered[index - 1].path) : null;
              const showGroup = currentGroup !== previousGroup;

              return (
                <Fragment key={o.id}>
                  {showGroup ? (
                    <tr className="apx-api-option-group-row">
                      <td colSpan={5}>
                        <span>{currentGroup}</span>
                      </td>
                    </tr>
                  ) : null}
                  <tr id={fragment(o.path)} data-option-path={o.path}>
                    <th scope="row">
                      <a href={`#${fragment(o.path)}`} aria-label={`Permalink to ${o.path}`}>
                        <OptionPath path={o.path} />
                      </a>
                      <span className="apx-api-option-description">{o.description}</span>
                      <span className="apx-api-option-row-badges">
                        {o.stability === 'DEPRECATED' ? (
                          <span className="apx-badge" data-status="deprecated">Deprecated</span>
                        ) : null}
                        {o.animatable ? (
                          <span className="apx-badge" data-kind="capability">Animatable</span>
                        ) : null}
                      </span>
                    </th>
                    <td className="apx-api-type-cell"><code>{o.type.text}</code></td>
                    <td className="apx-api-contract-cell">
                      <span className="apx-api-contract-pill" data-required={o.required ? 'true' : 'false'}>
                        {o.required ? 'Required' : 'Optional'}
                      </span>
                      <span className="apx-api-default-line">
                        <span>Default</span>
                        <DefaultValue option={o} />
                      </span>
                    </td>
                    <td>
                      <AllowedValues values={o.allowedValues as AllowedValue[] | undefined} />
                    </td>
                    <td className="apx-api-availability-cell">
                      <span className="apx-api-runtime-line">{o.runtimeTargets.join(' · ')}</span>
                      {o.capabilityIds?.length ? (
                        <span className="apx-api-capability-line">
                          <strong>Capabilities</strong>
                          <CapabilityValue option={o} />
                        </span>
                      ) : null}
                    </td>
                  </tr>
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="apx-api-option-cards">
        {filtered.map((o) => <OptionCard key={o.id} option={o} />)}
      </div>
    </section>
  );
}
