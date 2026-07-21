(() => {
  const setupExperience = () => {
    const startedAt = performance.now();
    const root = document.documentElement;
    const loader = document.querySelector('.site-loader');
    root.classList.add('reveal-ready');
    document.body.classList.add('site-loading');

    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -8%' });
    document.querySelectorAll('.reveal').forEach((item) => revealObserver.observe(item));

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      const remaining = Math.max(0, 950 - (performance.now() - startedAt));
      setTimeout(() => {
        loader?.classList.add('is-leaving');
        document.body.classList.remove('site-loading');
        setTimeout(() => loader?.remove(), 520);
      }, remaining);
    };
    if (document.readyState === 'complete') finish();
    else window.addEventListener('load', finish, { once: true });
    setTimeout(finish, 2600);
  };

  const setupVideo = () => {
    const video = document.querySelector('.work-photo__video');
    if (!video) return;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) video.play().catch(() => {});
      else video.pause();
    }, { threshold: 0.45 });
    observer.observe(video);
  };

  document.querySelectorAll('.mobile-nav a').forEach((link) => {
    link.addEventListener('click', () => link.closest('details')?.removeAttribute('open'));
  });
  setupExperience();
  setupVideo();
})();
