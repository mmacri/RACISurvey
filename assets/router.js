export function basePath() {
  const path = window.location.pathname;
  const parts = path.split('/').filter(Boolean);
  if (parts.length && parts[0] !== '') {
    const repo = parts[0];
    if (repo && repo !== '') {
      return path.includes(`/${repo}/`) ? `/${repo}` : '';
    }
  }
  return '';
}

export function assetUrl(relative) {
  const base = basePath();
  return `${base}/${relative}`.replace('//','/');
}

export function markNav(active) {
  document.querySelectorAll('[data-nav]')?.forEach(link => {
    if (link.getAttribute('href')?.includes(active)) link.classList.add('active');
  });
}
