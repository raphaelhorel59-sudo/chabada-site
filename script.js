// CHABADA — interactions

// Progressive enhancement: mark JS available so reveal styles apply (no-JS keeps content visible)
document.documentElement.classList.add('js');

// Mobile nav toggle
const nav = document.querySelector('.nav');
const toggle = document.querySelector('.nav-toggle');
if (toggle) toggle.addEventListener('click', () => nav.classList.toggle('open'));

// Scroll reveal
const revealAll = () => document.querySelectorAll('.reveal').forEach((el) => el.classList.add('in'));
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
  // Safety net: never leave content permanently hidden if the observer misses something.
  window.addEventListener('load', () => setTimeout(revealAll, 2500));
} else {
  revealAll();
}

// La Carte — tab filtering (skipped when Sanity loader handles tabs)
const tabs = document.querySelectorAll('.tab');
const groups = document.querySelectorAll('[data-cat]');
const sanityMenus = document.querySelector('[data-dish-list]');
if (tabs.length && !sanityMenus) {
  tabs.forEach((t) => t.addEventListener('click', () => {
    tabs.forEach((x) => x.classList.remove('active'));
    t.classList.add('active');
    const cat = t.dataset.tab;
    groups.forEach((g) => { g.style.display = (cat === 'all' || g.dataset.cat === cat) ? '' : 'none'; });
  }));
}

// Simple search filter on menu
const search = document.querySelector('#menu-search');
if (search) {
  search.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase().trim();
    document.querySelectorAll('.menu-item').forEach((it) => {
      it.style.display = it.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  });
}

// Forms — demo submit
document.querySelectorAll('form[data-demo]').forEach((f) => {
  f.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = f.querySelector('button[type=submit]');
    const label = btn.textContent;
    btn.textContent = 'Merci ✓';
    btn.disabled = true;
    setTimeout(() => { btn.textContent = label; btn.disabled = false; f.reset(); }, 2600);
  });
});
