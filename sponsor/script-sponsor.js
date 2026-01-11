/* Sponsor page interactions */
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');

if (navToggle && navMenu) {
  navToggle.addEventListener('click', () => {
    const isOpen = navMenu.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  navMenu.addEventListener('click', (e) => {
    const target = e.target;
    if (target && target.matches('a.nav__link, a.btn')) {
      navMenu.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
    }
  });
}

const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

document.body.classList.add('is-loaded');

const topbar = document.querySelector('.topbar');
if (topbar) {
  const compactOnScroll = () => {
    topbar.classList.toggle('topbar--compact', window.scrollY > 12);
  };
  compactOnScroll();
  window.addEventListener('scroll', compactOnScroll, {passive: true});
}

const ENDPOINT_URL = 'https://script.google.com/macros/s/AKfycbxWzL9DPovwolFDQd5almBuZr7r4lPev-kbJCGn6mK9H3xg67RegfwUyPqAd03H9wz4iQ/exec';
const sponsorForm = document.getElementById('sponsorForm');
const confirmModal = document.getElementById('sponsorConfirm');

if (sponsorForm) {
  const steps = Array.from(sponsorForm.querySelectorAll('.form__step'));
  const progressText = sponsorForm.querySelector('[data-progress-text]');
  const progressFill = sponsorForm.querySelector('[data-progress-fill]');
  const progressBar = sponsorForm.querySelector('.form__progressBar');
  const stepLabels = Array.from(sponsorForm.querySelectorAll('[data-step-label]'));
  const note = sponsorForm.querySelector('.form__note');
  const storageKey = 'sponsorFormDraftV1';
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
    const fields = sponsorForm.querySelectorAll('input, select, textarea');
    fields.forEach((field) => {
      if (!field.name) return;
      if (field.type === 'checkbox') {
        if (field.checked) {
          if (!Array.isArray(data[field.name])) data[field.name] = [];
          data[field.name].push(field.value);
        }
        return;
      }
      if (field.type === 'radio') {
        if (field.checked) data[field.name] = field.value;
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
      const fields = sponsorForm.querySelectorAll('input, select, textarea');
      fields.forEach((field) => {
        if (!field.name || data[field.name] === undefined) return;
        if (field.type === 'checkbox') {
          const values = Array.isArray(data[field.name]) ? data[field.name] : [data[field.name]];
          field.checked = values.includes(field.value);
          return;
        }
        if (field.type === 'radio') {
          field.checked = data[field.name] === field.value;
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

  sponsorForm.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.hasAttribute('data-next')) {
      const step = steps[currentStep];
      if (!validateStep(step)) return;
      showStep(currentStep + 1);
    }
    if (target.hasAttribute('data-prev')) {
      showStep(currentStep - 1);
    }
    if (target.hasAttribute('data-modal-close') && confirmModal) {
      confirmModal.hidden = true;
      document.body.classList.remove('modal-open');
    }
  });

  sponsorForm.addEventListener('input', (event) => {
    const target = event.target;
    if (target && target.closest('[data-required-group]')) {
      target.closest('[data-required-group]').classList.remove('is-error');
    }
    saveDraft();
  });

  sponsorForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const step = steps[currentStep];
    if (step && !validateStep(step)) return;
    if (note) note.textContent = 'Submitting...';
    const data = new FormData(sponsorForm);
    try {
      await fetch(ENDPOINT_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: data,
      });
      if (note) note.textContent = 'Submitted successfully.';
      localStorage.removeItem(storageKey);
      localStorage.removeItem(`${storageKey}:step`);
      sponsorForm.reset();
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

if (confirmModal) {
  confirmModal.addEventListener('click', (event) => {
    const target = event.target;
    if (target === confirmModal || target.closest('[data-modal-close]')) {
      confirmModal.hidden = true;
      document.body.classList.remove('modal-open');
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
