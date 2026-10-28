"use client";
import {
  Fragment,
  useRef,
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
} from "react";
import type { PanelId } from "../model";
export type DockTree =
  | { panel: PanelId }
  | { id: string; tabs: PanelId[]; defaultPanel: PanelId }
  | {
      id: string;
      direction: "row" | "column";
      weights: number[];
      children: DockTree[];
    };
export const DEFAULT_DOCK: DockTree = {
  id: "root",
  direction: "row",
  weights: [14, 86],
  children: [
    { panel: "tools" },
    {
      id: "work-v2",
      direction: "row",
      weights: [74, 26],
      children: [
        {
          id: "center-v2",
          direction: "column",
          weights: [49, 36, 15],
          children: [
            { panel: "visual" },
            {
              id: "editors-v2",
              direction: "row",
              weights: [53, 47],
              children: [
                { id: "editor-tabs", tabs: ["code", "terminal"], defaultPanel: "code" },
                { panel: "graph" },
              ],
            },
            { id: "result-tabs", tabs: ["queue", "preview", "output"], defaultPanel: "queue" },
          ],
        },
        { panel: "inspector" },
      ],
    },
  ],
};
export function hasVisiblePanel(
  tree: DockTree,
  visible: Partial<Record<PanelId, boolean>>,
): boolean {
  return "panel" in tree
    ? Boolean(visible[tree.panel])
    : "tabs" in tree ? tree.tabs.some(id => visible[id])
    : tree.children.some((child) => hasVisiblePanel(child, visible));
}
export function DockLayout({
  tree,
  visible,
  sizes,
  onResize,
  renderPanel,
  activeTabs = {},
}: {
  tree: DockTree;
  visible: Partial<Record<PanelId, boolean>>;
  sizes: Record<string, number[]>;
  onResize: (id: string, weights: number[]) => void;
  renderPanel: (id: PanelId, tabs?: PanelId[]) => ReactNode;
  activeTabs?: Record<string, PanelId>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  if ("panel" in tree)
    return (
      <div className="aw-dock-leaf" data-panel={tree.panel}>
        {renderPanel(tree.panel)}
      </div>
    );
  if ("tabs" in tree) {
    const tabs = tree.tabs.filter(id => visible[id]);
    const active = tabs.includes(activeTabs[tree.id]) ? activeTabs[tree.id]
      : tabs.includes(tree.defaultPanel) ? tree.defaultPanel : tabs[0];
    return <div className="aw-dock-tab-group" data-group={tree.id}>
      {tabs.map(id => <div key={id} className="aw-tab-page" data-panel={id} hidden={active !== id}>
        {renderPanel(id, tabs)}
      </div>)}
    </div>;
  }
  const children = tree.children
    .map((child, index) => ({ child, index }))
    .filter(({ child }) => hasVisiblePanel(child, visible));
  const weights = sizes[tree.id] ?? tree.weights;
  const splitId = tree.id;
  const direction = tree.direction;
  function resize(
    event: PointerEvent<HTMLDivElement>,
    before: number,
    after: number,
  ) {
    event.preventDefault();
    const el = event.currentTarget;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const horizontal = direction === "row";
    const extent = horizontal ? rect.width : rect.height;
    const start = horizontal ? event.clientX : event.clientY;
    const total = children.reduce((sum, c) => sum + weights[c.index], 0);
    const pair = weights[before] + weights[after];
    const move = (e: globalThis.PointerEvent) => {
      const delta =
        (((horizontal ? e.clientX : e.clientY) - start) / extent) * total;
      const next = [...weights];
      next[before] = Math.max(
        pair * 0.12,
        Math.min(pair * 0.88, weights[before] + delta),
      );
      next[after] = pair - next[before];
      onResize(splitId, next);
    };
    const end = () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", end);
      el.removeEventListener("pointercancel", end);
    };
    el.setPointerCapture(event.pointerId);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", end);
  }
  return (
    <div
      ref={ref}
      className={`aw-dock aw-dock-${tree.direction}`}
      data-split={tree.id}
    >
      {children.map(({ child, index }, position) => (
        <Fragment key={"panel" in child ? child.panel : child.id}>
          {position > 0 ? (
            <div
              role="separator"
              tabIndex={0}
              aria-label={`Resize ${tree.id} panels`}
              aria-valuemin={12}
              aria-valuemax={88}
              aria-valuenow={Math.round(
                (100 * weights[children[position - 1].index]) /
                  (weights[children[position - 1].index] + weights[index]),
              )}
              aria-orientation={
                tree.direction === "row" ? "vertical" : "horizontal"
              }
              className="aw-divider"
              onPointerDown={(e) =>
                resize(e, children[position - 1].index, index)
              }
              onKeyDown={(e) => {
                if (
                  !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(
                    e.key,
                  )
                )
                  return;
                e.preventDefault();
                const previous = children[position - 1].index;
                const pair = weights[previous] + weights[index];
                const next = [...weights];
                const delta = ["ArrowRight", "ArrowDown"].includes(e.key)
                  ? 2
                  : -2;
                next[previous] = Math.max(
                  pair * 0.12,
                  Math.min(pair * 0.88, weights[previous] + delta),
                );
                next[index] = pair - next[previous];
                onResize(tree.id, next);
              }}
            />
          ) : null}
          <div
            className="aw-dock-slot"
            style={{ flexGrow: weights[index], flexBasis: 0 } as CSSProperties}
          >
            <DockLayout
              tree={child}
              visible={visible}
              sizes={sizes}
              onResize={onResize}
              renderPanel={renderPanel}
              activeTabs={activeTabs}
            />
          </div>
        </Fragment>
      ))}
    </div>
  );
}
