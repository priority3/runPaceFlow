import { NextResponse } from 'next/server'

import { getPublicRuntimeConfig } from '@/lib/runtime-config/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json(await getPublicRuntimeConfig({ force: true }), {
    headers: {
      'Cache-Control': 'no-store',
    },
  })
}
