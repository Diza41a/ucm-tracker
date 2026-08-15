import { Linking, Platform } from 'react-native';

/** RFC 3986 scheme — http, mailto, obsidian, notion, etc. */
const HAS_URI_SCHEME = /^[a-z][a-z0-9+.-]*:/i;

/** Links saved by the native editor with defaultHttps=true, e.g. https://obsidian://... */
const CORRUPTED_HTTPS_SCHEME = /^https?:\/\/([a-z][a-z0-9+.-]*:.+)$/i;

export function sanitizeLinkHref(url: string) {
  let href = url.trim();
  if (!href) return '';

  const corrupted = href.match(CORRUPTED_HTTPS_SCHEME);
  if (corrupted) {
    href = corrupted[1];
  }

  return href;
}

function normalizeExternalUrl(url: string) {
  const href = sanitizeLinkHref(url);
  if (!href) return '';
  if (HAS_URI_SCHEME.test(href)) {
    return href;
  }
  return `https://${href}`;
}

/** Opens the OS browser or registered app. Never embeds content in-app. */
export async function openExternalLink(url: string) {
  const href = normalizeExternalUrl(url);
  if (!href) return;

  if (Platform.OS === 'web') {
    window.open(href, '_blank', 'noopener,noreferrer');
    return;
  }

  try {
    await Linking.openURL(href);
  } catch {
    // Ignore invalid or blocked URLs.
  }
}
