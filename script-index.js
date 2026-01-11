/* Mobile nav + simple contact form UX */
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');

if (navToggle && navMenu) {
  navToggle.addEventListener('click', () => {
    const isOpen = navMenu.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  // Close menu when clicking a link (mobile)
  navMenu.addEventListener('click', (e) => {
    const target = e.target;
    if (target && target.matches('a.nav__link, a.btn')) {
      navMenu.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
    }
  });
}

document.getElementById('year').textContent = new Date().getFullYear();
document.body.classList.add('is-loaded');

const topbar = document.querySelector('.topbar');
if (topbar) {
  const compactOnScroll = () => {
    topbar.classList.toggle('topbar--compact', window.scrollY > 12);
  };
  compactOnScroll();
  window.addEventListener('scroll', compactOnScroll, {passive: true});
}

const heroActions = document.querySelector('.hero__actions');
if (heroActions) {
  const mq = window.matchMedia('(max-width: 760px)');
  const stickyOnScroll = () => {
    if (!mq.matches) {
      heroActions.classList.remove('is-sticky');
      return;
    }
    heroActions.classList.toggle('is-sticky', window.scrollY > 420);
  };
  stickyOnScroll();
  window.addEventListener('scroll', stickyOnScroll, {passive: true});
  mq.addEventListener('change', stickyOnScroll);
}

const ENDPOINT_URL = 'https://script.google.com/macros/s/AKfycbxWzL9DPovwolFDQd5almBuZr7r4lPev-kbJCGn6mK9H3xg67RegfwUyPqAd03H9wz4iQ/exec';

const contactForms = document.querySelectorAll('form.form');

contactForms.forEach((form) => {
  if (form.classList.contains('form--steps')) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const note = form.querySelector('.form__note');
    if (note) note.textContent = 'Sending...';
    const data = new FormData(form);
    try {
      await fetch(ENDPOINT_URL, {
        method: 'POST',
        mode: 'no-cors', // let the request reach Apps Script even if CORS headers are missing
        body: data,
      });
      if (note) note.textContent = 'Thanks! Your message was sent.';
      form.reset();
    } catch (err) {
      if (note) note.textContent = 'Sorry, there was an issue. Please try again later.';
    }
  });
});

const mentorForm = document.querySelector('#mentor.form--steps');

if (mentorForm) {
  const steps = Array.from(mentorForm.querySelectorAll('.form__step'));
  const progressText = mentorForm.querySelector('[data-progress-text]');
  const progressFill = mentorForm.querySelector('[data-progress-fill]');
  const stepLabels = Array.from(mentorForm.querySelectorAll('[data-step-label]'));
  const progressBar = mentorForm.querySelector('.form__progressBar');
  const note = mentorForm.querySelector('.form__note');
  const confirmModal = document.getElementById('mentorConfirm');
  const storageKey = 'mentorFormDraftV1';
  let currentStep = 0;

  const getStepTime = (index) => {
    const step = steps[index];
    return step ? step.dataset.time : '~2 minutes';
  };

  const updateProgress = () => {
    const stepNumber = currentStep + 1;
    const total = steps.length;
    const timeText = getStepTime(currentStep);
    if (progressText) {
      progressText.textContent = `Step ${stepNumber} of ${total} - ${timeText}`;
    }
    if (progressFill) {
      progressFill.style.width = `${(stepNumber / total) * 100}%`;
    }
    if (progressBar) {
      progressBar.setAttribute('aria-valuenow', String(stepNumber));
    }
    if (stepLabels.length) {
      stepLabels.forEach((label, index) => {
        label.classList.toggle('is-active', index === currentStep);
      });
    }
  };

  const saveDraft = () => {
    const data = {};
    const fields = mentorForm.querySelectorAll('input, select, textarea');
    fields.forEach((field) => {
      if (!field.name) return;
      if (field.type === 'checkbox') {
        if (field.checked) {
          if (!Array.isArray(data[field.name])) data[field.name] = [];
          data[field.name].push(field.value);
        }
        return;
      }
      data[field.name] = field.value;
    });
    localStorage.setItem(storageKey, JSON.stringify(data));
    localStorage.setItem(`${storageKey}:step`, String(currentStep));
  };

  const restoreDraft = () => {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      const fields = mentorForm.querySelectorAll('input, select, textarea');
      fields.forEach((field) => {
        if (!field.name || data[field.name] === undefined) return;
        if (field.type === 'checkbox') {
          const values = Array.isArray(data[field.name]) ? data[field.name] : [data[field.name]];
          field.checked = values.includes(field.value);
          return;
        }
        field.value = data[field.name];
      });
    } catch (err) {
      localStorage.removeItem(storageKey);
    }
  };

  const validateStep = (step) => {
    let isValid = true;
    const requiredFields = step.querySelectorAll('input[required], select[required], textarea[required]');
    requiredFields.forEach((field) => {
      if (!field.checkValidity()) {
        isValid = false;
        field.reportValidity();
      }
    });

    const requiredGroups = step.querySelectorAll('[data-required-group]');
    requiredGroups.forEach((group) => {
      const checkboxes = Array.from(group.querySelectorAll('input[type="checkbox"]'));
      if (!checkboxes.length) return;
      const anyChecked = checkboxes.some((box) => box.checked);
      group.classList.toggle('is-error', !anyChecked);
      if (!anyChecked) isValid = false;
    });

    return isValid;
  };

  const showStep = (index) => {
    const clamped = Math.max(0, Math.min(index, steps.length - 1));
    steps.forEach((step, stepIndex) => {
      step.classList.toggle('is-active', stepIndex === clamped);
    });
    currentStep = clamped;
    updateProgress();
    saveDraft();
  };

  const setLoadingState = (button, isLoading) => {
    if (!button) return;
    if (isLoading) {
      button.classList.add('is-loading');
      button.setAttribute('disabled', 'disabled');
      if (!button.dataset.label) button.dataset.label = button.textContent;
      button.textContent = 'Loading...';
    } else {
      button.classList.remove('is-loading');
      button.removeAttribute('disabled');
      if (button.dataset.label) button.textContent = button.dataset.label;
    }
  };

  mentorForm.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.hasAttribute('data-next')) {
      const step = steps[currentStep];
      if (!validateStep(step)) return;
      setLoadingState(target, true);
      setTimeout(() => {
        showStep(currentStep + 1);
        setLoadingState(target, false);
      }, 220);
    }
    if (target.hasAttribute('data-prev')) {
      showStep(currentStep - 1);
    }
    if (target.hasAttribute('data-modal-close') && confirmModal) {
      confirmModal.hidden = true;
      document.body.classList.remove('modal-open');
    }
  });

  
  if (confirmModal) {
    confirmModal.addEventListener('click', (event) => {
      const target = event.target;
      if (target === confirmModal || target.closest('[data-modal-close]')) {
        confirmModal.hidden = true;
        document.body.classList.remove('modal-open');
      }
    });
  }

  mentorForm.addEventListener('input', (event) => {
    const target = event.target;
    if (target && target.closest('[data-required-group]')) {
      target.closest('[data-required-group]').classList.remove('is-error');
    }
    saveDraft();
  });

  mentorForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const step = steps[currentStep];
    if (step && !validateStep(step)) return;
    if (note) note.textContent = 'Submitting...';
    const data = new FormData(mentorForm);
    try {
      await fetch(ENDPOINT_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: data,
      });
      if (note) note.textContent = 'Thanks! Your application was submitted.';
      localStorage.removeItem(storageKey);
      localStorage.removeItem(`${storageKey}:step`);
      mentorForm.reset();
      showStep(0);
      if (confirmModal) {
        confirmModal.hidden = false;
        document.body.classList.add('modal-open');
      }
    } catch (err) {
      if (note) note.textContent = 'Sorry, there was an issue. Please try again later.';
    }
  });

  restoreDraft();
  const storedStep = Number(localStorage.getItem(`${storageKey}:step`));
  if (!Number.isNaN(storedStep)) showStep(storedStep);
  else updateProgress();
}


const menteeForm = document.querySelector('#mentee.form--steps');

if (menteeForm) {
  const steps = Array.from(menteeForm.querySelectorAll('.form__step'));
  const progressText = menteeForm.querySelector('[data-progress-text]');
  const progressFill = menteeForm.querySelector('[data-progress-fill]');
  const progressBar = menteeForm.querySelector('.form__progressBar');
  const stepLabels = Array.from(menteeForm.querySelectorAll('[data-step-label]'));
  const note = menteeForm.querySelector('.form__note');
  const confirmModal = document.getElementById('menteeConfirm');
  const storageKey = 'menteeFormDraftV1';
  let currentStep = 0;

  const autoResize = (el) => {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  };

  const getStepTime = (index) => {
    const step = steps[index];
    return step ? step.dataset.time : '~2 minutes';
  };

  const updateProgress = () => {
    const stepNumber = currentStep + 1;
    const total = steps.length;
    const timeText = getStepTime(currentStep);
    if (progressText) {
      progressText.textContent = `Step ${stepNumber} of ${total} - ${timeText}`;
    }
    if (progressFill) {
      progressFill.style.width = `${(stepNumber / total) * 100}%`;
    }
    if (progressBar) {
      progressBar.setAttribute('aria-valuenow', String(stepNumber));
    }
    if (stepLabels.length) {
      stepLabels.forEach((label, index) => {
        label.classList.toggle('is-active', index === currentStep);
      });
    }
  };

  const saveDraft = () => {
    const data = {};
    const fields = menteeForm.querySelectorAll('input, select, textarea');
    fields.forEach((field) => {
      if (!field.name) return;
      if (field.type === 'checkbox') {
        if (field.checked) {
          if (!Array.isArray(data[field.name])) data[field.name] = [];
          data[field.name].push(field.value);
        }
        return;
      }
      data[field.name] = field.value;
    });
    localStorage.setItem(storageKey, JSON.stringify(data));
    localStorage.setItem(`${storageKey}:step`, String(currentStep));
  };

  const restoreDraft = () => {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      const fields = menteeForm.querySelectorAll('input, select, textarea');
      fields.forEach((field) => {
        if (!field.name || data[field.name] === undefined) return;
        if (field.type === 'checkbox') {
          const values = Array.isArray(data[field.name]) ? data[field.name] : [data[field.name]];
          field.checked = values.includes(field.value);
          return;
        }
        field.value = data[field.name];
      });
    } catch (err) {
      localStorage.removeItem(storageKey);
    }
  };

  const validateStep = (step) => {
    let isValid = true;
    const requiredFields = step.querySelectorAll('input[required], select[required], textarea[required]');
    requiredFields.forEach((field) => {
      if (!field.checkValidity()) {
        isValid = false;
        field.reportValidity();
      }
    });

    const requiredGroups = step.querySelectorAll('[data-required-group]');
    requiredGroups.forEach((group) => {
      const checkboxes = Array.from(group.querySelectorAll('input[type="checkbox"]'));
      if (!checkboxes.length) return;
      const anyChecked = checkboxes.some((box) => box.checked);
      group.classList.toggle('is-error', !anyChecked);
      if (!anyChecked) isValid = false;
    });

    return isValid;
  };

  const showStep = (index) => {
    const clamped = Math.max(0, Math.min(index, steps.length - 1));
    steps.forEach((step, stepIndex) => {
      step.classList.toggle('is-active', stepIndex === clamped);
    });
    currentStep = clamped;
    updateProgress();
    saveDraft();
  };

  const setLoadingState = (button, isLoading) => {
    if (!button) return;
    if (isLoading) {
      button.classList.add('is-loading');
      button.setAttribute('disabled', 'disabled');
      if (!button.dataset.label) button.dataset.label = button.textContent;
      button.textContent = 'Loading...';
    } else {
      button.classList.remove('is-loading');
      button.removeAttribute('disabled');
      if (button.dataset.label) button.textContent = button.dataset.label;
    }
  };

  menteeForm.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.hasAttribute('data-next')) {
      const step = steps[currentStep];
      if (!validateStep(step)) return;
      setLoadingState(target, true);
      setTimeout(() => {
        showStep(currentStep + 1);
        setLoadingState(target, false);
      }, 220);
    }
    if (target.hasAttribute('data-prev')) {
      showStep(currentStep - 1);
    }
    if (target.hasAttribute('data-modal-close') && confirmModal) {
      confirmModal.hidden = true;
      document.body.classList.remove('modal-open');
    }
  });

  if (confirmModal) {
    confirmModal.addEventListener('click', (event) => {
      const target = event.target;
      if (target === confirmModal || target.closest('[data-modal-close]')) {
        confirmModal.hidden = true;
        document.body.classList.remove('modal-open');
      }
    });
  }

  menteeForm.addEventListener('input', (event) => {
    const target = event.target;
    if (target && target.closest('[data-required-group]')) {
      target.closest('[data-required-group]').classList.remove('is-error');
    }
    if (target && target.tagName === 'TEXTAREA') {
      autoResize(target);
    }
    saveDraft();
  });

  menteeForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const step = steps[currentStep];
    if (step && !validateStep(step)) return;
    if (note) note.textContent = 'Submitting...';
    const data = new FormData(menteeForm);
    try {
      await fetch(ENDPOINT_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: data,
      });
      if (note) note.textContent = 'Thanks! Your application was submitted.';
      localStorage.removeItem(storageKey);
      localStorage.removeItem(`${storageKey}:step`);
      menteeForm.reset();
      showStep(0);
      if (confirmModal) {
        confirmModal.hidden = false;
        document.body.classList.add('modal-open');
      }
    } catch (err) {
      if (note) note.textContent = 'Sorry, there was an issue. Please try again later.';
    }
  });

  restoreDraft();
  menteeForm.querySelectorAll('textarea').forEach(autoResize);
  const storedStep = Number(localStorage.getItem(`${storageKey}:step`));
  if (!Number.isNaN(storedStep)) showStep(storedStep);
  else updateProgress();
}

const eventFilters = document.querySelectorAll('.event__filter');
const eventCards = document.querySelectorAll('.events .event');

if (eventFilters.length && eventCards.length) {
  const syncFilters = (filter, isActive) => {
    eventFilters.forEach((btn) => {
      if (btn.dataset.filter === filter) {
        btn.classList.toggle('is-active', isActive);
      }
    });
  };

  const applyFilters = () => {
    const activeFilters = Array.from(eventFilters)
      .filter((btn) => btn.classList.contains('is-active'))
      .map((btn) => btn.dataset.filter)
      .filter((filter) => filter && filter !== 'all');

    eventCards.forEach((card) => {
      const tags = (card.dataset.tags || '').split(' ').filter(Boolean);
      const shouldShow = !activeFilters.length || activeFilters.every((filter) => tags.includes(filter));
      card.style.display = shouldShow ? '' : 'none';
    });
  };

  eventFilters.forEach((btn) => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;
      if (filter === 'all') {
        eventFilters.forEach((item) => item.classList.remove('is-active'));
        syncFilters('all', true);
      } else {
        const nextState = !btn.classList.contains('is-active');
        syncFilters(filter, nextState);
        const anyActive = Array.from(eventFilters).some(
          (item) => item.dataset.filter !== 'all' && item.classList.contains('is-active')
        );
        eventFilters.forEach((item) => {
          if (item.dataset.filter === 'all') {
            item.classList.toggle('is-active', !anyActive);
          }
        });
      }
      applyFilters();
    });
  });

  applyFilters();
}

const eventDateButtons = document.querySelectorAll('.event__date');
const dateMenus = document.querySelectorAll('.event__dateMenu');

const formatCalendarDate = (dateObj) => {
  const pad = (num) => String(num).padStart(2, '0');
  return `${dateObj.getFullYear()}${pad(dateObj.getMonth() + 1)}${pad(dateObj.getDate())}T${pad(dateObj.getHours())}${pad(dateObj.getMinutes())}00`;
};

const closeDateMenus = () => {
  dateMenus.forEach((menu) => {
    menu.hidden = true;
  });
};

if (eventDateButtons.length) {
  eventDateButtons.forEach((btn) => {
    btn.addEventListener('click', (event) => {
      event.stopPropagation();
      const wrap = btn.closest('.event__dateWrap');
      const menu = wrap ? wrap.querySelector('.event__dateMenu') : null;
      if (!menu) return;
      const isOpen = !menu.hidden;
      closeDateMenus();
      menu.hidden = isOpen;
      if (!menu.hidden) {
        const date = btn.dataset.date || '';
        const time = btn.dataset.time || '18:00';
        const title = btn.dataset.title || 'Sac Pathways Event';
        const start = new Date(`${date}T${time}`);
        const end = new Date(start.getTime() + 60 * 60 * 1000);
        const startStr = formatCalendarDate(start);
        const endStr = formatCalendarDate(end);
        const addLink = menu.querySelector('[data-calendar-action=\"add\"]');
        const monthLink = menu.querySelector('[data-calendar-action=\"month\"]');
        if (addLink) {
          addLink.href = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startStr}/${endStr}`;
        }
        if (monthLink && date) {
          const [year, month] = date.split('-');
          monthLink.href = `https://calendar.google.com/calendar/u/0/r/month/${Number(year)}/${Number(month)}/1`;
        }
      }
    });
  });

  document.addEventListener('click', closeDateMenus);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeDateMenus();
  });
}

const speakerModal = document.getElementById('speakerModal');
const speakerModalTitle = document.getElementById('speakerModalTitle');
const speakerModalText = document.getElementById('speakerModalText');
const speakerAvatars = document.querySelectorAll('.speaker__avatar');

if (speakerModal && speakerModalTitle && speakerModalText && speakerAvatars.length) {
  const closeSpeakerModal = () => {
    speakerModal.hidden = true;
    document.body.classList.remove('modal-open');
  };

  speakerAvatars.forEach((avatar) => {
    avatar.addEventListener('click', () => {
      const name = avatar.dataset.name || 'Speaker';
      const bio = avatar.dataset.bio || '';
      speakerModalTitle.textContent = name;
      speakerModalText.textContent = bio;
      speakerModal.hidden = false;
      document.body.classList.add('modal-open');
    });
  });

  speakerModal.addEventListener('click', (event) => {
    if (event.target === speakerModal || event.target.closest('[data-modal-close]')) {
      closeSpeakerModal();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !speakerModal.hidden) {
      closeSpeakerModal();
    }
  });
}

const rippleTargets = document.querySelectorAll('.btn');
rippleTargets.forEach((btn) => {
  btn.addEventListener('click', (e) => {
    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
    const existing = btn.querySelector('.ripple');
    if (existing) existing.remove();
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 650);
  });
});

// Scroll reveal for sections/cards/events
const revealTargets = document.querySelectorAll(
  '.hero, .section, .help__grid .card, .help__image, .events .event, .panel, .form, .journey__step, .story-card'
);

if (revealTargets.length && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    {threshold: 0.18}
  );

  revealTargets.forEach((el) => {
    el.classList.add('reveal');
    observer.observe(el);
  });
}

document.querySelectorAll('.help__grid .card').forEach((card, index) => {
  card.style.setProperty('--reveal-delay', `${index * 90}ms`);
});

document.querySelectorAll('.journey__step').forEach((step, index) => {
  step.style.setProperty('--reveal-delay', `${index * 120}ms`);
});

const journeyTrack = document.querySelector('[data-journey-track]');
const journeySteps = Array.from(document.querySelectorAll('[data-journey-step]'));
const journeyDots = Array.from(document.querySelectorAll('[data-journey-dot]'));
const journeyFill = document.querySelector('[data-journey-fill]');
const journeyProgress = document.querySelector('.journey__progress');

if (journeyTrack && journeySteps.length) {
  const positionDots = () => {
    if (!journeyProgress || !journeyDots.length) return;
    journeyProgress.style.height = `${journeyTrack.offsetHeight}px`;
    journeySteps.forEach((step, index) => {
      const dot = journeyDots[index];
      if (!dot) return;
      const offset = step.offsetTop + step.offsetHeight / 2;
      dot.style.top = `${offset}px`;
    });
  };

  const setActiveStep = (index) => {
    const clamped = Math.max(0, Math.min(index, journeySteps.length - 1));
    journeySteps.forEach((step, stepIndex) => {
      step.classList.toggle('is-active', stepIndex === clamped);
    });
    journeyDots.forEach((dot, dotIndex) => {
      dot.classList.toggle('is-active', dotIndex <= clamped);
    });
    if (journeyFill && journeyDots[clamped]) {
      const top = parseFloat(journeyDots[clamped].style.top || '0');
      journeyFill.style.height = `${top}px`;
    }
  };

  positionDots();
  setActiveStep(0);
  window.addEventListener('resize', () => {
    window.requestAnimationFrame(positionDots);
  });

  journeySteps.forEach((step) => {
    step.addEventListener('click', () => {
      const isOpen = step.classList.toggle('is-open');
      step.setAttribute('aria-expanded', String(isOpen));
    });
    step.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        const isOpen = step.classList.toggle('is-open');
        step.setAttribute('aria-expanded', String(isOpen));
      }
    });
  });

  if ('IntersectionObserver' in window) {
    const journeyObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const index = journeySteps.indexOf(entry.target);
          if (index >= 0) setActiveStep(index);
          journeyTrack.classList.add('is-animated');
        });
      },
      {threshold: 0.45, rootMargin: '-20% 0px -45% 0px'}
    );

    journeySteps.forEach((step) => journeyObserver.observe(step));
  }
}

const storiesTrack = document.querySelector('[data-stories-track]');
const storiesPrev = document.querySelector('[data-stories-prev]');
const storiesNext = document.querySelector('[data-stories-next]');
const storiesDots = document.querySelector('[data-stories-dots]');

if (storiesTrack) {
  const cards = Array.from(storiesTrack.querySelectorAll('.story-card'));
  let autoScrollTimer = null;
  let isHovering = false;
  if (storiesDots) {
    storiesDots.innerHTML = '';
    cards.forEach((card, index) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'stories__dot';
      dot.setAttribute('aria-label', `Go to story ${index + 1}`);
      dot.addEventListener('click', () => {
        const width = card.getBoundingClientRect().width + 16;
        storiesTrack.scrollTo({left: index * width, behavior: 'smooth'});
      });
      storiesDots.appendChild(dot);
    });
  }

  const activateVisibleCard = () => {
    let firstVisibleIndex = -1;
    cards.forEach((card, index) => {
      const rect = card.getBoundingClientRect();
      const trackRect = storiesTrack.getBoundingClientRect();
      const isVisible = rect.left >= trackRect.left && rect.right <= trackRect.right + 10;
      if (isVisible && firstVisibleIndex === -1) firstVisibleIndex = index;
    });
    cards.forEach((card, index) => {
      card.classList.toggle('is-active', index === firstVisibleIndex);
      if (storiesDots && storiesDots.children[index]) {
        storiesDots.children[index].classList.toggle('is-active', index === firstVisibleIndex);
      }
    });
  };

  const scrollByCard = (dir) => {
    const card = storiesTrack.querySelector('.story-card');
    if (!card) return;
    const gap = 16;
    const width = card.getBoundingClientRect().width + gap;
    storiesTrack.scrollBy({left: dir * width, behavior: 'smooth'});
  };

  const startAutoScroll = () => {
    if (autoScrollTimer) return;
    autoScrollTimer = setInterval(() => {
      if (isHovering) return;
      scrollByCard(1);
    }, 5200);
  };

  const stopAutoScroll = () => {
    if (autoScrollTimer) clearInterval(autoScrollTimer);
    autoScrollTimer = null;
  };

  storiesPrev?.addEventListener('click', () => scrollByCard(-1));
  storiesNext?.addEventListener('click', () => scrollByCard(1));
  storiesTrack.addEventListener('scroll', () => window.requestAnimationFrame(activateVisibleCard));
  window.addEventListener('resize', () => window.requestAnimationFrame(activateVisibleCard));
  storiesTrack.addEventListener('mouseenter', () => { isHovering = true; });
  storiesTrack.addEventListener('mouseleave', () => { isHovering = false; });
  startAutoScroll();
  activateVisibleCard();
}
