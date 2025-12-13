const Router = (() => {
  function init() {
    const links = document.querySelectorAll('[data-nav]');
    const path = window.location.pathname;
    links.forEach(l => {
      const href = l.getAttribute('href');
      if (path.endsWith(href.split('/').pop())) {
        l.classList.add('active');
      }
    });
  }
  return { init };
})();

export default Router;
