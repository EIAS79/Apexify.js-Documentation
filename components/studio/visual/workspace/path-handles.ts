import type { VisualNode, VisualProject } from '@/lib/studio/visual/model';
import { pathPropsRecord, visualPathProps, type StudioPathCommand, type VisualPathNodeProps } from '@/lib/studio/visual/path-pixel-contract';
import type { Point } from './geometry';

export type PathXKey = 'x' | 'x1' | 'x2' | 'cpx' | 'cp1x' | 'cp2x';
export type PathYKey = 'y' | 'y1' | 'y2' | 'cpy' | 'cp1y' | 'cp2y';
export type PathHandleTarget = {
  commandIndex: number;
  pointIndex?: number;
  xKey: PathXKey;
  yKey: PathYKey;
  role: 'anchor' | 'control';
  label: string;
};
export type PathHandle = PathHandleTarget & Point;

function effectivePathTransform(node: VisualNode, props: VisualPathNodeProps) {
  const transform = node.transform ?? {};
  const authored = props.draw?.transform ?? {};
  const width = Math.max(1, props.viewport.width);
  const height = Math.max(1, props.viewport.height);
  const nodeScaleX =
    ((transform.width ?? width) * (transform.scaleX ?? 1)) / width;
  const nodeScaleY =
    ((transform.height ?? height) * (transform.scaleY ?? 1)) / height;
  return {
    translateX: (authored.translateX ?? 0) + (transform.x ?? 0),
    translateY: (authored.translateY ?? 0) + (transform.y ?? 0),
    rotate: (authored.rotate ?? 0) + (transform.rotation ?? 0),
    scaleX: (authored.scaleX ?? 1) * nodeScaleX,
    scaleY: (authored.scaleY ?? 1) * nodeScaleY,
    originX: authored.originX,
    originY: authored.originY,
  };
}

export function pathLocalToDocumentPoint(
  node: VisualNode,
  props: VisualPathNodeProps,
  point: Point,
): Point {
  const transform = effectivePathTransform(node, props);
  const radians = (transform.rotate * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);

  if (transform.originX !== undefined && transform.originY !== undefined) {
    const dx = (point.x - transform.originX) * transform.scaleX;
    const dy = (point.y - transform.originY) * transform.scaleY;
    return {
      x: transform.translateX + transform.originX + dx * cos - dy * sin,
      y: transform.translateY + transform.originY + dx * sin + dy * cos,
    };
  }

  const scaledX = point.x * transform.scaleX;
  const scaledY = point.y * transform.scaleY;
  return {
    x: transform.translateX + scaledX * cos - scaledY * sin,
    y: transform.translateY + scaledX * sin + scaledY * cos,
  };
}

export function pathDocumentToLocalPoint(
  node: VisualNode,
  props: VisualPathNodeProps,
  point: Point,
): Point {
  const transform = effectivePathTransform(node, props);
  const radians = (-transform.rotate * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const scaleX = transform.scaleX || 1;
  const scaleY = transform.scaleY || 1;

  if (transform.originX !== undefined && transform.originY !== undefined) {
    const dx = point.x - transform.translateX - transform.originX;
    const dy = point.y - transform.translateY - transform.originY;
    return {
      x: transform.originX + (dx * cos - dy * sin) / scaleX,
      y: transform.originY + (dx * sin + dy * cos) / scaleY,
    };
  }

  const dx = point.x - transform.translateX;
  const dy = point.y - transform.translateY;
  return {
    x: (dx * cos - dy * sin) / scaleX,
    y: (dx * sin + dy * cos) / scaleY,
  };
}

export function editablePathHandles(props: VisualPathNodeProps): PathHandle[] {
  const handles: PathHandle[] = [];
  const add = (
    commandIndex: number,
    xKey: PathXKey,
    yKey: PathYKey,
    x: number,
    y: number,
    role: PathHandleTarget['role'],
    label: string,
    pointIndex?: number,
  ) => {
    handles.push({
      commandIndex,
      ...(pointIndex === undefined ? {} : { pointIndex }),
      xKey,
      yKey,
      x,
      y,
      role,
      label,
    });
  };

  (props.commands ?? []).forEach((command, commandIndex) => {
    switch (command.type) {
      case 'moveTo':
      case 'lineTo':
        add(commandIndex, 'x', 'y', command.x, command.y, 'anchor', 'point');
        break;
      case 'quadraticCurveTo':
        add(commandIndex, 'cpx', 'cpy', command.cpx, command.cpy, 'control', 'control');
        add(commandIndex, 'x', 'y', command.x, command.y, 'anchor', 'point');
        break;
      case 'bezierCurveTo':
        add(commandIndex, 'cp1x', 'cp1y', command.cp1x, command.cp1y, 'control', 'cp1');
        add(commandIndex, 'cp2x', 'cp2y', command.cp2x, command.cp2y, 'control', 'cp2');
        add(commandIndex, 'x', 'y', command.x, command.y, 'anchor', 'point');
        break;
      case 'arcTo':
        add(commandIndex, 'x1', 'y1', command.x1, command.y1, 'anchor', 'point1');
        add(commandIndex, 'x2', 'y2', command.x2, command.y2, 'anchor', 'point2');
        break;
      case 'polygon':
        command.points.forEach((point, pointIndex) =>
          add(commandIndex, 'x', 'y', point.x, point.y, 'anchor', 'point', pointIndex),
        );
        break;
      case 'arc':
      case 'rect':
      case 'ellipse':
      case 'circle':
      case 'roundedRect':
      case 'star':
      case 'arrow':
        add(commandIndex, 'x', 'y', command.x, command.y, 'anchor', 'point');
        break;
      case 'closePath':
        break;
    }
  });

  return handles;
}

function roundedPathCoordinate(value: number) {
  return Math.round(value * 100) / 100;
}

export function movePathHandle(
  project: VisualProject,
  nodeId: string,
  target: PathHandleTarget,
  localPoint: Point,
): VisualProject {
  const sourceNode = project.document.nodes[nodeId];
  if (!sourceNode || (sourceNode.kind !== 'path' && sourceNode.kind !== 'freehand')) {
    return project;
  }
  const next = structuredClone(project);
  const node = next.document.nodes[nodeId];
  const props = visualPathProps(node);
  const commands = structuredClone(props.commands ?? []);
  const command = commands[target.commandIndex];
  if (!command) return project;

  const x = roundedPathCoordinate(localPoint.x);
  const y = roundedPathCoordinate(localPoint.y);
  if (target.pointIndex !== undefined && command.type === 'polygon') {
    const point = command.points[target.pointIndex];
    if (!point) return project;
    command.points[target.pointIndex] = { x, y };
  } else {
    const draft = command as unknown as Record<string, unknown>;
    draft[target.xKey] = x;
    draft[target.yKey] = y;
  }

  node.props = pathPropsRecord({ ...props, commands: commands as StudioPathCommand[] });
  next.updatedAt = new Date().toISOString();
  return next;
}

