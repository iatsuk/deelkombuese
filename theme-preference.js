// Applies a theme pinned with the header switch before the first paint.
try {
  const theme = localStorage.getItem('deelkombuese.theme');
  if (theme === 'light' || theme === 'dark') document.documentElement.dataset.theme = theme;
} catch {
  // Storage may be unavailable; the system theme then applies.
}
