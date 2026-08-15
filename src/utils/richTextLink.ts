function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildLinkHtml(title: string, url: string) {
  const safeUrl = escapeHtml(url.trim());
  const safeTitle = escapeHtml(title.trim() || url.trim());
  return `<a href="${safeUrl}">${safeTitle}</a>`;
}
