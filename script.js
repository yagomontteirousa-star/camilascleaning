(() => {
  const header = document.querySelector('[data-header]');
  const mobileNav = document.querySelector('.mobile-nav');
  const form = document.querySelector('#consultation-form');
  const formStatus = document.querySelector('#form-status');
  const startDate = document.querySelector('#start-date');

  const setHeaderState = () => header?.classList.toggle('is-scrolled', window.scrollY > 18);
  setHeaderState();
  window.addEventListener('scroll', setHeaderState, { passive: true });

  mobileNav?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => mobileNav.removeAttribute('open'));
  });

  document.addEventListener('click', (event) => {
    if (mobileNav?.hasAttribute('open') && !mobileNav.contains(event.target)) {
      mobileNav.removeAttribute('open');
    }
  });

  document.querySelectorAll('[data-checklist-accordion]').forEach((accordion) => {
    const items = [...accordion.querySelectorAll('.checklist-item')];
    items.forEach((item) => {
      item.addEventListener('toggle', () => {
        if (!item.open) return;
        items.forEach((otherItem) => {
          if (otherItem !== item) otherItem.open = false;
        });
      });
    });
  });

  document.querySelectorAll('[data-supplies-carousel]').forEach((carousel) => {
    const viewport = carousel.querySelector('[data-supplies-viewport]');
    const cards = [...carousel.querySelectorAll('.supply-card')];
    const previousButton = carousel.querySelector('[data-supplies-prev]');
    const nextButton = carousel.querySelector('[data-supplies-next]');
    const dotsContainer = carousel.querySelector('[data-supplies-dots]');
    const status = carousel.querySelector('[data-supplies-status]');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let visibleCards = 1;
    let pageCount = cards.length;
    let indicatorSpan = 1;
    let currentPage = 0;
    let interacting = false;
    let resumeTimer;

    const getGap = () => Number.parseFloat(getComputedStyle(viewport.querySelector('.supplies-track')).columnGap) || 0;
    const getStep = () => (cards[0]?.getBoundingClientRect().width || viewport.clientWidth) + getGap();

    const updateState = (page, announce = false) => {
      currentPage = Math.max(0, Math.min(pageCount - 1, page));
      const currentCard = currentPage * visibleCards;
      const activeIndicator = Math.min(Math.floor(currentCard / indicatorSpan), dotsContainer.children.length - 1);
      dotsContainer.querySelectorAll('button').forEach((dot, index) => {
        dot.setAttribute('aria-current', String(index === activeIndicator));
      });
      const first = currentPage * visibleCards + 1;
      const last = Math.min(first + visibleCards - 1, cards.length);
      status.setAttribute('aria-live', announce ? 'polite' : 'off');
      status.textContent = `${first}–${last} of ${cards.length}`;
    };

    const goToPage = (page, announce = true) => {
      const wrappedPage = (page + pageCount) % pageCount;
      const target = Math.min(wrappedPage * visibleCards * getStep(), viewport.scrollWidth - viewport.clientWidth);
      viewport.scrollTo({ left: target, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
      updateState(wrappedPage, announce);
    };

    const buildDots = () => {
      const step = getStep();
      visibleCards = Math.max(1, Math.floor((viewport.clientWidth + getGap()) / step));
      pageCount = Math.ceil(cards.length / visibleCards);
      indicatorSpan = window.innerWidth <= 620 ? 4 : visibleCards;
      const indicatorCount = Math.ceil(cards.length / indicatorSpan);
      currentPage = Math.min(currentPage, pageCount - 1);
      dotsContainer.replaceChildren();
      for (let index = 0; index < indicatorCount; index += 1) {
        const dot = document.createElement('button');
        dot.type = 'button';
        const firstProduct = index * indicatorSpan + 1;
        const lastProduct = Math.min(firstProduct + indicatorSpan - 1, cards.length);
        dot.setAttribute('aria-label', `Show products ${firstProduct} through ${lastProduct}`);
        dot.addEventListener('click', () => goToPage(Math.floor((index * indicatorSpan) / visibleCards)));
        dotsContainer.append(dot);
      }
      updateState(currentPage);
    };

    const pauseTemporarily = () => {
      interacting = true;
      window.clearTimeout(resumeTimer);
      resumeTimer = window.setTimeout(() => { interacting = false; }, 12000);
    };

    previousButton.addEventListener('click', () => { pauseTemporarily(); goToPage(currentPage - 1); });
    nextButton.addEventListener('click', () => { pauseTemporarily(); goToPage(currentPage + 1); });
    carousel.addEventListener('pointerenter', () => { interacting = true; });
    carousel.addEventListener('pointerleave', () => { interacting = false; });
    carousel.addEventListener('focusin', () => { interacting = true; });
    carousel.addEventListener('focusout', () => { interacting = false; });
    viewport.addEventListener('pointerdown', pauseTemporarily, { passive: true });
    let scrollTimer;
    viewport.addEventListener('scroll', () => {
      window.clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(() => {
        const cardIndex = Math.round(viewport.scrollLeft / getStep());
        updateState(Math.floor(cardIndex / visibleCards));
      }, 100);
    }, { passive: true });

    let resizeTimer;
    window.addEventListener('resize', () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => { buildDots(); goToPage(currentPage, false); }, 150);
    });

    buildDots();
    window.setInterval(() => {
      if (!interacting && !document.hidden && !reducedMotion.matches) goToPage(currentPage + 1, false);
    }, 8000);
  });

  const video = document.querySelector('.work-gallery__video video');
  if (video && 'IntersectionObserver' in window) {
    const videoObserver = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) video.play().catch(() => {});
      else video.pause();
    }, { threshold: 0.35 });
    videoObserver.observe(video);
  }

  const reviewCarousel = document.querySelector('[data-review-carousel]');
  const reviewToggle = document.querySelector('[data-review-toggle]');
  if (reviewCarousel) {
    const track = reviewCarousel.querySelector('.review-track');
    const sourceGroup = reviewCarousel.querySelector('.review-group');
    const duplicateGroup = sourceGroup?.cloneNode(true);

    if (track && duplicateGroup) {
      duplicateGroup.setAttribute('aria-hidden', 'true');
      track.append(duplicateGroup);
      reviewCarousel.classList.add('is-ready');

      let carouselInView = true;
      let userPaused = false;
      const syncCarouselMotion = () => {
        reviewCarousel.classList.toggle('is-paused', document.hidden || !carouselInView);
        reviewCarousel.classList.toggle('is-user-paused', userPaused);
        if (reviewToggle) {
          reviewToggle.setAttribute('aria-pressed', String(userPaused));
          reviewToggle.querySelector('span').textContent = userPaused ? 'Resume reviews' : 'Pause reviews';
        }
      };

      if ('IntersectionObserver' in window) {
        const carouselObserver = new IntersectionObserver(([entry]) => {
          carouselInView = entry.isIntersecting;
          syncCarouselMotion();
        }, { threshold: 0.08 });
        carouselObserver.observe(reviewCarousel);
      }

      reviewToggle?.addEventListener('click', () => {
        userPaused = !userPaused;
        syncCarouselMotion();
      });
      document.addEventListener('visibilitychange', syncCarouselMotion);
      syncCarouselMotion();
    }
  }

  if (startDate) {
    const now = new Date();
    const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    startDate.min = localDate.toISOString().slice(0, 10);
  }

  const clean = (value) => String(value || '').replace(/[\r\n]+/g, ' ').trim();

  const buildConsultationMailto = (data) => {
    const subject = `Consultation request — ${clean(data.name)} — ${clean(data.city)}`;
    const lines = [
      'NEW CONSULTATION REQUEST',
      '',
      `Name: ${clean(data.name)}`,
      `Email: ${clean(data.email)}`,
      `Phone: ${clean(data.phone)}`,
      `City: ${clean(data.city)}`,
      `Approximate home size: ${clean(data.home_size) || 'Not provided'}`,
      `Bedrooms / bathrooms: ${clean(data.bedrooms_bathrooms) || 'Not provided'}`,
      `Desired frequency: ${clean(data.frequency) || 'Not provided'}`,
      `Service type: ${clean(data.service_type)}`,
      `Preferred start date: ${clean(data.preferred_start_date) || 'Not provided'}`,
      `How they heard about us: ${clean(data.referral) || 'Not provided'}`,
      '',
      'Message:',
      String(data.message || '').trim() || 'No additional message.'
    ];
    return `mailto:info.camilascleaning@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
  };

  window.buildConsultationMailto = buildConsultationMailto;

  form?.addEventListener('input', (event) => {
    if (event.target.matches('input, select, textarea')) event.target.removeAttribute('aria-invalid');
    formStatus?.classList.remove('is-error');
  });

  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    const honeypot = form.elements.company_website;
    if (honeypot?.value) return;

    const requiredFields = [...form.querySelectorAll('[required]')];
    requiredFields.forEach((field) => field.setAttribute('aria-invalid', String(!field.validity.valid)));

    const phone = form.elements.phone;
    const phoneDigits = String(phone.value || '').replace(/\D/g, '');
    if (phoneDigits.length < 7) {
      phone.setCustomValidity('Please enter a valid phone number.');
      phone.setAttribute('aria-invalid', 'true');
    } else {
      phone.setCustomValidity('');
    }

    if (!form.checkValidity()) {
      formStatus.textContent = 'Please review the highlighted fields and complete the required information.';
      formStatus.classList.add('is-error');
      form.querySelector(':invalid')?.focus();
      return;
    }

    const data = Object.fromEntries(new FormData(form).entries());
    formStatus.textContent = 'Your email app is opening with the consultation details ready to review and send.';
    formStatus.classList.remove('is-error');
    window.location.href = buildConsultationMailto(data);
  });
})();
