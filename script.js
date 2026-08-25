/* =========================================================
   LAETITIA MEILLON — script.js (vanilla JS)
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  initHeaderScroll();
  initMobileMenu();
  initScrollReveal();
  initActiveNav();
  initContactForm();
});

/* ---------------------------------------------------------
   Header: état "scrolled" pour ombre/bordure subtile
   --------------------------------------------------------- */
function initHeaderScroll(){
  const header = document.querySelector('.site-header');
  if(!header) return;

  const setState = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 12);
  };
  setState();
  window.addEventListener('scroll', setState, { passive: true });
}

/* ---------------------------------------------------------
   Menu mobile
   --------------------------------------------------------- */
function initMobileMenu(){
  const toggle = document.querySelector('.hamburger');
  const menu = document.querySelector('.mobile-menu');
  if(!toggle || !menu) return;

  const links = menu.querySelectorAll('a');

  const open = () => {
    menu.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  };
  const close = () => {
    menu.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  toggle.addEventListener('click', () => {
    const isOpen = menu.classList.contains('is-open');
    isOpen ? close() : open();
  });

  links.forEach(link => link.addEventListener('click', close));

  document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape' && menu.classList.contains('is-open')) close();
  });
}

/* ---------------------------------------------------------
   Apparition progressive au scroll
   --------------------------------------------------------- */
function initScrollReveal(){
  const items = document.querySelectorAll('.reveal');
  if(!items.length) return;

  if(!('IntersectionObserver' in window)){
    items.forEach(el => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

  items.forEach(el => observer.observe(el));
}

/* ---------------------------------------------------------
   Lien de navigation actif
   --------------------------------------------------------- */
function initActiveNav(){
  const current = (window.location.pathname.split('/').pop() || 'index.html');
  document.querySelectorAll('.main-nav a, .mobile-menu a').forEach(link => {
    const href = link.getAttribute('href');
    if(href === current || (current === '' && href === 'index.html')){
      link.setAttribute('aria-current', 'page');
    }
  });
}

/* ---------------------------------------------------------
   Formulaire de contact — validation + envoi Web3Forms
   --------------------------------------------------------- */
function initContactForm(){
  const form = document.querySelector('#contact-form');
  if(!form) return;

  const status = form.querySelector('.form-status');

  const validators = {
    prenom: (v) => v.trim().length >= 2 || 'Merci d\'indiquer votre prénom.',
    nom: (v) => v.trim().length >= 2 || 'Merci d\'indiquer votre nom.',
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || 'Merci d\'indiquer une adresse email valide.',
    sujet: (v) => v.trim().length >= 2 || 'Merci d\'indiquer un sujet.',
    message: (v) => v.trim().length >= 10 || 'Votre message doit contenir au moins 10 caractères.'
  };

  const showError = (field, message) => {
    const wrapper = field.closest('.field');
    if(!wrapper) return;

    wrapper.classList.add('has-error');

    const errorEl = wrapper.querySelector('.field__error');
    if(errorEl) errorEl.textContent = message;
  };

  const clearError = (field) => {
    const wrapper = field.closest('.field');
    if(!wrapper) return;

    wrapper.classList.remove('has-error');

    const errorEl = wrapper.querySelector('.field__error');
    if(errorEl) errorEl.textContent = '';
  };

  const validateField = (field) => {
    const rule = validators[field.name];
    if(!rule) return true;

    const result = rule(field.value);

    if(result === true){
      clearError(field);
      return true;
    }

    showError(field, result);
    return false;
  };

  form.querySelectorAll('input, textarea').forEach(field => {
    field.addEventListener('blur', () => validateField(field));

    field.addEventListener('input', () => {
      if(field.closest('.field')?.classList.contains('has-error')){
        validateField(field);
      }
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    let isValid = true;

    form.querySelectorAll('input[required], textarea[required]').forEach(field => {
      if(!validateField(field)) {
        isValid = false;
      }
    });

    if(status){
      status.classList.remove(
        'form-status--success',
        'form-status--error'
      );
    }

    if(!isValid){
      if(status){
        status.textContent = 'Merci de corriger les champs indiqués avant d\'envoyer votre message.';
        status.classList.add('is-visible', 'form-status--error');
      }

      const firstError = form.querySelector('.has-error input, .has-error textarea');
      if(firstError) firstError.focus();

      return;
    }

    /* -------------------------------------------------------
       Envoi réel vers Web3Forms
       ------------------------------------------------------- */

    if(status){
      status.textContent = 'Envoi de votre message…';
      status.classList.add('is-visible');
    }

    const submitButton = form.querySelector('button[type="submit"]');

    if(submitButton){
      submitButton.disabled = true;
      submitButton.setAttribute('aria-busy', 'true');
    }

    try {
      const formData = new FormData(form);

      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if(data.success){
        if(status){
          status.textContent = 'Merci pour votre message ! Je vous répondrai dans les meilleurs délais.';
          status.classList.remove('form-status--error');
          status.classList.add('is-visible', 'form-status--success');
        }

        form.reset();

        form.querySelectorAll('.has-error').forEach(wrapper => {
          wrapper.classList.remove('has-error');
        });

        form.querySelectorAll('.field__error').forEach(error => {
          error.textContent = '';
        });

      } else {
        throw new Error(data.message || 'Une erreur est survenue.');
      }

    } catch(error) {
      console.error('Web3Forms:', error);

      if(status){
        status.textContent = 'Une erreur est survenue lors de l\'envoi. Veuillez réessayer ou nous contacter directement par email.';
        status.classList.remove('form-status--success');
        status.classList.add('is-visible', 'form-status--error');
      }

    } finally {
      if(submitButton){
        submitButton.disabled = false;
        submitButton.removeAttribute('aria-busy');
      }
    }
  });
}