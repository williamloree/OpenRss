import { checkFeedsAndNotify } from "@/lib/push";

const DEFAULT_INTERVAL_MINUTES = 15;
const FIRST_RUN_DELAY_MS = 60 * 1000;

// Garde globale : register() peut être rappelé (HMR en dev)
const globalState = globalThis as typeof globalThis & {
  __openrssPushScheduler?: boolean;
};

let running = false;

async function runCheck() {
  if (running) return;
  running = true;
  try {
    const result = await checkFeedsAndNotify();
    if (result.feeds > 0) {
      console.log(
        `[push] Checked ${result.feeds} feeds, sent ${result.sent} notifications, removed ${result.removed} expired subscriptions`
      );
    }
  } catch (error) {
    console.error("[push] Feed check failed:", error);
  } finally {
    running = false;
  }
}

export function startPushScheduler() {
  if (globalState.__openrssPushScheduler) return;
  globalState.__openrssPushScheduler = true;

  const minutes =
    Number(process.env.PUSH_CHECK_INTERVAL_MINUTES) || DEFAULT_INTERVAL_MINUTES;
  console.log(`[push] Feed check scheduled every ${minutes} min`);

  setTimeout(runCheck, FIRST_RUN_DELAY_MS);
  setInterval(runCheck, minutes * 60 * 1000);
}
