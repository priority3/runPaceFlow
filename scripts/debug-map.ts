/**
 * Debug script: opens the detail page and captures detailed diagnostics
 * about map rendering state and any errors.
 */
import { chromium } from 'playwright'

const URL = 'http://localhost:3000/activity/act_zgpmbnpvz217b2jd8kxgi'

async function main() {
  const browser = await chromium.launch({
    headless: false, // Use headed mode to get real WebGL support
    args: ['--enable-webgl', '--use-gl=swiftshader'],
  })
  const page = await browser.newPage()

  const logs: string[] = []

  page.on('console', (msg) => {
    logs.push(`[${msg.type()}] ${msg.text()}`)
  })

  page.on('pageerror', (err) => {
    logs.push(`[PAGE_ERROR] ${err.message}\n${err.stack}`)
  })

  console.log(`Opening ${URL} ...`)

  try {
    await page.goto(URL, { timeout: 20000, waitUntil: 'domcontentloaded' })
    console.log('DOM loaded. Waiting 8s for data fetch + map init...')
    await page.waitForTimeout(8000)
  } catch (e: any) {
    console.log(`Navigation issue: ${e.message}`)
  }

  // Detailed page state
  const state = await page
    .evaluate(() => {
      const canvas = document.querySelector('canvas.maplibregl-canvas')
      const mapContainer = document.querySelector('.maplibregl-map')
      const allButtons = Array.from(document.querySelectorAll('button')).map((b) =>
        b.textContent?.trim(),
      )
      const clickToLoadButton = Array.from(document.querySelectorAll('button')).find((b) =>
        (b.textContent || '').includes('加载地图'),
      )

      // Check WebGL
      let webglWorks = false
      try {
        const testCanvas = document.createElement('canvas')
        const gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl')
        webglWorks = !!gl
      } catch {}

      // Look for map-related elements
      const mapSection = document.querySelector('section.mb-6')
      const mapSectionHTML = mapSection?.innerHTML?.slice(0, 500) || 'NOT FOUND'

      return {
        hasMapCanvas: !!canvas,
        hasMapContainer: !!mapContainer,
        webglWorks,
        hasClickToLoadButton: !!clickToLoadButton,
        buttons: allButtons,
        mapSectionSnippet: mapSectionHTML,
        url: window.location.href,
      }
    })
    .catch((e) => ({ error: e.message }))

  console.log('\n--- Page State ---')
  console.log(JSON.stringify(state, null, 2))

  console.log('\n--- All Console Logs ---')
  for (const log of logs) {
    console.log(log)
  }

  // Performance check: is the page responsive?
  const start = Date.now()
  try {
    await page.evaluate(() => document.title)
    console.log(`\nPage responsive: ${Date.now() - start}ms`)
  } catch {
    console.log('\nPage NOT responsive (evaluate timed out)')
  }

  await browser.close()
}

main().catch(console.error)
