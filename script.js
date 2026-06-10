const progressBar = document.querySelector(".progress span");
const glow = document.querySelector(".cursor-glow");
const revealEls = document.querySelectorAll(".reveal");
const navLinks = document.querySelectorAll(".nav a");
const sections = [...document.querySelectorAll("section[id]")];
const parallaxEls = document.querySelectorAll("[data-parallax]");
const filters = document.querySelectorAll(".filter");
const cards = document.querySelectorAll(".product-card");
const productShowcase = document.querySelector(".product-showcase");
const showcaseImage = document.querySelector("#showcaseImage");
const showcaseTitle = document.querySelector("#showcaseTitle");
const showcaseCategory = document.querySelector("#showcaseCategory");
const showcaseDesc = document.querySelector("#showcaseDesc");
const showcaseMeta = document.querySelector("#showcaseMeta");
const showcaseButton = document.querySelector(".showcase-image");
const lightbox = document.querySelector(".product-lightbox");
const lightboxImage = document.querySelector(".product-lightbox img");
const lightboxClose = document.querySelector(".product-lightbox button");
const lightboxCaption = document.createElement("div");

let activeCard = document.querySelector(".product-card.is-selected") || cards[0];
let lastFocusedElement = null;
let scrollTicking = false;
let showcaseTimer;

lightboxCaption.className = "lightbox-caption";
lightboxCaption.setAttribute("aria-live", "polite");
lightbox?.appendChild(lightboxCaption);

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
);

revealEls.forEach((el, index) => {
  el.style.setProperty("--reveal-delay", `${Math.min((index % 6) * 48, 240)}ms`);
  revealObserver.observe(el);
});

function updateScrollState() {
  const scrollTop = window.scrollY;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const progress = max > 0 ? (scrollTop / max) * 100 : 0;

  if (progressBar) {
    progressBar.style.width = `${progress}%`;
  }

  parallaxEls.forEach((el) => {
    const speed = Number(el.dataset.parallax || 0);
    el.style.transform = `translate3d(0, ${scrollTop * speed}px, 0)`;
  });

  let current = "";
  sections.forEach((section) => {
    const top = section.offsetTop - 180;
    if (scrollTop >= top) current = section.id;
  });

  navLinks.forEach((link) => {
    link.classList.toggle("active", link.getAttribute("href") === `#${current}`);
  });

  scrollTicking = false;
}

function requestScrollUpdate() {
  if (scrollTicking) return;
  scrollTicking = true;
  window.requestAnimationFrame(updateScrollState);
}

window.addEventListener("scroll", requestScrollUpdate, { passive: true });
window.addEventListener("resize", requestScrollUpdate);
updateScrollState();

window.addEventListener(
  "pointermove",
  (event) => {
    if (!glow) return;
    glow.style.opacity = "1";
    glow.style.left = `${event.clientX}px`;
    glow.style.top = `${event.clientY}px`;
  },
  { passive: true }
);

window.addEventListener("pointerleave", () => {
  if (glow) glow.style.opacity = "0";
});

function pulseShowcase() {
  if (!productShowcase) return;

  clearTimeout(showcaseTimer);
  productShowcase.classList.remove("is-switching");
  void productShowcase.offsetWidth;
  productShowcase.classList.add("is-switching");

  showcaseTimer = window.setTimeout(() => {
    productShowcase.classList.remove("is-switching");
  }, 540);
}

function updateShowcase(card, options = {}) {
  if (!card || !showcaseImage || !showcaseTitle || !showcaseCategory || !showcaseDesc || !showcaseMeta) return;

  const image = card.dataset.image;
  const title = card.dataset.title || "";
  const label = card.dataset.label || "";
  const desc = card.dataset.desc || "";
  const meta = (card.dataset.meta || "").split("|").filter(Boolean);

  cards.forEach((item) => item.classList.remove("is-selected"));
  card.classList.add("is-selected");
  activeCard = card;

  showcaseImage.src = image;
  showcaseImage.alt = title ? `${title} product preview` : "Product preview";
  showcaseTitle.textContent = title;
  showcaseCategory.textContent = label;
  showcaseDesc.textContent = desc;
  showcaseMeta.innerHTML = meta.map((item) => `<span>${item}</span>`).join("");

  if (options.animate !== false) pulseShowcase();
}

function animateVisibleCards(filter) {
  let firstVisibleCard = null;
  let visibleIndex = 0;

  cards.forEach((card) => {
    const visible = filter === "all" || card.dataset.category === filter;
    card.classList.toggle("is-hidden", !visible);
    card.classList.remove("is-entering");

    if (!visible) {
      card.style.animationDelay = "";
      return;
    }

    firstVisibleCard ||= card;
    card.style.animationDelay = `${Math.min(visibleIndex * 34, 220)}ms`;
    void card.offsetWidth;
    card.classList.add("is-entering");
    visibleIndex += 1;
  });

  return firstVisibleCard;
}

filters.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;
    filters.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");

    const firstVisibleCard = animateVisibleCards(filter);
    if (firstVisibleCard && !firstVisibleCard.classList.contains("is-selected")) {
      updateShowcase(firstVisibleCard);
    }
  });
});

function openLightbox(card = activeCard) {
  if (!lightbox || !lightboxImage) return;

  const image = card?.dataset.image || showcaseImage?.src;
  const title = card?.dataset.title || showcaseTitle?.textContent || "";

  if (image) lightboxImage.src = image;
  lightboxImage.alt = title ? `${title} product large preview` : "Product large preview";
  lightboxCaption.textContent = title;

  lastFocusedElement = document.activeElement;
  lightbox.classList.add("is-open");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.classList.add("lightbox-lock");
  lightboxClose?.focus({ preventScroll: true });
}

function closeLightbox() {
  if (!lightbox) return;

  lightbox.classList.remove("is-open");
  lightbox.setAttribute("aria-hidden", "true");
  document.body.classList.remove("lightbox-lock");

  if (lastFocusedElement instanceof HTMLElement) {
    lastFocusedElement.focus({ preventScroll: true });
  }
}

cards.forEach((card) => {
  card.setAttribute("tabindex", "0");

  card.addEventListener("click", (event) => {
    updateShowcase(card);

    if (event.target.closest(".product-visual")) {
      openLightbox(card);
    }
  });

  card.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    updateShowcase(card);
    openLightbox(card);
  });

  card.addEventListener("pointermove", (event) => {
    const rect = card.getBoundingClientRect();
    const mx = ((event.clientX - rect.left) / rect.width) * 100;
    const my = ((event.clientY - rect.top) / rect.height) * 100;
    const rotateX = (my / 100 - 0.5) * -7;
    const rotateY = (mx / 100 - 0.5) * 7;

    card.style.setProperty("--mx", `${mx}%`);
    card.style.setProperty("--my", `${my}%`);
    card.style.transform = `translateY(-8px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  });

  card.addEventListener("pointerleave", () => {
    card.style.transform = "";
  });
});

showcaseButton?.addEventListener("click", () => openLightbox(activeCard));
lightboxClose?.addEventListener("click", closeLightbox);
lightbox?.addEventListener("click", (event) => {
  if (event.target === lightbox) closeLightbox();
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeLightbox();
});

if (activeCard) {
  updateShowcase(activeCard, { animate: false });
}
