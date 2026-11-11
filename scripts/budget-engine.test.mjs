// Budget engine checks: the reference budgets from the brief, the named cases, and every combination of answers
// against the rules in BudgetEngine.validate. Usage: node scripts/budget-engine.test.mjs
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ctx = { window: {} };
vm.runInNewContext(readFileSync(join(root, "src/js/44-budget-engine.js"), "utf8"), ctx);
const E = ctx.window.BudgetEngine;
const S = E.DEFAULTS;

let failed = 0;
const eq = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) { failed++; console.log(`FAIL ${name}\n  got  ${JSON.stringify(got)}\n  want ${JSON.stringify(want)}`); }
};
const base = { type: "services", goals: ["sales", "aware"], identity: "full", site: "ready", accounts: "managed", platforms: ["instagram", "tiktok"], ads: "want", budget: 10000 };
const run = (o) => E.plan({ ...base, ...o }, S);
const sum = (p) => ({
  setup: p.foundationCost, content: p.content && [p.content.v, p.content.p, p.content.s], mgmt: p.mgmtCount, campaigns: p.campaigns,
  ad: p.adSpend, adPlatforms: p.adPlatforms.length, left: p.remaining,
});

/* the reference budgets from the brief (balanced goals) */
const noSetup = { identity: "none", site: "ready", type: "brand" };
eq("4000: identity, 6 videos, 6 posts, 10 stories, nothing else", sum(run({ ...noSetup, budget: 4000 })),
  { setup: 2000, content: [6, 6, 10], mgmt: 0, campaigns: 0, ad: 0, adPlatforms: 0, left: 0 });
eq("6000: identity, 6+6 content, campaign, 1500 ads, no management", sum(run({ ...noSetup, budget: 6000 })),
  { setup: 2000, content: [6, 6, 0], mgmt: 0, campaigns: 1, ad: 1500, adPlatforms: 1, left: 0 });
const twelve = { type: "brand", identity: "none", site: "none", budget: 12000 };
eq("12000: identity, site, 2 platforms, 10/10/10, campaign, 2000 ads", sum(run(twelve)),
  { setup: 4000, content: [10, 10, 10], mgmt: 2, campaigns: 1, ad: 2000, adPlatforms: 1, left: 0 });
eq("14000: same, ads on two platforms 4000", sum(run({ ...twelve, budget: 14000 })),
  { setup: 4000, content: [10, 10, 10], mgmt: 2, campaigns: 1, ad: 4000, adPlatforms: 2, left: 0 });

/* named cases */
const c14 = run({ ...twelve, budget: 14000, platforms: ["instagram", "tiktok", "snapchat"], ads: "multi" });
eq("14000, no identity or site, three platforms, two campaigns: one campaign, two managed, third republished",
  [c14.campaigns, c14.mgmtCount, c14.managed.length, c14.republish.length], [1, 2, 2, 1]);
const ready = run({ budget: 6000, platforms: ["instagram", "tiktok"], accounts: "managed" });
eq("6000 with identity and site ready: no setup, management and a campaign", [ready.foundationCost, ready.mgmtCount > 0, ready.campaigns], [0, true, 1]);
eq("ads refused: no campaign, no ad money", sum(run({ ads: "none", budget: 10000 })).campaigns, 0);
const wide = run({ budget: 20000, ads: "multi", platforms: ["instagram", "tiktok", "snapchat"], identity: "full", site: "ready" });
eq("20000 ready, asks for two campaigns: two campaigns, management capped at two", [wide.campaigns, wide.mgmtCount], [2, 2]);
eq("under 4000 never gets management", run({ budget: 3000, identity: "full", site: "ready" }).mgmtCount, 0);
eq("self-run accounts never get management", run({ budget: 12000, accounts: "own" }).mgmtCount, 0);
const tiny = run({ budget: 1500, identity: "none", site: "none" });
eq("budget under the cheapest setup: nothing spent, alert shown", [tiny.foundationBlocked, tiny.remaining, tiny.alerts.length], [true, 1500, 1]);
const both = run({ budget: 4000, identity: "none", site: "none", type: "store" });
eq("4000 needing identity and site: site first for a store, identity phased", [both.foundation.map((f) => f.key), both.foundationDeferred.map((f) => f.key)], [["site"], ["identity"]]);
eq("site not funded: no campaign, with the reason", [run({ budget: 4000, identity: "full", site: "none", type: "store" }).campaigns, run({ budget: 4000, identity: "full", site: "none", type: "store" }).foundation.length], [0, 1]);
const wa = run({ platforms: ["whatsapp"], type: "store", budget: 8000 });
eq("WhatsApp only: content platforms are suggested", [wa.suggested, wa.whatsapp, wa.managed.length + wa.republish.length > 0], [true, true, true]);
eq("LinkedIn is not recommended for a restaurant", run({ type: "food", platforms: ["instagram", "linkedin"], budget: 8000 }).notRecommended, ["linkedin"]);
const cf = run({ goals: ["presence"], budget: 8000, ads: "want" });
const bf = run({ goals: ["sales", "aware"], budget: 8000, ads: "want" });
eq("content-first plan spends at least as much on content as the balanced one", cf.contentCost >= bf.contentCost, true);
eq("improved identity and site use the development prices", run({ identity: "partial", site: "improve", budget: 8000 }).foundationCost, 3200);
eq("a custom amount leaves its odd change visible", run({ budget: 7345 }).remaining < 100, true);

/* every combination of answers must keep every rule */
const types = ["store", "food", "services", "brand", "startup", "other"];
const goalSets = [["aware", "presence"], ["sales"], ["sales", "aware"], ["requests", "launch"]];
const ids = ["full", "logo", "partial", "none"], sites = ["ready", "improve", "none", "notNeeded"], accs = ["own", "managed", "inactive", "none"];
const adsOpts = ["want", "one", "multi", "recommend", "none"];
const platSets = [["instagram"], ["instagram", "tiktok", "snapchat"], ["whatsapp"], ["instagram", "x", "linkedin"], ["instagram", "tiktok", "snapchat", "x", "linkedin", "whatsapp"]];
const budgets = [1000, 1500, 2000, 3000, 4000, 5000, 6000, 7345, 8000, 10000, 12000, 14000, 16000, 18000, 20000, 20500, 30000];
let n = 0;
for (const hist of ["none", "good", "weak"]) {
  const SS = E.merge(S, { ads: { history: hist } });
  for (const type of types) for (const goals of goalSets) for (const identity of ids) for (const site of sites) for (const accounts of accs)
    for (const ads of adsOpts) for (const platforms of platSets) for (const budget of budgets) {
      if (hist !== "none" && (budget % 2000 || goals.length !== 1)) continue;   /* the history variants are a lighter sweep */
      const a = { type, goals, identity, site, accounts, platforms, ads, budget };
      const p = E.plan(a, SS), bad = E.validate(p, a, SS);
      /* no money left idle that could have bought something: ad spend absorbs the change, and a content rung that fits is taken */
      if (!p.foundationBlocked) {
        const T = E.ladder(SS).T, next = T.find((t) => t.cost > p.contentCost);
        if (p.campaigns && p.remaining >= 100 && hist !== "weak") bad.push("campaign plan leaves " + p.remaining + " unspent");
        if (!p.campaigns && next && p.remaining >= next.cost - p.contentCost) bad.push("a content rung fits but money is left");
      }
      n++;
      if (bad.length && failed < 15) { failed++; console.log("FAIL rules", JSON.stringify(a), bad); }
    }
}
/* the settings reach the results: a price change moves the totals */
const dear = E.merge(S, { prices: { video: 300 } });
eq("a price change reaches the plan", E.plan({ ...base, budget: 6000 }, dear).content.v <= E.plan({ ...base, budget: 6000 }, S).content.v, true);
console.log(failed ? `\n${failed} failing` : `all checks passed (${n} answer combinations)`);
process.exit(failed ? 1 : 0);
