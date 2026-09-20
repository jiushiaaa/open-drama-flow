import https from "node:https";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { Readable } from "node:stream";
import { shutdownSignal } from "./background-jobs.mjs";

export function publicAddress(address) {
  if (isIP(address) === 4) {
    const [a, b] = address.split(".").map(Number);
    return !(a === 0 || a === 10 || a === 127 || a >= 224 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && [0, 168].includes(b)) || (a === 100 && b >= 64 && b <= 127) || (a === 198 && [18, 19].includes(b)));
  }
  // Only global unicast IPv6; reject mapped IPv4, loopback, link-local and ULA.
  return isIP(address) === 6 && /^[23][0-9a-f]{3}:/i.test(address) && !/^2001:(?:db8|0):/i.test(address);
}
export function providerUrl(value) {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password || url.hash || (url.port && url.port !== "443") || /\.(?:localhost|local|internal)$/i.test(url.hostname) || !url.hostname.includes(".") || (isIP(url.hostname) && !publicAddress(url.hostname))) throw new Error("PROVIDER_PUBLIC_HTTPS_REQUIRED");
  return url;
}
// Pin the validated DNS answer to the TLS connection. No redirect or second DNS lookup.
export async function publicFetch(value, options = {}) {
  const url = providerUrl(value), addresses = await lookup(url.hostname, { all: true });
  if (!addresses.length || addresses.some(item => !publicAddress(item.address))) throw new Error("PROVIDER_PRIVATE_NETWORK_REJECTED");
  const signal = options.signal || AbortSignal.any([shutdownSignal, AbortSignal.timeout(60000)]);
  return new Promise((resolve, reject) => {
    const request = https.request(url, { method: options.method || "GET", headers: options.headers, signal,
      lookup: (_host, settings, callback) => settings.all ? callback(null, addresses) : callback(null, addresses[0].address, addresses[0].family) }, response => {
      const status = response.statusCode;
      if (status >= 300 && status < 400) { response.destroy(); reject(new Error("PROVIDER_REDIRECT_REJECTED")); return; }
      const body = [204, 205, 304].includes(status) ? null : Readable.toWeb(response);
      if (!body) response.resume();
      resolve(new Response(body, { status, headers: Object.fromEntries(Object.entries(response.headers).filter(([, v]) => v !== undefined).map(([k, v]) => [k, Array.isArray(v) ? v.join(", ") : v])) }));
    });
    request.on("error", () => reject(new Error("PROVIDER_NETWORK_ERROR_RECONCILE_BEFORE_RETRY")));
    request.end(options.body);
  });
}
