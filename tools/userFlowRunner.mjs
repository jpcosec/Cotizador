import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const OUTPUT_DIR = path.resolve(process.cwd(), 'auto_user_test');
const FLOW_FILE = path.resolve(process.cwd(), 'user_flow.json');

function exportToMermaid(flow) {
  let mermaid = `graph TD\n  Start((Start)) --> ${flow.steps[0].id}\n`;
  for (let i = 0; i < flow.steps.length; i++) {
    const step = flow.steps[i];
    const next = flow.steps[i + 1];
    const label = `${step.description} (${step.action})`;
    mermaid += `  ${step.id}["${label}"]\n`;
    if (next) {
      mermaid += `  ${step.id} --> ${next.id}\n`;
    } else {
      mermaid += `  ${step.id} --> End((End))\n`;
    }
  }
  return mermaid;
}

async function runFlow() {
  const args = process.argv.slice(2);
  const generateMermaid = args.includes('--mermaid');
  const shouldRun = args.includes('--run') || !generateMermaid;

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const flow = JSON.parse(fs.readFileSync(FLOW_FILE, 'utf8'));

  if (generateMermaid) {
    const mermaid = exportToMermaid(flow);
    const mermaidPath = path.join(OUTPUT_DIR, 'flow.mmd');
    fs.writeFileSync(mermaidPath, mermaid, 'utf8');
    console.log(`Mermaid flow exported to ${mermaidPath}`);
  }

  if (!shouldRun) return;

  const logStream = fs.createWriteStream(path.join(OUTPUT_DIR, 'runner.log'), { flags: 'w' });
  const log = (msg) => {
    const time = new Date().toISOString();
    const line = `[${time}] ${msg}`;
    console.log(line);
    logStream.write(line + '\n');
  };

  log(`Starting flow: ${flow.name}`);
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => {
    log(`[BROWSER CONSOLE] [${msg.type()}] ${msg.text()}`);
  });
  
  page.on('pageerror', err => {
    log(`[BROWSER ERROR] ${err.message}`);
  });

  const report = {
    name: flow.name,
    startTime: new Date().toISOString(),
    steps: [],
    success: false
  };

  try {
    for (let i = 0; i < flow.steps.length; i++) {
      const step = flow.steps[i];
      const stepIdx = String(i + 1).padStart(2, '0');
      log(`Step ${stepIdx}: ${step.description} (${step.action})`);
      
      const stepResult = { ...step, startTime: new Date().toISOString(), success: false };

      try {
        switch (step.action) {
          case 'goto':
            await page.goto(flow.baseUrl + step.url);
            break;
          case 'click':
            await page.click(step.selector, { force: true });
            break;
          case 'fill':
            try {
              await page.waitForSelector(step.selector, { state: 'visible', timeout: 5000 });
            } catch (e) {
              log(`Warning: element ${step.selector} not visible, forcing fill anyway`);
            }
            await page.fill(step.selector, step.value, { force: true });
            break;
          case 'wait':
            await page.waitForSelector(step.selector, { state: 'visible', timeout: 15000 });
            break;
          case 'wait_hidden':
            await page.waitForSelector(step.selector, { state: 'hidden', timeout: 15000 });
            break;
          case 'wait_fixed':
            await page.waitForTimeout(Number(step.value));
            break;
          default:
            throw new Error(`Unknown action: ${step.action}`);
        }

        log(`Current URL: ${page.url()}`);
        await page.waitForTimeout(800);

        const state = await page.evaluate(() => {
          const el = document.querySelector('.quotation-shell');
          return el && typeof Alpine !== 'undefined' ? Alpine.$data(el) : null;
        });
        if (state) {
           log(`[STATE] Stage: ${state.stage}, ClientModal: ${state.clientModalOpen}`);
        }

        stepResult.success = true;
      } catch (err) {
        stepResult.error = err.message;
        log(`ERROR in step ${stepIdx}: ${err.message}`);
        throw err;
      } finally {
        stepResult.endTime = new Date().toISOString();
        const screenshotPath = path.join(OUTPUT_DIR, `${stepIdx}_${step.id}.png`);
        const htmlPath = path.join(OUTPUT_DIR, `${stepIdx}_${step.id}.html`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        fs.writeFileSync(htmlPath, await page.content(), 'utf8');
        report.steps.push(stepResult);
      }
    }
    report.success = true;
    log('Flow completed successfully');
  } catch (err) {
    report.success = false;
    log(`Flow failed: ${err.message}`);
  } finally {
    report.endTime = new Date().toISOString();
    fs.writeFileSync(path.join(OUTPUT_DIR, 'report.json'), JSON.stringify(report, null, 2), 'utf8');
    await browser.close();
    logStream.end();
  }
}

runFlow().catch(err => {
  console.error('Fatal error in runner:', err);
  process.exit(1);
});
