// Serves ./site from a fake origin and answers the Wix APIs from fixtures, so the real bundle runs
// end to end in Chromium without network access.
import { readFileSync, existsSync } from "node:fs";
import { extname, join } from "node:path";

export const ORIGIN = "https://soulmate.test";
const root = new URL("..", import.meta.url).pathname;
const cms = JSON.parse(readFileSync(join(root, "test/cms.json"), "utf8"));
const forms = JSON.parse(readFileSync(join(root, "plan/forms-bodies.json"), "utf8"));
const FORM_IDS = { "Puppy Application": "d5945b75-2197-44a5-923d-2072899a844c", "Monthly Updates Signup": "6ec59c4b-0a37-4186-8716-f0814649987d" };
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json" };
const PNG = readFileSync(join(root, "test/mock.jpg"));

function matches(item, filter) {
  if (!filter || !Object.keys(filter).length) return true;
  if (filter.$and) return filter.$and.every((f) => matches(item, f));
  return Object.entries(filter).every(([field, cond]) => {
    const v = item[field];
    if (cond === null) return v == null;
    const [[op, want]] = Object.entries(cond);
    if (op === "$eq") return v === want;
    if (op === "$ne") return v !== want;
    if (op === "$hasSome") return want.includes(v);
    return true;
  });
}

export async function setup(context, { submissions = [], failForms = false, emptyPuppies = false } = {}) {
  await context.route("**/*", async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    if (url.origin === ORIGIN) {
      let p = url.pathname === "/" ? "/index.html" : url.pathname;
      const file = join(root, "site", p);
      if (!existsSync(file)) return route.fulfill({ status: 404, contentType: "text/html", body: readFileSync(join(root, "site/404.html")) });
      return route.fulfill({ status: 200, contentType: TYPES[extname(file)] ?? "application/octet-stream", body: readFileSync(file) });
    }
    if (url.hostname === "static.wixstatic.com") return route.fulfill({ status: 200, contentType: "image/jpeg", body: PNG, headers: { "access-control-allow-origin": "*" } });
    if (url.hostname === "cdn.jsdelivr.net" && url.pathname.includes("three")) {
      return route.fulfill({ status: 200, contentType: "text/javascript", body: readFileSync(join(root, "node_modules/three/build/three.module.min.js")), headers: { "access-control-allow-origin": "*" } });
    }
    if (url.hostname === "www.wixapis.com") {
      const cors = { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "*" };
      if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: cors });
      const json = (body, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body), headers: cors });
      const body = req.postDataJSON?.() ?? null;
      if (url.pathname === "/oauth2/token") return json({ access_token: "tok", refresh_token: "ref", expires_in: 14400 });
      if (url.pathname === "/wix-data/v2/items/query") {
        let items = (cms[body.dataCollectionId] ?? []).filter((it) => matches(it, body.query.filter));
        if (emptyPuppies && body.dataCollectionId === "puppies") items = [];
        const refs = (body.includeReferences ?? []).map((r) => r.field);
        items = items.map((it) => {
          const out = { ...it };
          for (const k of ["mom", "dad"]) if (out[k] && typeof out[k] === "object" && !refs.includes(k)) out[k] = out[k]._id;
          return out;
        });
        const { limit = 50, offset = 0 } = body.query.paging ?? {};
        const page = items.slice(offset, offset + limit);
        return json({ dataItems: page.map((d) => ({ id: d._id, data: d })), pagingMetadata: { count: page.length, total: items.length, hasNext: offset + page.length < items.length } });
      }
      const fm = url.pathname.match(/^\/form-schema-service\/v4\/forms\/(.+)$/);
      if (fm) {
        if (failForms) return json({ message: "boom" }, 500);
        const f = forms.find((x) => FORM_IDS[x.name] === fm[1]);
        return f ? json({ form: { ...f, id: fm[1], enabled: true } }) : json({ message: "not found" }, 404);
      }
      if (url.pathname === "/form-submission-service/v4/submissions") {
        submissions.push(body);
        return json({ submission: { id: "sub1", status: "CONFIRMED", formId: body.submission.formId } });
      }
      return json({ message: "unmocked " + url.pathname }, 404);
    }
    return route.abort();
  });
}
