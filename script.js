const header = document.querySelector(".header");
const navToggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".nav");
const form = document.querySelector(".contact__form");
const progressBar = document.querySelector(".scroll-progress__bar");
const heroVisual = document.querySelector(".hero__visual--parallax");
const backToTop = document.querySelector(".back-to-top");
const navLinks = nav ? [...nav.querySelectorAll('a[href^="#"]')] : [];
const sections = [...document.querySelectorAll("main section[id]")];

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const WELCOME_KEY = "hmaruk-welcome-dismissed";
const CLINIC_EMAIL = "neurolex@inbox.ru";

/* Page enter */
requestAnimationFrame(() => {
  document.body.classList.add("is-loaded");
});

/* Scroll progress + header + back to top */
function updateScrollProgress() {
  if (!progressBar) return;
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  progressBar.style.width = `${progress}%`;
}

function updateBackToTop() {
  if (!backToTop) return;
  const show = window.scrollY > 420;
  backToTop.hidden = !show;
  backToTop.classList.toggle("is-visible", show);
}

window.addEventListener("scroll", () => {
  if (header) header.classList.toggle("is-scrolled", window.scrollY > 20);
  updateScrollProgress();
  updateBackToTop();

  if (!prefersReducedMotion && heroVisual) {
    const offset = Math.min(window.scrollY * 0.12, 80);
    heroVisual.style.transform = `translateY(${offset}px)`;
  }
});

updateScrollProgress();
updateBackToTop();

if (backToTop) {
  backToTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
  });
}

/* Mobile nav */
if (navToggle && nav) {
  navToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });
}

/* Плавная прокрутка с учётом шапки */
function scrollToSection(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const headerH = header ? header.offsetHeight : 80;
  const top = el.getBoundingClientRect().top + window.scrollY - headerH - 8;
  window.scrollTo({ top, behavior: prefersReducedMotion ? "auto" : "smooth" });
}

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  const href = link.getAttribute("href");
  if (!href || href === "#" || href === "#top") return;
  const id = href.slice(1);
  if (!document.getElementById(id)) return;

  link.addEventListener("click", (e) => {
    e.preventDefault();
    scrollToSection(id);
    history.pushState(null, "", href);
  });
});

document.querySelectorAll('a[href="#top"]').forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
  });
});

/* Приветственное окно */
(function initWelcome() {
  const welcome = document.getElementById("welcome");
  const skipCheckbox = document.getElementById("welcome-skip");
  if (!welcome) return;

  function closeWelcome() {
    welcome.classList.remove("welcome--open");
    welcome.hidden = true;
    document.body.classList.remove("welcome-open");
    if (skipCheckbox?.checked) {
      try {
        localStorage.setItem(WELCOME_KEY, "1");
      } catch {
        /* ignore */
      }
    }
  }

  function openWelcome() {
    welcome.hidden = false;
    welcome.classList.add("welcome--open");
    document.body.classList.add("welcome-open");
    const firstBtn = welcome.querySelector("[data-welcome-close]");
    firstBtn?.focus();
  }

  welcome.querySelectorAll("[data-welcome-close]").forEach((el) => {
    el.addEventListener("click", closeWelcome);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && welcome.classList.contains("welcome--open")) {
      closeWelcome();
    }
  });

  let dismissed = false;
  try {
    dismissed = localStorage.getItem(WELCOME_KEY) === "1";
  } catch {
    dismissed = false;
  }

  if (!dismissed) {
    setTimeout(openWelcome, prefersReducedMotion ? 0 : 400);
  }
})();

/* Форма заявки */
function showFormStatus(message, type) {
  const status = form?.querySelector(".form__status");
  if (!status) return;
  status.hidden = false;
  status.textContent = message;
  status.className = `form__status form__status--${type}`;
}

function normalizePhone(value) {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 11 && (digits.startsWith("7") || digits.startsWith("8"))) {
    return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`;
  }
  return value.trim();
}

function isValidPhone(value) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 11;
}

if (form) {
  const phoneInput = form.querySelector('input[name="contact"]');

  phoneInput?.addEventListener("blur", () => {
    if (phoneInput.value.trim()) {
      phoneInput.value = normalizePhone(phoneInput.value);
    }
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const nameInput = form.querySelector('input[name="name"]');
    const messageInput = form.querySelector('textarea[name="message"]');

    [nameInput, phoneInput, messageInput].forEach((el) => el?.classList.remove("is-invalid"));

    const name = nameInput?.value.trim() || "";
    const phone = phoneInput?.value.trim() || "";
    const message = messageInput?.value.trim() || "";

    if (!name) {
      nameInput?.classList.add("is-invalid");
      showFormStatus("Укажите, пожалуйста, ваше имя.", "err");
      nameInput?.focus();
      return;
    }

    if (!isValidPhone(phone)) {
      phoneInput?.classList.add("is-invalid");
      showFormStatus("Введите корректный номер телефона (от 10 цифр).", "err");
      phoneInput?.focus();
      return;
    }

    const subject = encodeURIComponent(`Заявка с сайта — ${name}`);
    const body = encodeURIComponent(
      `Имя: ${name}\nТелефон: ${normalizePhone(phone)}\n\nЗапрос:\n${message || "—"}`
    );
    const mailto = `mailto:${CLINIC_EMAIL}?subject=${subject}&body=${body}`;

    const originalText = btn.textContent;
    btn.textContent = "Открываем почту…";
    btn.disabled = true;

    window.location.href = mailto;

    showFormStatus(
      "Если почтовый клиент не открылся — позвоните в клинику: 8 (863) 221-41-08.",
      "ok"
    );
    form.reset();

    setTimeout(() => {
      btn.textContent = originalText;
      btn.disabled = false;
    }, 4000);
  });
}

/* Scroll reveal */
const revealEls = document.querySelectorAll(".reveal");

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { rootMargin: "0px 0px -6% 0px", threshold: 0.1 }
);

revealEls.forEach((el) => revealObserver.observe(el));

/* Animated counters */
function animateCounter(el, target, duration = 1400) {
  const start = performance.now();
  const from = 0;

  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - (1 - progress) ** 3;
    el.textContent = Math.round(from + (target - from) * eased);
    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      el.classList.add("is-counted");
    }
  }

  requestAnimationFrame(tick);
}

const counterObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = Number(el.dataset.count);
      if (!Number.isNaN(target)) animateCounter(el, target);
      counterObserver.unobserve(el);
    });
  },
  { threshold: 0.5 }
);

document.querySelectorAll("[data-count]").forEach((el) => counterObserver.observe(el));

/* Active nav section */
if (navLinks.length && sections.length) {
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.getAttribute("id");
        navLinks.forEach((link) => {
          link.classList.toggle("is-active", link.getAttribute("href") === `#${id}`);
        });
      });
    },
    { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
  );

  sections.forEach((section) => sectionObserver.observe(section));
}

/* Лёгкий наклон карточек услуг при наведении */
if (!prefersReducedMotion) {
  document.querySelectorAll(".card.reveal").forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.setProperty("--tilt-x", `${y * -5}deg`);
      card.style.setProperty("--tilt-y", `${x * 5}deg`);
    });

    card.addEventListener("mouseleave", () => {
      card.style.removeProperty("--tilt-x");
      card.style.removeProperty("--tilt-y");
    });
  });
}

/* Лайтбокс для документов */
(function initLightbox() {
  const lightbox = document.getElementById("lightbox");
  if (!lightbox) return;

  const img = lightbox.querySelector(".lightbox__img");
  const closeBtn = lightbox.querySelector(".lightbox__close");

  function openLightbox(src, alt) {
    img.src = src;
    img.alt = alt || "";
    lightbox.hidden = false;
    lightbox.classList.add("lightbox--open");
    document.body.classList.add("lightbox-open");
    closeBtn?.focus();
  }

  function closeLightbox() {
    lightbox.classList.remove("lightbox--open");
    lightbox.hidden = true;
    document.body.classList.remove("lightbox-open");
    img.src = "";
  }

  document.querySelectorAll(".docs__item a").forEach((link) => {
    link.addEventListener("click", (e) => {
      const thumb = link.querySelector("img");
      if (!thumb) return;
      e.preventDefault();
      openLightbox(thumb.src, thumb.alt);
    });
  });

  closeBtn?.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && lightbox.classList.contains("lightbox--open")) {
      closeLightbox();
    }
  });
})();

/* Пульсация метки в блоке карты после появления */
const mapBlock = document.querySelector(".contact__map");
if (mapBlock && !prefersReducedMotion) {
  const mapObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("map--entered");
          mapObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );
  mapObserver.observe(mapBlock);
}

/* Яндекс.Карта — организация «Нейролекс» */
(function initNeurolexYandexMap() {
  const mapEl = document.getElementById("neurolex-map");
  if (!mapEl) return;

  const orgId = mapEl.dataset.orgId || "1320854907";
  const neurolexCoords = [47.22736, 39.73111];

  function embedIframeFallback() {
    const [lat, lng] = neurolexCoords;
    mapEl.innerHTML = `<iframe class="map__frame" title="МПЦ «Нейролекс» на карте" src="https://yandex.ru/map-widget/v1/?oid=${orgId}&ll=${lng}%2C${lat}&z=19&lang=ru_RU" width="100%" height="420" loading="lazy" allowfullscreen referrerpolicy="no-referrer-when-downgrade"></iframe>`;
  }

  function buildMap() {
    if (typeof ymaps === "undefined") {
      embedIframeFallback();
      return;
    }

    ymaps.ready(() => {
      const map = new ymaps.Map(
        mapEl,
        {
          center: neurolexCoords,
          zoom: 19,
          controls: ["zoomControl", "fullscreenControl"],
        },
        {
          suppressMapOpenBlock: true,
        }
      );

      ymaps.findOrganization(orgId).then(
        (org) => {
          map.geoObjects.add(org);
          const coords = org.geometry.getCoordinates();
          map.setCenter(coords, 19, { duration: 400 });
        },
        () => {
          map.geoObjects.add(
            new ymaps.Placemark(
              neurolexCoords,
              {
                iconCaption: "Нейролекс",
                hintContent: "МПЦ «Нейролекс»",
                balloonContent:
                  "Кировский пр-т, 48, 1 этаж<br><em>вход со стороны ул. Суворова</em>",
              },
              { preset: "islands#redMedicalIcon" }
            )
          );
          map.setCenter(neurolexCoords, 19);
        }
      );
    });
  }

  function loadYmaps() {
    if (window.ymaps) {
      buildMap();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://api-maps.yandex.ru/2.1/?lang=ru_RU";
    script.async = true;
    script.onload = buildMap;
    script.onerror = embedIframeFallback;
    document.head.appendChild(script);
  }

  const mapLazyObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        loadYmaps();
        mapLazyObserver.disconnect();
      });
    },
    { rootMargin: "120px" }
  );

  mapLazyObserver.observe(mapEl);
})();
