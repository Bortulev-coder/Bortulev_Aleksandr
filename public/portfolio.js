(() => {
  'use strict';
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const menu = $('#mobile-nav');
  const menuToggle = $('.menu-toggle');
  const dialog = $('#registration-dialog');
  let achievementFilter = 'all';
  let opener = null;

  function closeMenu() {
    menu.hidden = true;
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Открыть меню');
  }
  menuToggle.addEventListener('click', () => {
    const opening = menu.hidden;
    menu.hidden = !opening;
    menuToggle.setAttribute('aria-expanded', String(opening));
    menuToggle.setAttribute('aria-label', opening ? 'Закрыть меню' : 'Открыть меню');
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

  let observer;
  if ('IntersectionObserver' in window && !reducedMotion) {
    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.remove('awaiting');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.06 });
  }
  function revealPage() {
    const active = $('[data-page="' + document.documentElement.dataset.view + '"]');
    $$('.reveal', active).forEach(el => {
      if (observer && el.getBoundingClientRect().top > innerHeight) {
        el.classList.add('awaiting');
        observer.observe(el);
      } else el.classList.remove('awaiting');
    });
  }
  function updateProgress() {
    const range = document.documentElement.scrollHeight - innerHeight;
    $('.scroll-progress').style.width = (range > 0 ? Math.min(100, scrollY / range * 100) : 0) + '%';
  }
  function navigate(url, push = true, initial = false) {
    const target = new URL(url, location.href);
    const view = target.pathname.includes('projects') ? 'projects' : target.pathname.includes('events') ? 'events' : target.pathname.includes('channels') ? 'channels' : 'home';
    if (push) history.pushState({}, '', target.pathname + target.hash);
    document.documentElement.dataset.view = view;
    const nav = view === 'home' && target.hash === '#about' ? 'about' : view;
    $$('[data-nav]').forEach(link => {
      const active = link.dataset.nav === nav;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
    });
    document.title = (view === 'projects' ? 'Мои проекты' : view === 'events' ? 'Мероприятия' : view === 'channels' ? 'Мои каналы' : 'Александр Бортулев') + ' — личное портфолио';
    closeMenu();
    if (!initial) {
      if (target.hash) {
        const section = document.getElementById(decodeURIComponent(target.hash.slice(1)));
        if (section) section.scrollIntoView({ behavior: reducedMotion ? 'instant' : 'smooth', block: 'start' });
      } else window.scrollTo({ top: 0, behavior: 'instant' });
      $('#main').focus({ preventScroll: true });
    }
    revealPage();
    updateProgress();
  }
  document.addEventListener('click', e => {
    const link = e.target.closest('a[data-nav]');
    if (link && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey && e.button === 0) {
      e.preventDefault();
      navigate(link.href);
    }
    const metric = e.target.closest('.metric-card');
    if (metric) {
      achievementFilter = 'all';
      $('#achievement-search').value = '';
      filterAchievements();
      $$('.achievement-card').forEach(card => card.classList.remove('awaiting'));
    }
  });
  window.addEventListener('popstate', () => navigate(location.href, false));
  window.addEventListener('scroll', updateProgress, { passive: true });
  window.addEventListener('resize', updateProgress, { passive: true });
  const normalize = value => value.toLocaleLowerCase('ru').replaceAll('ё', 'е').trim();
  function filterAchievements() {
    const query = normalize($('#achievement-search').value);
    let matches = 0;
    let sections = 0;
    $$('.filter').forEach(button => {
      const active = button.dataset.filter === achievementFilter;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    $$('.achievement-card').forEach(card => {
      const categoryMatches = achievementFilter === 'all' || card.dataset.category === achievementFilter;
      const titleMatches = normalize($('h3', card).textContent).includes(query);
      let cardMatches = 0;
      $$('li', card).forEach(li => {
        const matchesQuery = !query || titleMatches || normalize(li.textContent).includes(query);
        li.hidden = !matchesQuery;
        if (matchesQuery && categoryMatches) cardMatches++;
      });
      card.hidden = !categoryMatches || cardMatches === 0;
      if (!card.hidden) { sections++; matches += cardMatches; card.classList.remove('awaiting'); }
    });
    $('#achievement-empty').hidden = sections > 0;
    $('#achievement-result').hidden = !query && achievementFilter === 'all';
    $('#achievement-result').textContent = 'Найдено пунктов: ' + matches + ' · разделов: ' + sections;
    updateProgress();
  }
  $$('.filter').forEach(button => button.addEventListener('click', () => { achievementFilter = button.dataset.filter; filterAchievements(); }));
  $('#achievement-search').addEventListener('input', filterAchievements);
  $('#reset-achievements').addEventListener('click', () => { achievementFilter = 'all'; $('#achievement-search').value = ''; filterAchievements(); });
  function filterProjects() {
    const query = normalize($('#project-search').value);
    let count = 0;
    $$('.project-card').forEach(card => {
      card.hidden = !normalize(card.textContent).includes(query);
      if (!card.hidden) { count++; card.classList.remove('awaiting'); }
    });
    $('#projects-empty').hidden = count > 0;
    $('#project-result').hidden = !query;
    $('#project-result').textContent = 'Найдено проектов: ' + count;
    updateProgress();
  }
  $('#project-search').addEventListener('input', filterProjects);
  $('#reset-projects').addEventListener('click', () => { $('#project-search').value = ''; filterProjects(); });

  $$('[data-open-registration]').forEach(button => button.addEventListener('click', () => {
    opener = button;
    $('#form-content').hidden = false;
    $('#form-success').hidden = true;
    $('#form-error').hidden = true;
    dialog.showModal();
    document.body.classList.add('modal-open');
    $('#full-name').focus();
  }));
  function closeDialog() { dialog.close(); }
  $('.dialog-close').addEventListener('click', closeDialog);
  $('#close-success').addEventListener('click', closeDialog);
  dialog.addEventListener('click', e => {
    const rect = dialog.getBoundingClientRect();
    if (e.target === dialog && (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom)) closeDialog();
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('modal-open');
    if (opener) opener.focus({ preventScroll: true });
  });
  $('#registration-form').addEventListener('submit', async e => {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.reportValidity()) return;
    const button = $('.submit-button');
    if (button.disabled) return;
    const oldHtml = button.innerHTML;
    const values = new FormData(form);
    button.disabled = true;
    button.textContent = 'Сохраняем заявку…';
    $('#form-error').hidden = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch('/api/registrations', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal,
        body: JSON.stringify({ eventId: 'olympiads-to-itmo', name: values.get('name'), email: values.get('email'), question: values.get('question'), consent: values.get('consent') === 'on', website: values.get('website') }),
      });
      let result;
      try { result = await response.json(); } catch { throw new Error('Не удалось получить подтверждение. Попробуйте ещё раз.'); }
      if (!response.ok || !result.ok) throw new Error(result.error || 'Не удалось сохранить заявку. Попробуйте ещё раз.');
      $('#form-content').hidden = true;
      $('#form-success').hidden = false;
      form.reset();
      $('#close-success').focus();
    } catch (error) {
      $('#form-error').textContent = error.name === 'AbortError' ? 'Сервер не ответил вовремя. Проверьте соединение и повторите отправку.' : error.message === 'Failed to fetch' ? 'Не удалось связаться с сервером. Проверьте соединение и повторите отправку.' : error.message;
      $('#form-error').hidden = false;
    } finally {
      clearTimeout(timeout);
      button.disabled = false;
      button.innerHTML = oldHtml;
    }
  });
  navigate(location.href, false, true);
})();
