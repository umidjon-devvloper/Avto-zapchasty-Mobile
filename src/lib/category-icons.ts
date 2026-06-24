import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

const MAP: Record<string, IoniconName> = {
  body: 'car-outline', doors: 'log-in-outline', trunk: 'cube-outline', lights: 'bulb-outline',
  'glass-mirrors': 'tablet-landscape-outline', wipers: 'rainy-outline', suspension: 'build-outline',
  steering: 'navigate-outline', brakes: 'disc-outline', engine: 'cog-outline', ignition: 'flash-outline',
  'fuel-system': 'water-outline', intake: 'cloud-outline', exhaust: 'cloudy-outline', cooling: 'snow-outline',
  filters: 'funnel-outline', transmission: 'settings-outline', drivetrain: 'git-merge-outline',
  electrical: 'flash-outline', sensors: 'radio-outline', climate: 'thermometer-outline', interior: 'grid-outline',
  safety: 'shield-checkmark-outline', 'wheels-tires': 'ellipse-outline', 'oils-fluids': 'color-fill-outline',
  consumables: 'repeat-outline', diesel: 'water-outline', hybrid: 'battery-charging-outline',
  'electric-vehicle': 'flash-outline', turbo: 'speedometer-outline', adas: 'scan-outline',
  audio: 'musical-notes-outline', fasteners: 'link-outline', tuning: 'sparkles-outline',
};

export function categoryIcon(slug: string): IoniconName {
  return MAP[slug] || 'cube-outline';
}
