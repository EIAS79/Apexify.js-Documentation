'use client';

import { useEffect, useMemo, useState } from 'react';
import type { VisualNode, VisualValue } from '@/lib/studio/visual/model';
import {
  CHART_FAMILIES,
  CHART_FAMILY_OPTION_MATRIX,
  visualChartProps,
  type VisualChartFamily,
  type VisualChartNodeProps,
} from '@/lib/studio/visual/chart-contract';

type InspectorTab = 'style' | 'effects' | 'data' | 'advanced';

type Props = {
  node: VisualNode;
  tab: InspectorTab;
  onChange: (
    label: string,
    updater: (props: VisualChartNodeProps) => VisualChartNodeProps,
  ) => void;
};

type R = Record<string, any>;
const COLORS = ['#38bdf8', '#a78bfa', '#fb7185', '#34d399', '#fbbf24', '#60a5fa'];

function rec(value: unknown): R {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as R
    : {};
}

function rows(value: unknown): R[] {
  return Array.isArray(value) ? value.map(rec) : [];
}

function withOption(
  props: VisualChartNodeProps,
  key: string,
  value: unknown,
): VisualChartNodeProps {
  return {
    ...props,
    options: {
      ...rec(props.options),
      [key]: value,
    } as Record<string, VisualValue>,
  };
}

function titleOf(props: VisualChartNodeProps): R {
  const options = rec(props.options);
  return props.family === 'comparison'
    ? rec(options.generalTitle)
    : rec(rec(options.labels).title);
}

function withTitle(
  props: VisualChartNodeProps,
  patch: R,
): VisualChartNodeProps {
  const options = rec(props.options);
  if (props.family === 'comparison') {
    return withOption(props, 'generalTitle', {
      ...rec(options.generalTitle),
      ...patch,
    });
  }
  return withOption(props, 'labels', {
    ...rec(options.labels),
    title: {
      ...rec(rec(options.labels).title),
      ...patch,
    },
  });
}

function JsonEditor({
  label,
  value,
  testId,
  onApply,
}: {
  label: string;
  value: unknown;
  testId: string;
  onApply: (value: unknown) => void;
}) {
  const serialized = useMemo(() => JSON.stringify(value, null, 2), [value]);
  const [draft, setDraft] = useState(serialized);
  const [error, setError] = useState('');

  useEffect(() => {
    setDraft(serialized);
    setError('');
  }, [serialized]);

  return (
    <div className="apx-pre4-section">
      <div className="apx-pre4-section-title">{label}</div>
      <textarea
        data-chart-json-editor={testId}
        value={draft}
        rows={9}
        spellCheck={false}
        onChange={(event) => setDraft(event.target.value)}
        style={{
          width: '100%',
          resize: 'vertical',
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: 11,
        }}
      />
      {error ? <small style={{ color: '#fb7185' }}>{error}</small> : null}
      <button
        type="button"
        data-chart-json-apply={testId}
        onClick={() => {
          try {
            onApply(JSON.parse(draft));
            setError('');
          } catch (cause) {
            setError(cause instanceof Error ? cause.message : 'Invalid JSON');
          }
        }}
      >
        Apply {label.toLowerCase()}
      </button>
    </div>
  );
}

function SimpleRows({
  family,
  value,
  onChange,
}: {
  family: VisualChartFamily;
  value: R[];
  onChange: (value: R[]) => void;
}) {
  const isSlice =
    family === 'pie' || family === 'donut' || family === 'polarArea';
  const isBar = family === 'bar' || family === 'horizontalBar';

  return (
    <div className="apx-pre4-section" data-chart-data-table>
      <div className="apx-pre4-section-title">Data table</div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr>
              <th>Label</th>
              <th>{isSlice || isBar ? 'Value' : 'X'}</th>
              {!isSlice && !isBar ? <th>Y</th> : null}
              <th>Color</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {value.map((row, index) => (
              <tr key={index}>
                <td>
                  <input
                    value={String(row.label ?? '')}
                    aria-label={'Chart row ' + index + ' label'}
                    onChange={(event) => {
                      const next = value.map((item) => ({ ...item }));
                      next[index].label = event.target.value;
                      onChange(next);
                    }}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={Number(isSlice || isBar ? row.value ?? 0 : row.x ?? index)}
                    aria-label={'Chart row ' + index + ' value'}
                    onChange={(event) => {
                      const next = value.map((item) => ({ ...item }));
                      if (isSlice || isBar) next[index].value = Number(event.target.value);
                      else next[index].x = Number(event.target.value);
                      onChange(next);
                    }}
                  />
                </td>
                {!isSlice && !isBar ? (
                  <td>
                    <input
                      type="number"
                      value={Number(row.y ?? 0)}
                      aria-label={'Chart row ' + index + ' y'}
                      onChange={(event) => {
                        const next = value.map((item) => ({ ...item }));
                        next[index].y = Number(event.target.value);
                        onChange(next);
                      }}
                    />
                  </td>
                ) : null}
                <td>
                  <input
                    type="color"
                    value={
                      typeof row.color === 'string' && /^#[0-9a-f]{6}$/i.test(row.color)
                        ? row.color
                        : COLORS[index % COLORS.length]
                    }
                    onChange={(event) => {
                      const next = value.map((item) => ({ ...item }));
                      next[index].color = event.target.value;
                      onChange(next);
                    }}
                  />
                </td>
                <td>
                  <button
                    type="button"
                    aria-label={'Delete chart row ' + index}
                    onClick={() =>
                      onChange(value.filter((_, rowIndex) => rowIndex !== index))
                    }
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        type="button"
        data-chart-add-row
        onClick={() => {
          const index = value.length;
          onChange([
            ...value,
            isSlice || isBar
              ? {
                  label: 'Item ' + (index + 1),
                  value: 10,
                  color: COLORS[index % COLORS.length],
                }
              : {
                  label: 'Point ' + (index + 1),
                  x: index,
                  y: 10,
                  color: COLORS[index % COLORS.length],
                },
          ]);
        }}
      >
        ＋ Row
      </button>
    </div>
  );
}

function SeriesEditor({
  props,
  onApply,
}: {
  props: VisualChartNodeProps;
  onApply: (props: VisualChartNodeProps) => void;
}) {
  const data = rows(props.data);
  const [active, setActive] = useState(0);
  const index = Math.min(active, Math.max(0, data.length - 1));
  const series = data[index] ?? {
    label: 'Series 1',
    color: COLORS[0],
    data: [],
  };
  const radar = props.family === 'radar';
  const pointRows = rows(series.data).map((point, pointIndex) =>
    radar
      ? {
          label: point.label ?? 'Axis ' + (pointIndex + 1),
          value: point.value ?? 0,
          color: series.color,
        }
      : {
          label: 'P' + (pointIndex + 1),
          x: point.x ?? pointIndex,
          y: point.y ?? 0,
          color: series.color,
        },
  );

  const update = (next: R[]) =>
    onApply({
      ...props,
      data: next as unknown as VisualValue[],
    });

  return (
    <>
      <div className="apx-pre4-section" data-chart-series-editor>
        <div className="apx-pre4-section-title">Series</div>
        <label className="apx-pre4-field">
          <span>Active</span>
          <select
            value={index}
            onChange={(event) => setActive(Number(event.target.value))}
          >
            {data.map((item, itemIndex) => (
              <option key={itemIndex} value={itemIndex}>
                {String(item.label ?? 'Series ' + (itemIndex + 1))}
              </option>
            ))}
          </select>
        </label>
        {data.length ? (
          <>
            <label className="apx-pre4-field">
              <span>Label</span>
              <input
                value={String(series.label ?? '')}
                onChange={(event) => {
                  const next = data.map((item) => ({ ...item }));
                  next[index].label = event.target.value;
                  update(next);
                }}
              />
            </label>
            <label className="apx-pre4-field">
              <span>Color</span>
              <input
                type="color"
                value={
                  typeof series.color === 'string' &&
                  /^#[0-9a-f]{6}$/i.test(series.color)
                    ? series.color
                    : COLORS[index % COLORS.length]
                }
                onChange={(event) => {
                  const next = data.map((item) => ({ ...item }));
                  next[index].color = event.target.value;
                  update(next);
                }}
              />
            </label>
          </>
        ) : null}
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            data-chart-add-series
            onClick={() => {
              const nextIndex = data.length;
              update([
                ...data,
                {
                  label: 'Series ' + (nextIndex + 1),
                  color: COLORS[nextIndex % COLORS.length],
                  data: [
                    radar
                      ? { label: 'Axis 1', value: 10 }
                      : { x: 0, y: 10 },
                  ],
                },
              ]);
              setActive(nextIndex);
            }}
          >
            ＋ Series
          </button>
          {data.length > 1 ? (
            <button
              type="button"
              onClick={() => {
                update(data.filter((_, itemIndex) => itemIndex !== index));
                setActive(Math.max(0, index - 1));
              }}
            >
              Remove
            </button>
          ) : null}
        </div>
      </div>
      {data.length ? (
        <SimpleRows
          family={radar ? 'pie' : 'line'}
          value={pointRows}
          onChange={(nextRows) => {
            const next = data.map((item) => ({ ...item }));
            next[index] = {
              ...next[index],
              data: nextRows.map((row) =>
                radar
                  ? {
                      label: String(row.label ?? ''),
                      value: Number(row.value ?? 0),
                    }
                  : {
                      x: Number(row.x ?? 0),
                      y: Number(row.y ?? 0),
                    },
              ),
            };
            update(next);
          }}
        />
      ) : null}
    </>
  );
}

function DataEditor({
  props,
  onApply,
}: {
  props: VisualChartNodeProps;
  onApply: (props: VisualChartNodeProps) => void;
}) {
  const options = rec(props.options);

  if (props.family === 'comparison') {
    return (
      <>
        {(['chart1', 'chart2'] as const).map((key) => {
          const chart = rec(options[key]);
          return (
            <div className="apx-pre4-section" key={key} data-comparison-chart={key}>
              <div className="apx-pre4-section-title">
                {key === 'chart1' ? 'Chart A' : 'Chart B'}
              </div>
              <label className="apx-pre4-field">
                <span>Family</span>
                <select
                  value={String(chart.type ?? 'bar')}
                  onChange={(event) =>
                    onApply(
                      withOption(props, key, {
                        ...chart,
                        type: event.target.value,
                      }),
                    )
                  }
                >
                  {CHART_FAMILIES.filter(
                    (family) => family !== 'comparison' && family !== 'combo',
                  ).map((family) => (
                    <option key={family} value={family}>
                      {family}
                    </option>
                  ))}
                </select>
              </label>
              <JsonEditor
                label="Data"
                testId={'comparison-' + key}
                value={chart.data ?? []}
                onApply={(value) =>
                  onApply(
                    withOption(props, key, {
                      ...chart,
                      data: Array.isArray(value) ? value : [],
                    }),
                  )
                }
              />
            </div>
          );
        })}
      </>
    );
  }

  if (props.family === 'combo') {
    return (
      <>
        <SimpleRows
          family="bar"
          value={rows(options.bars)}
          onChange={(value) => onApply(withOption(props, 'bars', value))}
        />
        <JsonEditor
          label="Line series"
          testId="combo-lines"
          value={options.lines ?? []}
          onApply={(value) =>
            onApply(withOption(props, 'lines', Array.isArray(value) ? value : []))
          }
        />
      </>
    );
  }

  if (
    props.family === 'line' ||
    props.family === 'scatter' ||
    props.family === 'radar'
  ) {
    return <SeriesEditor props={props} onApply={onApply} />;
  }

  return (
    <SimpleRows
      family={props.family}
      value={rows(props.data)}
      onChange={(value) =>
        onApply({
          ...props,
          data: value as unknown as VisualValue[],
        })
      }
    />
  );
}

function StyleEditor({
  props,
  onApply,
}: {
  props: VisualChartNodeProps;
  onApply: (props: VisualChartNodeProps) => void;
}) {
  const options = rec(props.options);
  const title = titleOf(props);
  const appearance = rec(options.appearance);
  const legend = rec(options.legend);
  const grid = rec(options.grid);
  const axes = rec(options.axes);
  const xAxis = rec(axes.x);
  const yAxis = rec(axes.y);
  const series = rows(props.data);
  const firstSeries = rec(series[0]);

  return (
    <>
      <div className="apx-pre4-inspector-title">
        <div>
          <strong>{String(title.text ?? props.family + ' chart')}</strong>
          <small>{props.family} · native Apexify chart buffer</small>
        </div>
        <span className="apx-pre4-type-pill">chart</span>
      </div>
      <div className="apx-pre4-section" data-chart-title-style>
        <div className="apx-pre4-section-title">Title</div>
        <label className="apx-pre4-field">
          <span>Text</span>
          <input
            data-chart-title
            value={String(title.text ?? '')}
            onChange={(event) =>
              onApply(withTitle(props, { text: event.target.value }))
            }
          />
        </label>
        <label className="apx-pre4-field">
          <span>Size</span>
          <input
            type="number"
            min="8"
            value={Number(title.fontSize ?? 22)}
            onChange={(event) =>
              onApply(withTitle(props, { fontSize: Number(event.target.value) }))
            }
          />
        </label>
        <label className="apx-pre4-field">
          <span>Color</span>
          <input
            type="color"
            value={
              typeof title.color === 'string' &&
              /^#[0-9a-f]{6}$/i.test(title.color)
                ? title.color
                : '#f8fafc'
            }
            onChange={(event) =>
              onApply(withTitle(props, { color: event.target.value }))
            }
          />
        </label>
      </div>
      <div className="apx-pre4-section" data-chart-appearance>
        <div className="apx-pre4-section-title">Appearance</div>
        <label className="apx-pre4-field">
          <span>Background</span>
          <input
            type="color"
            value={
              typeof appearance.backgroundColor === 'string' &&
              /^#[0-9a-f]{6}$/i.test(appearance.backgroundColor)
                ? appearance.backgroundColor
                : '#0f172a'
            }
            onChange={(event) =>
              onApply(
                withOption(props, 'appearance', {
                  ...appearance,
                  backgroundColor: event.target.value,
                }),
              )
            }
          />
        </label>
      </div>
      {['line', 'scatter', 'bar', 'horizontalBar', 'combo'].includes(
        props.family,
      ) ? (
        <div className="apx-pre4-section" data-chart-style-axes>
          <div className="apx-pre4-section-title">Axes</div>
          <label className="apx-pre4-field">
            <span>X title</span>
            <input
              value={String(xAxis.label ?? '')}
              onChange={(event) =>
                onApply(
                  withOption(props, 'axes', {
                    ...axes,
                    x: { ...xAxis, label: event.target.value },
                  }),
                )
              }
            />
          </label>
          <label className="apx-pre4-field">
            <span>Y title</span>
            <input
              value={String(yAxis.label ?? '')}
              onChange={(event) =>
                onApply(
                  withOption(props, 'axes', {
                    ...axes,
                    y: { ...yAxis, label: event.target.value },
                  }),
                )
              }
            />
          </label>
        </div>
      ) : null}

      {['line', 'scatter', 'radar'].includes(props.family) && series.length ? (
        <div className="apx-pre4-section" data-chart-series-style>
          <div className="apx-pre4-section-title">Series presentation</div>
          <label className="apx-pre4-field">
            <span>First series color</span>
            <input
              type="color"
              value={
                typeof firstSeries.color === 'string' &&
                /^#[0-9a-f]{6}$/i.test(firstSeries.color)
                  ? firstSeries.color
                  : COLORS[0]
              }
              onChange={(event) => {
                const next = series.map((item) => ({ ...item }));
                next[0] = { ...next[0], color: event.target.value };
                onApply({
                  ...props,
                  data: next as unknown as VisualValue[],
                });
              }}
            />
          </label>
          {props.family !== 'radar' ? (
            <label className="apx-pre4-field">
              <span>Line width</span>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={Number(firstSeries.lineWidth ?? 2.5)}
                onChange={(event) => {
                  const next = series.map((item) => ({ ...item }));
                  next[0] = {
                    ...next[0],
                    lineWidth: Number(event.target.value),
                  };
                  onApply({
                    ...props,
                    data: next as unknown as VisualValue[],
                  });
                }}
              />
            </label>
          ) : null}
        </div>
      ) : null}

      <JsonEditor
        label="Labels"
        testId="labels-style"
        value={options.labels ?? {}}
        onApply={(value) => {
          if (value && typeof value === 'object' && !Array.isArray(value)) {
            onApply(withOption(props, 'labels', value));
          }
        }}
      />

      {props.family !== 'comparison' ? (
        <>
          <div className="apx-pre4-section" data-chart-legend>
            <div className="apx-pre4-section-title">Legend</div>
            <label className="apx-pre4-check">
              <input
                type="checkbox"
                checked={legend.show !== false}
                onChange={(event) =>
                  onApply(
                    withOption(props, 'legend', {
                      ...legend,
                      show: event.target.checked,
                    }),
                  )
                }
              />
              <span>Show legend</span>
            </label>
            <label className="apx-pre4-field">
              <span>Position</span>
              <select
                value={String(legend.position ?? 'bottom')}
                onChange={(event) =>
                  onApply(
                    withOption(props, 'legend', {
                      ...legend,
                      position: event.target.value,
                    }),
                  )
                }
              >
                {['top', 'bottom', 'left', 'right', 'top-left', 'top-right'].map(
                  (position) => (
                    <option key={position} value={position}>
                      {position}
                    </option>
                  ),
                )}
              </select>
            </label>
          </div>
          <div className="apx-pre4-section" data-chart-grid>
            <div className="apx-pre4-section-title">Grid</div>
            <label className="apx-pre4-check">
              <input
                type="checkbox"
                checked={grid.show !== false}
                onChange={(event) =>
                  onApply(
                    withOption(props, 'grid', {
                      ...grid,
                      show: event.target.checked,
                    }),
                  )
                }
              />
              <span>Show grid</span>
            </label>
          </div>
        </>
      ) : null}
    </>
  );
}

function AdvancedEditor({
  props,
  onApply,
}: {
  props: VisualChartNodeProps;
  onApply: (props: VisualChartNodeProps) => void;
}) {
  const options = rec(props.options);
  const axes = rec(options.axes);
  const xAxis = rec(axes.x);
  const yAxis = rec(axes.y);

  return (
    <>
      {['bar', 'horizontalBar'].includes(props.family) ? (
        <div className="apx-pre4-section" data-chart-family-options>
          <div className="apx-pre4-section-title">Bar family</div>
          <label className="apx-pre4-field">
            <span>Type</span>
            <select
              value={String(options.barType ?? 'standard')}
              onChange={(event) =>
                onApply(withOption(props, 'barType', event.target.value))
              }
            >
              {['standard', 'grouped', 'stacked', 'waterfall', 'lollipop'].map(
                (type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ),
              )}
            </select>
          </label>
        </div>
      ) : null}

      {['line', 'scatter', 'bar', 'horizontalBar', 'combo'].includes(
        props.family,
      ) ? (
        <div className="apx-pre4-section" data-chart-axes>
          <div className="apx-pre4-section-title">Axes, range & ticks</div>
          <label className="apx-pre4-field">
            <span>X title</span>
            <input
              value={String(xAxis.label ?? '')}
              onChange={(event) =>
                onApply(
                  withOption(props, 'axes', {
                    ...axes,
                    x: { ...xAxis, label: event.target.value },
                  }),
                )
              }
            />
          </label>
          <label className="apx-pre4-field">
            <span>Y title</span>
            <input
              value={String(yAxis.label ?? '')}
              onChange={(event) =>
                onApply(
                  withOption(props, 'axes', {
                    ...axes,
                    y: { ...yAxis, label: event.target.value },
                  }),
                )
              }
            />
          </label>
          <div className="apx-pre4-property-grid">
            <label>
              <span>Y min</span>
              <input
                type="number"
                value={Number(rec(yAxis.range).min ?? 0)}
                onChange={(event) =>
                  onApply(
                    withOption(props, 'axes', {
                      ...axes,
                      y: {
                        ...yAxis,
                        range: {
                          ...rec(yAxis.range),
                          min: Number(event.target.value),
                        },
                      },
                    }),
                  )
                }
              />
            </label>
            <label>
              <span>Y max</span>
              <input
                type="number"
                value={Number(rec(yAxis.range).max ?? 100)}
                onChange={(event) =>
                  onApply(
                    withOption(props, 'axes', {
                      ...axes,
                      y: {
                        ...yAxis,
                        range: {
                          ...rec(yAxis.range),
                          max: Number(event.target.value),
                        },
                      },
                    }),
                  )
                }
              />
            </label>
          </div>
          <label className="apx-pre4-field">
            <span>Y tick count</span>
            <input
              type="number"
              min="2"
              value={Number(yAxis.tickCount ?? 6)}
              onChange={(event) =>
                onApply(
                  withOption(props, 'axes', {
                    ...axes,
                    y: {
                      ...yAxis,
                      tickCount: Number(event.target.value),
                    },
                  }),
                )
              }
            />
          </label>
        </div>
      ) : null}

      {props.family === 'comparison' ? (
        <div className="apx-pre4-section" data-comparison-options>
          <div className="apx-pre4-section-title">Comparison</div>
          <label className="apx-pre4-field">
            <span>Layout</span>
            <select
              value={String(options.layout ?? 'sideBySide')}
              onChange={(event) =>
                onApply(withOption(props, 'layout', event.target.value))
              }
            >
              <option value="sideBySide">side by side</option>
              <option value="topBottom">top / bottom</option>
            </select>
          </label>
          <label className="apx-pre4-field">
            <span>Spacing</span>
            <input
              type="number"
              min="0"
              value={Number(options.spacing ?? 18)}
              onChange={(event) =>
                onApply(withOption(props, 'spacing', Number(event.target.value)))
              }
            />
          </label>
        </div>
      ) : null}

      {props.family === 'combo' ? (
        <div className="apx-pre4-section" data-combo-options>
          <div className="apx-pre4-section-title">Combo</div>
          <label className="apx-pre4-field">
            <span>Bars</span>
            <select
              value={String(options.barsType ?? 'standard')}
              onChange={(event) =>
                onApply(withOption(props, 'barsType', event.target.value))
              }
            >
              <option value="standard">standard</option>
              <option value="grouped">grouped</option>
              <option value="stacked">stacked</option>
            </select>
          </label>
          <label className="apx-pre4-check">
            <input
              type="checkbox"
              checked={rec(options.secondaryYAxis).show !== false}
              onChange={(event) =>
                onApply(
                  withOption(props, 'secondaryYAxis', {
                    ...rec(options.secondaryYAxis),
                    show: event.target.checked,
                  }),
                )
              }
            />
            <span>Secondary Y axis</span>
          </label>
        </div>
      ) : null}

      {props.family === 'pie' || props.family === 'donut' ? (
        <div className="apx-pre4-section" data-chart-family-options>
          <div className="apx-pre4-section-title">Pie / donut</div>
          <label className="apx-pre4-field">
            <span>Inner radius</span>
            <input
              type="number"
              min="0"
              value={Number(rec(options.pie).innerRadius ?? (props.family === 'donut' ? 70 : 0))}
              onChange={(event) =>
                onApply(
                  withOption(props, 'pie', {
                    ...rec(options.pie),
                    innerRadius: Number(event.target.value),
                  }),
                )
              }
            />
          </label>
        </div>
      ) : null}

      {props.family === 'radar' ? (
        <div className="apx-pre4-section" data-chart-family-options>
          <div className="apx-pre4-section-title">Radar</div>
          <label className="apx-pre4-field">
            <span>Grid levels</span>
            <input
              type="number"
              min="1"
              value={Number(rec(options.radar).gridLevels ?? 5)}
              onChange={(event) =>
                onApply(
                  withOption(props, 'radar', {
                    ...rec(options.radar),
                    gridLevels: Number(event.target.value),
                  }),
                )
              }
            />
          </label>
          <label className="apx-pre4-field">
            <span>Start angle</span>
            <input
              type="number"
              value={Number(rec(options.radar).startAngleDeg ?? -90)}
              onChange={(event) =>
                onApply(
                  withOption(props, 'radar', {
                    ...rec(options.radar),
                    startAngleDeg: Number(event.target.value),
                  }),
                )
              }
            />
          </label>
        </div>
      ) : null}

      {props.family === 'line' || props.family === 'scatter' ? (
        <div className="apx-pre4-section" data-chart-family-options>
          <div className="apx-pre4-section-title">
            {props.family === 'line' ? 'Line' : 'Scatter'}
          </div>
          {props.family === 'line' ? (
            <>
              <label className="apx-pre4-field">
                <span>Line style</span>
                <select
                  value={String(options.lineStyle ?? 'straight')}
                  onChange={(event) =>
                    onApply(withOption(props, 'lineStyle', event.target.value))
                  }
                >
                  <option value="straight">straight</option>
                  <option value="smooth">smooth</option>
                  <option value="step">step</option>
                </select>
              </label>
              <label className="apx-pre4-field">
                <span>Smoothness</span>
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.05"
                  value={Number(options.lineSmoothness ?? 0.35)}
                  onChange={(event) =>
                    onApply(
                      withOption(
                        props,
                        'lineSmoothness',
                        Number(event.target.value),
                      ),
                    )
                  }
                />
              </label>
            </>
          ) : (
            <JsonEditor
              label="Marker"
              testId="scatter-marker"
              value={options.marker ?? {}}
              onApply={(value) => onApply(withOption(props, 'marker', value))}
            />
          )}
        </div>
      ) : null}

      {props.family === 'polarArea' ? (
        <div className="apx-pre4-section" data-chart-family-options>
          <div className="apx-pre4-section-title">Polar area</div>
          <label className="apx-pre4-field">
            <span>Scale</span>
            <select
              value={String(options.scale ?? 'radius')}
              onChange={(event) =>
                onApply(withOption(props, 'scale', event.target.value))
              }
            >
              <option value="radius">radius</option>
              <option value="area">area</option>
            </select>
          </label>
        </div>
      ) : null}

      <div className="apx-pre4-section" data-chart-option-matrix>
        <div className="apx-pre4-section-title">
          Complete option matrix · {props.family}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {CHART_FAMILY_OPTION_MATRIX[props.family].map((path) => (
            <code key={path} style={{ fontSize: 9, opacity: 0.75 }}>
              {path}
            </code>
          ))}
        </div>
      </div>

      <JsonEditor
        label="Complete chart options"
        testId="complete-options"
        value={props.options}
        onApply={(value) => {
          if (value && typeof value === 'object' && !Array.isArray(value)) {
            onApply({
              ...props,
              options: value as Record<string, VisualValue>,
            });
          }
        }}
      />
    </>
  );
}

export function VisualChartInspector({ node, tab, onChange }: Props) {
  const props = visualChartProps(node);
  const apply = (next: VisualChartNodeProps) =>
    onChange('Edit ' + props.family + ' chart', () => next);

  if (tab === 'data') {
    return (
      <>
        <DataEditor props={props} onApply={apply} />
        <JsonEditor
          label="Complete chart data"
          testId="complete-data"
          value={
            props.family === 'comparison' || props.family === 'combo'
              ? props.options
              : props.data ?? []
          }
          onApply={(value) => {
            if (
              props.family === 'comparison' ||
              props.family === 'combo'
            ) {
              if (value && typeof value === 'object' && !Array.isArray(value)) {
                apply({
                  ...props,
                  options: value as Record<string, VisualValue>,
                });
              }
            } else if (Array.isArray(value)) {
              apply({
                ...props,
                data: value as VisualValue[],
              });
            }
          }}
        />
      </>
    );
  }

  if (tab === 'advanced') {
    return <AdvancedEditor props={props} onApply={apply} />;
  }

  if (tab === 'effects') {
    return (
      <>
        <div className="apx-pre4-section">
          <div className="apx-pre4-section-title">Effects</div>
          <small className="apx-canvas-hint">
            Chart gradients, patterns, shadows, opacity and family-specific effects
            are stored directly in the canonical Apexify options tree.
          </small>
        </div>
        <AdvancedEditor props={props} onApply={apply} />
      </>
    );
  }

  return <StyleEditor props={props} onApply={apply} />;
}

export function ChartFamilyPicker({
  onInsert,
}: {
  onInsert: (family: VisualChartFamily) => void;
}) {
  return (
    <div className="apx-media-context" data-visual-charts-context>
      <div className="apx-media-context-copy">
        <strong>Charts</strong>
        <span>
          Insert native Apexify chart buffers, edit data and the complete option tree,
          and reuse the generated Buffer in document composition.
        </span>
      </div>
      <div className="apx-media-context-heading">
        <strong>Chart families</strong>
        <span>10 authoring modes</span>
      </div>
      <div className="apx-shape-picker" data-chart-family-picker>
        {CHART_FAMILIES.map((family) => (
          <button
            key={family}
            type="button"
            data-chart-insert={family}
            onClick={() => onInsert(family)}
          >
            <span className="apx-shape-glyph">
              {family === 'pie' || family === 'donut'
                ? '◔'
                : family === 'line' || family === 'scatter'
                  ? '⌁'
                  : family === 'radar' || family === 'polarArea'
                    ? '✣'
                    : family === 'comparison'
                      ? '▥'
                      : family === 'combo'
                        ? '▤'
                        : '▥'}
            </span>
            <small>{family}</small>
          </button>
        ))}
      </div>
      <div className="apx-live-sync-note">
        <strong>Linked chart code</strong>
        <span>
          Visual edits compile to createChart / createComparisonChart /
          createComboChart plus canonical createImage() chart-buffer composition.
        </span>
      </div>
    </div>
  );
}
