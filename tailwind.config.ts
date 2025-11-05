import type { Config } from 'tailwindcss'
import { withUIKit } from 'tailwindcss-uikit-colors'

const config: Config = withUIKit({
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
})

export default config
