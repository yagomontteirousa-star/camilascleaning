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

  const video = document.querySelector('.work-gallery__video video');
  if (video && 'IntersectionObserver' in window) {
    const videoObserver = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) video.play().catch(() => {});
      else video.pause();
    }, { threshold: 0.35 });
    videoObserver.observe(video);
  }

  const reviewCarousel = document.querySelector('[data-review-carousel]');
  if (reviewCarousel) {
    const track = reviewCarousel.querySelector('.review-track');
    const sourceGroup = reviewCarousel.querySelector('.review-group');
    const duplicateGroup = sourceGroup?.cloneNode(true);

    if (track && duplicateGroup) {
      duplicateGroup.setAttribute('aria-hidden', 'true');
      track.append(duplicateGroup);
      reviewCarousel.classList.add('is-ready');

      let carouselInView = true;
      const syncCarouselMotion = () => {
        reviewCarousel.classList.toggle('is-paused', document.hidden || !carouselInView);
      };

      if ('IntersectionObserver' in window) {
        const carouselObserver = new IntersectionObserver(([entry]) => {
          carouselInView = entry.isIntersecting;
          syncCarouselMotion();
        }, { threshold: 0.08 });
        carouselObserver.observe(reviewCarousel);
      }

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
