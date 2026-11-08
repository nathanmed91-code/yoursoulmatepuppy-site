// Wix media → browser-loadable URLs — copied from wix-headless-templates shared/rest/media.ts.
const STATIC = "https://static.wixstatic.com/media";
const FILL = /\/v1\/fill\/w_\d+,h_\d+/;
const BARE_FILE_ID = /^[\w-]+~mv2\.[a-z0-9]+$/i;

function rawOf(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  const o = value as { image?: unknown; url?: string | null; id?: string | null };
  if (o.image != null && typeof o.image === "object") return rawOf(o.image);
  return (typeof o.image === "string" ? o.image : null) ?? o.url ?? o.id ?? "";
}

function fileOf(v: string): string {
  if (v.startsWith("wix:image://")) return v.slice("wix:image://v1/".length).split("/")[0].split("#")[0];
  if (BARE_FILE_ID.test(v)) return v;
  const m = v.match(/^https:\/\/static\.wixstatic\.com\/media\/([^/?#]+)/);
  return m ? m[1] : "";
}

export function imgSrc(value: unknown, width = 600, height = 600): string {
  const v = rawOf(value);
  if (!v) return "";
  const file = fileOf(v);
  if (file) return `${STATIC}/${file}/v1/fill/w_${width},h_${height},al_c,q_90/${file}`;
  return v;
}

export function imgSrcSet(value: unknown, widths: number[] = [320, 480, 640, 960], ratio = 1): string {
  const v = rawOf(value);
  if (!v) return "";
  if (v.startsWith("wix:image://") || BARE_FILE_ID.test(v)) return widths.map((w) => `${imgSrc(value, w, Math.round(w * ratio))} ${w}w`).join(", ");
  if (v.includes("static.wixstatic.com/") && FILL.test(v)) {
    return widths.map((w) => `${v.replace(FILL, `/v1/fill/w_${w},h_${Math.round(w * ratio)}`)} ${w}w`).join(", ");
  }
  return v;
}

export function imgAttrs(value: unknown, sizes: string, ratio = 1, widths?: number[]): Record<string, string> {
  const src = imgSrc(value, 640, Math.round(640 * ratio));
  if (!src) return {};
  return { src, srcset: imgSrcSet(value, widths, ratio), sizes, loading: "lazy", decoding: "async" };
}

export function imgRatio(value: unknown): number | null {
  const v = rawOf(value);
  if (!v) return null;
  const size = v.startsWith("wix:image://")
    ? [v.match(/[#&]originWidth=(\d+)/)?.[1], v.match(/[#&]originHeight=(\d+)/)?.[1]]
    : (v.match(/\/v1\/fill\/w_(\d+),h_(\d+)/)?.slice(1) ?? []);
  const w = Number(size[0]);
  const h = Number(size[1]);
  return w > 0 && h > 0 ? h / w : null;
}

export function mediaKey(value: unknown): string {
  const v = rawOf(value);
  if (!v) return "";
  if (v.startsWith("wix:image://")) return v.slice("wix:image://v1/".length).split("/")[0].split("#")[0];
  const m = v.match(/^https:\/\/static\.wixstatic\.com\/media\/([^/?#]+)/);
  return m ? m[1] : v;
}
