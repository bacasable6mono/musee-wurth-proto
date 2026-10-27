/* =========================================================
   Musée Würth — prototype 6mono
   Script commun aux trois pages. Chaque bloc vérifie que
   l'élément existe avant d'agir : une page sans carrousel
   ignore simplement la partie « carrousel ».
   ========================================================= */
(function () {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const NB = ' ';

  /* Message bref en bas de l'écran */
  const toast = msg => {
    const t = $('#toast'); if (!t) return;
    t.textContent = msg; t.classList.add('on');
    clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('on'), 3200);
  };
  window.wToast = toast;

  /* Visuels : si le fichier existe dans /assets, il remplace le gabarit hachuré */
  const loadImages = (root = document) => $$('[data-src]', root).forEach(el => {
    if (el.classList.contains('loaded')) return;
    const i = new Image();
    i.onload = () => { el.style.backgroundImage = 'url("' + el.dataset.src + '")'; el.classList.add('loaded'); };
    i.src = el.dataset.src;
  });
  loadImages();

  /* Date et heure de Paris, quel que soit le fuseau du visiteur */
  function parisNow() {
    const p = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', year: 'numeric', month: 'numeric', day: 'numeric', weekday: 'long', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date());
    const g = k => (p.find(x => x.type === k) || {}).value;
    const days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
    return { y: +g('year'), m: +g('month'), d: +g('day'), wd: days.indexOf(g('weekday')), h: +g('hour') + (+g('minute')) / 60 };
  }
  const now = parisNow();
  const todayUTC = Date.UTC(now.y, now.m - 1, now.d);
  const dayDiff = iso => { const [y, m, d] = iso.split('-').map(Number); return Math.round((Date.UTC(y, m - 1, d) - todayUTC) / 864e5); };
  window.wDayDiff = dayDiff;

  /* ---------- Carrousel de l'accueil ---------- */
  const slides = $$('.slide'), tabs = $$('.hero-tab');
  if (slides.length && tabs.length) {
    const DUR = 7000; let cur = 0, t0 = performance.now(), paused = reduce;
    const bar = i => tabs[i].querySelector('i');
    const go = n => {
      slides[cur].classList.remove('on'); tabs[cur].setAttribute('aria-selected', 'false'); bar(cur).style.width = '0';
      cur = (n + slides.length) % slides.length;
      slides[cur].classList.add('on'); tabs[cur].setAttribute('aria-selected', 'true'); t0 = performance.now();
    };
    const tick = t => {
      if (!paused) { const p = Math.min(1, (t - t0) / DUR); bar(cur).style.width = (p * 100) + '%'; if (p >= 1) go(cur + 1); }
      else t0 = t - (parseFloat(bar(cur).style.width || 0) / 100) * DUR;
      requestAnimationFrame(tick);
    };
    tabs.forEach((b, i) => b.addEventListener('click', () => go(i)));
    const pb = $('#heroPause');
    const setPause = v => {
      paused = v; pb.setAttribute('aria-label', v ? 'Reprendre le défilement' : 'Mettre en pause le défilement');
      pb.innerHTML = v ? '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5l12 7-12 7z"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/></svg>';
    };
    if (pb) { pb.addEventListener('click', () => setPause(!paused)); setPause(paused); }
    requestAnimationFrame(tick);
  }

  /* ---------- Statut d'ouverture du jour ---------- */
  const days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  const st = $('#todayStatus');
  if (st) {
    const nx = $('#todayNext'), d = now.wd, h = now.h, close = d === 0 ? 18 : 17;
    const lbl = $('#todayLabel'); if (lbl) lbl.textContent = "Aujourd'hui, " + (d >= 0 ? days[d] : '');
    if (d === 1) { st.textContent = 'Fermé le lundi'; st.classList.add('closed'); nx.textContent = 'Réouverture demain à 10' + NB + 'h'; }
    else if (h < 10) { st.textContent = 'Ouvre à 10' + NB + 'h'; st.classList.add('closed'); nx.textContent = "Jusqu'à " + close + NB + 'h'; }
    else if (h >= close) { st.textContent = 'Fermé pour aujourd’hui'; st.classList.add('closed'); nx.textContent = d === 0 ? 'Fermé demain lundi' : 'Réouverture demain à 10' + NB + 'h'; }
    else { st.textContent = 'Ouvert jusqu’à ' + close + NB + 'h'; nx.textContent = 'Fermé le lundi'; }
  }
  const row = $('#hoursBody tr[data-d="' + now.wd + '"]'); if (row) row.classList.add('is-today');

  /* ---------- Agenda filtrable de l'accueil ---------- */
  const agenda = $('#agenda');
  if (agenda) {
    const EV = [
      { date: '2026-10-28', cat: ['atelier', 'famille'], label: 'Atelier famille', title: 'Photos monstrueuses', txt: 'Ciseaux en main, les enfants détournent des portraits photographiques pour inventer des créatures.', price: '9 €', full: true, img: 'assets/ev-photos.jpg' },
      { date: '2026-10-31', cat: ['atelier'], label: 'Atelier collage · dès 14 ans', title: '« Curiosités botaniques », spécial Halloween', txt: 'Composer une illustration imaginaire par collage. Débutants bienvenus, matériel fourni.', price: '45 €', img: 'assets/ev-collage.jpg' },
      { date: '2026-10-31', cat: ['scene'], label: 'Soirée', title: 'Murder party Halloween', txt: 'Une soirée d’enquête dans les murs du musée.', price: '5 €', full: true, img: 'assets/ev-murder.jpg' },
      { date: '2026-11-15', cat: ['projection'], label: 'Projection documentaire', title: '« Moi, Georg Baselitz », de Heinz-Peter Schwerfel', txt: 'Portrait filmé du peintre et sculpteur allemand, figure majeure de l’art contemporain.', price: 'Gratuit', img: 'assets/ev-baselitz.jpg' },
      { date: '2026-11-20', cat: ['scene'], label: 'Concert · chanson', title: 'Jeanne Cherhal', txt: 'Autrice, compositrice et pianiste, en concert à l’auditorium.', price: '36 €', img: 'assets/show-cherhal.jpg', url: 'evenement-jeanne-cherhal.html' },
      { date: '2026-12-18', cat: ['scene'], label: 'Concert', title: 'Louis Cattelat', txt: '« Arecibo », entre poésie cosmique et autodérision.', price: '36 €', img: 'assets/show-cattelat.jpg' },
      { date: '2027-02-19', cat: ['scene'], label: 'Concert · chanson', title: 'Tété', txt: 'Le retour sur scène avec « Vertige du seum ».', price: '36 €', img: 'assets/show-tete.jpg' },
      { date: '2027-05-07', cat: ['scene'], label: 'Concert · chanson', title: 'Gauvain Sers', txt: 'Un quatrième album, entre Paris et la Creuse.', price: '36 €', img: 'assets/show-sers.jpg' },
      { date: '2027-05-28', cat: ['scene'], label: 'Spectacle', title: 'Jessé', txt: 'À l’auditorium du Musée Würth.', price: '36 €', full: true, img: 'assets/show-jesse.jpg' }
    ];
    const M = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    const MS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
    const W = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
    const fix = s => s.replace(/ €/g, NB + '€').replace(/« /g, '«' + NB).replace(/ »/g, NB + '»');
    const counts = { all: EV.length }; EV.forEach(e => e.cat.forEach(c => counts[c] = (counts[c] || 0) + 1));
    $$('[data-count]').forEach(s => s.textContent = counts[s.dataset.count] || 0);
    const render = f => {
      const list = EV.filter(e => f === 'all' || e.cat.includes(f)); let html = '', lastM = '';
      if (!list.length) { agenda.innerHTML = '<p class="empty">Aucun événement dans cette catégorie pour le moment.</p>'; return; }
      list.forEach(e => {
        const [y, m, dd] = e.date.split('-').map(Number), dt = new Date(Date.UTC(y, m - 1, dd)), key = y + '-' + m;
        const href = e.url || '#programmation';
        if (key !== lastM) {
          if (lastM) html += '</ul>';
          const n = list.filter(x => x.date.startsWith(e.date.slice(0, 7))).length;
          html += '<h3 class="month"><span>' + M[m - 1] + ' ' + y + '</span><span class="num">' + n + ' événement' + (n > 1 ? 's' : '') + '</span></h3><ul>'; lastM = key;
        }
        const side = e.full ? '<span class="price">' + fix(e.price) + '</span><span class="tag full">Complet</span>'
          : (e.price === 'Gratuit' ? '<span class="tag free">Gratuit</span><a class="btn btn--ghost btn-sm" href="' + href + '">Détails</a>'
            : '<span class="price">' + fix(e.price) + '</span><a class="btn btn--red btn-sm" href="' + href + '">Réserver</a>');
        const title = e.url ? '<a href="' + e.url + '">' + fix(e.title) + '</a>' : fix(e.title);
        html += '<li class="ev' + (e.full ? ' is-full' : '') + '"><time class="ev-date" datetime="' + e.date + '"><span class="d">' + dd + '</span><span class="mw"><b>' + MS[m - 1] + '</b><span>' + W[dt.getUTCDay()] + '</span></span></time>'
          + '<div class="ph" data-src="' + e.img + '"></div>'
          + '<div class="ev-body"><p class="ev-cat">' + e.label + '</p><h3>' + title + '</h3><p class="ev-txt">' + fix(e.txt) + '</p></div><div class="ev-side">' + side + '</div></li>';
      });
      agenda.innerHTML = html + '</ul>'; loadImages(agenda);
    };
    $$('.chip').forEach(c => c.addEventListener('click', () => { $$('.chip').forEach(x => x.setAttribute('aria-pressed', 'false')); c.setAttribute('aria-pressed', 'true'); render(c.dataset.f); }));
    render('all');
  }

  /* ---------- Rail horizontal (spectacles) ---------- */
  $$('[data-rail]').forEach(wrap => {
    const rail = $('.rail', wrap); if (!rail) return;
    const step = () => (rail.firstElementChild ? rail.firstElementChild.getBoundingClientRect().width + 20 : 300);
    const prev = $('[data-rail-prev]', wrap), next = $('[data-rail-next]', wrap);
    if (prev) prev.addEventListener('click', () => rail.scrollBy({ left: -step(), behavior: reduce ? 'auto' : 'smooth' }));
    if (next) next.addEventListener('click', () => rail.scrollBy({ left: step(), behavior: reduce ? 'auto' : 'smooth' }));
  });

  /* ---------- Menu mobile, recherche, langues ---------- */
  const drawer = $('#drawer'), om = $('#openMenu');
  const closeD = () => { if (!drawer) return; drawer.hidden = true; om && om.setAttribute('aria-expanded', 'false'); };
  if (drawer && om) {
    om.addEventListener('click', () => { drawer.hidden = false; om.setAttribute('aria-expanded', 'true'); $('#closeMenu').focus(); });
    $('#closeMenu').addEventListener('click', closeD); $$('#drawer a').forEach(a => a.addEventListener('click', closeD));
  }
  const se = $('#search');
  const closeS = () => { if (!se) return; se.hidden = true; $('#openSearch').focus(); };
  if (se) {
    $('#openSearch').addEventListener('click', () => { se.hidden = false; $('#q').focus(); });
    $('#closeSearch').addEventListener('click', closeS);
    $$('#search .sugg a').forEach(a => a.addEventListener('click', () => { se.hidden = true; }));
    $('#searchForm').addEventListener('submit', e => { e.preventDefault(); se.hidden = true; toast('Prototype : la recherche sera branchée sur WordPress.'); });
  }
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (se && !se.hidden) closeS(); if (drawer && !drawer.hidden) closeD();
    const lb = $('#lightbox'); if (lb && !lb.hidden) lb.hidden = true;
  });
  $$('.langs button[data-lang]').forEach(b => b.addEventListener('click', () => toast(b.dataset.lang + ' : prévue via WPML (FR, EN, DE).')));

  /* ---------- Newsletter ---------- */
  const nf = $('#newsForm');
  if (nf) nf.addEventListener('submit', e => {
    e.preventDefault(); const v = $('#email').value.trim(), msg = $('#newsMsg');
    msg.textContent = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? 'Merci, votre inscription est enregistrée (simulation du prototype).' : 'Saisissez une adresse électronique valide, par exemple prenom@exemple.fr.';
  });

  /* ---------- Fiche exposition : frise de durée ---------- */
  const run = $('[data-run]');
  if (run) {
    const start = run.dataset.start, end = run.dataset.end;
    const total = dayDiff(end) - dayDiff(start), done = -dayDiff(start), left = dayDiff(end);
    const pct = Math.max(0, Math.min(100, done / total * 100));
    $('.run-fill', run).style.width = pct + '%';
    $('.run-now', run).style.left = pct + '%';
    const lbl = $('.run-left', run);
    if (left < 0) lbl.textContent = 'Exposition terminée';
    else if (done < 0) lbl.textContent = 'Ouverture dans ' + (-done) + NB + 'jours';
    else lbl.textContent = left === 0 ? 'Dernier jour' : 'Encore ' + left + NB + 'jours';
  }

  /* ---------- Fiche exposition : prochaine visite guidée (dimanche 14 h 30) ---------- */
  const nv = $('#nextVisit');
  if (nv) {
    const M = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    let add = (7 - now.wd) % 7; if (add === 0 && now.h >= 14.5) add = 7;
    const d = new Date(todayUTC + add * 864e5);
    const endIso = nv.dataset.end; const last = dayDiff(endIso);
    if (add > last) nv.textContent = 'Plus de visite programmée avant la fin de l’exposition';
    else nv.textContent = (add === 0 ? 'Aujourd’hui, ' : 'Dimanche ') + (d.getUTCDate() === 1 ? '1er' : d.getUTCDate()) + ' ' + M[d.getUTCMonth()] + ' à 14' + NB + 'h' + NB + '30';
  }

  /* ---------- Fiche exposition : visionneuse d'images ---------- */
  const lb = $('#lightbox');
  if (lb) {
    const img = $('img', lb), cap = $('figcaption', lb);
    $$('[data-zoom]').forEach(f => f.addEventListener('click', () => {
      const ph = $('.ph', f);
      if (!ph.classList.contains('loaded')) { toast('Visuel à fournir : ' + ph.dataset.src); return; }
      img.src = ph.dataset.src; img.alt = f.dataset.alt || ''; cap.textContent = f.dataset.caption || '';
      lb.hidden = false; $('.lb-close', lb).focus();
    }));
    lb.addEventListener('click', e => { if (e.target === lb || e.target.closest('.lb-close')) lb.hidden = true; });
  }

  /* ---------- Fiche événement : compte à rebours et réservation ---------- */
  const cd = $('[data-countdown]');
  if (cd) {
    const n = dayDiff(cd.dataset.countdown);
    cd.textContent = n < 0 ? 'Concert passé' : n === 0 ? 'Ce soir' : n === 1 ? 'Demain' : 'Dans ' + n + NB + 'jours';
    if (n < 0) $$('[data-book]').forEach(b => b.setAttribute('aria-disabled', 'true'));
  }
  const book = $('#book');
  if (book) {
    const price = +book.dataset.price, out = $('#qty'), tot = $('#total'), cta = $('#bookCta');
    let q = 2;
    const fmt = v => v.toLocaleString('fr-FR') + NB + '€';
    const upd = () => {
      out.value = q; out.textContent = q;
      tot.textContent = fmt(q * price);
      $('#bookCtaLabel').textContent = 'Réserver ' + q + ' place' + (q > 1 ? 's' : '') + ' · ' + fmt(q * price);
      $('#qMinus').disabled = q <= 1; $('#qPlus').disabled = q >= 8;
    };
    $('#qMinus').addEventListener('click', () => { if (q > 1) { q--; upd(); } });
    $('#qPlus').addEventListener('click', () => { if (q < 8) { q++; upd(); } });
    upd();
  }

  /* ---------- Barre de réservation mobile : masquée quand le module est visible ---------- */
  const mb = $('.mbook');
  if (mb && book && 'IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => mb.classList.toggle('away', e.isIntersecting), { threshold: .2 }).observe(book);
  }

  /* ---------- Notes de conception ---------- */
  const nt = $('#notesToggle');
  if (nt) nt.addEventListener('click', () => {
    const on = !document.body.classList.contains('notes');
    document.body.classList.toggle('notes', on); nt.setAttribute('aria-pressed', on);
    nt.querySelector('span').textContent = on ? 'Masquer les notes' : 'Notes de conception';
  });
})();
