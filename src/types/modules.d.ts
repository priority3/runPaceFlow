/**
 * Type declarations for modules without TypeScript definitions
 */

declare module 'superjson' {
  export interface SuperJSON {
    serialize: (object: any) => { json: any; meta?: any }
    deserialize: <T = any>(payload: { json: any; meta?: any }) => T
    stringify: (object: any) => string
    parse: <T = any>(string: string) => T
    registerCustom: <T>(
      config: {
        isApplicable: (v: any) => v is T
        serialize: (v: T) => any
        deserialize: (v: any) => T
      },
      name: string,
    ) => void
    registerClass: (v: any, options?: { identifier?: string }) => void
    allowErrorProps: (...props: string[]) => void
  }

  const superjson: SuperJSON
  export default superjson
}

declare module 'tailwindcss-uikit-colors' {
  import type { Config } from 'tailwindcss'

  function withUIKit(config: Config): Config

  export default withUIKit
}
