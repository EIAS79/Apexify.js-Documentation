'use client';

import type { ComponentType, SVGProps } from 'react';
import {
  AcademicCapIcon,
  AdjustmentsHorizontalIcon,
  ClipboardDocumentListIcon,
  CodeBracketSquareIcon,
  CpuChipIcon,
  CubeIcon,
  PencilSquareIcon,
  RectangleStackIcon,
  RocketLaunchIcon,
} from '@heroicons/react/24/outline';

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

const ICON_BY_SECTION: Record<string, Icon> = {
  '00-start-here': RocketLaunchIcon,
  '01-beginner-guide': AcademicCapIcon,
  '02-recipes': ClipboardDocumentListIcon,
  '03-feature-guides': CubeIcon,
  '04-api-reference': CodeBracketSquareIcon,
  '05-advanced': AdjustmentsHorizontalIcon,
  '06-internals': CpuChipIcon,
  '07-contributor-notes': PencilSquareIcon,
  root: RectangleStackIcon,
};

export function SectionAccentIcon({
  sectionName,
  className = 'h-4 w-4',
}: {
  sectionName: string;
  className?: string;
}) {
  const Icon = ICON_BY_SECTION[sectionName] ?? RectangleStackIcon;
  return <Icon className={className} aria-hidden />;
}
