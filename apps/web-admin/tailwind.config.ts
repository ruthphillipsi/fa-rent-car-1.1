import type { Config } from 'tailwindcss';

import preset from '@fa/ui/tailwind-preset';

export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  presets: [preset],
} satisfies Config;
