const Router = (() => {
  let routes = {};
  let container;

  async function init(registry, targetId = 'page-container') {
    routes = registry;
    container = document.getElementById(targetId);
    window.addEventListener('hashchange', handleRoute);
    if (!window.location.hash) window.location.hash = '#/dashboard';
    await handleRoute();
  }

  async function handleRoute() {
    const hash = window.location.hash.replace('#/', '') || 'dashboard';
    const path = `pages/${hash}.html`;
    const res = await fetch(path);
    const html = await res.text();
    container.innerHTML = html;
    document.querySelectorAll('[data-route]').forEach(link => {
      link.classList.toggle('active', link.getAttribute('data-route') === hash);
    });
    if (typeof routes[hash] === 'function') routes[hash]();
  }

  return { init };
})();

export default Router;
