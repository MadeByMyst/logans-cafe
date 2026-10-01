/* Logan'sCafe script.js
   Plain JavaScript, no libraries. The page works without it; this adds the
   mobile menu, a few gentle scroll effects and the opening-hours status. */

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Header: solid once scrolled, hides while scrolling down ---------- */

const header = document.querySelector(".site-header");
const siteNav = document.getElementById("site-nav");
let lastScrollY = window.scrollY;

function updateHeader() {
  const y = window.scrollY;
  const scrollingDown = y > lastScrollY;
  const menuIsOpen = siteNav.classList.contains("is-open");

  header.classList.toggle("is-scrolled", y > 8);
  header.classList.toggle("is-hidden", scrollingDown && y > 200 && !menuIsOpen);
  lastScrollY = y;
}

/* ---------- Hero photo drifts a little slower than the page ---------- */

const heroBg = document.querySelector(".hero-bg");
let parallaxTarget = 0;
let parallaxNow = 0;
let parallaxRunning = false;

function parallaxLoop() {
  parallaxNow += (parallaxTarget - parallaxNow) * 0.1; // ease towards the target
  heroBg.style.setProperty("--parallax", parallaxNow.toFixed(2));

  if (Math.abs(parallaxTarget - parallaxNow) > 0.1) {
    requestAnimationFrame(parallaxLoop);
  } else {
    parallaxRunning = false;
  }
}

function updateParallax() {
  if (!heroBg || reduceMotion) return;
  parallaxTarget = Math.min(window.scrollY, window.innerHeight) * 0.3;
  if (!parallaxRunning) {
    parallaxRunning = true;
    requestAnimationFrame(parallaxLoop);
  }
}

// Run the scroll work at most once per frame
let ticking = false;

window.addEventListener(
  "scroll",
  () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      updateHeader();
      updateParallax();
      ticking = false;
    });
  },
  { passive: true }
);

updateHeader();

/* ---------- Mobile menu ---------- */

const menuToggle = document.querySelector(".menu-toggle");

function setMenu(open) {
  if (open) header.classList.remove("is-hidden"); // keep the header in view while the menu is open
  header.classList.toggle("menu-is-open", open);
  menuToggle.setAttribute("aria-expanded", String(open));
  siteNav.classList.toggle("is-open", open);
  document.body.classList.toggle("menu-open", open);
}

menuToggle.addEventListener("click", () => {
  setMenu(menuToggle.getAttribute("aria-expanded") !== "true");
});

// Close the menu after picking a link
siteNav.addEventListener("click", (event) => {
  if (event.target.closest("a")) setMenu(false);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && siteNav.classList.contains("is-open")) {
    setMenu(false);
    menuToggle.focus();
  }
});

// Close it if the screen grows past the mobile layout
window.matchMedia("(min-width: 861px)").addEventListener("change", (event) => {
  if (event.matches) setMenu(false);
});

/* ---------- Fade sections in as they scroll into view ---------- */

const revealItems = document.querySelectorAll(".reveal, .stagger");

if (reduceMotion || !("IntersectionObserver" in window)) {
  revealItems.forEach((item) => item.classList.add("is-visible"));
} else {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
  );

  revealItems.forEach((item) => revealObserver.observe(item));
}

/* ---------- Opening hours: open or closed right now, and today's row ---------- */

// Opening and closing hours (24h clock) for each day, Sunday first
const openingHours = [
  [9, 19], // Sunday
  [7, 21], // Monday
  [7, 21],
  [7, 21],
  [7, 21],
  [7, 21], // Friday
  [8, 21], // Saturday
];

const formatHour = (hour) => {
  if (hour === 12) return "12pm";
  return hour < 12 ? `${hour}am` : `${hour - 12}pm`;
};

function openStatus(now = new Date()) {
  const day = now.getDay();
  const time = now.getHours() + now.getMinutes() / 60;
  const [opens, closes] = openingHours[day];

  if (time >= opens && time < closes) {
    return { open: true, text: `Open now · until ${formatHour(closes)}` };
  }
  if (time < opens) {
    return { open: false, text: `Closed now · opens at ${formatHour(opens)}` };
  }
  const tomorrow = openingHours[(day + 1) % 7];
  return { open: false, text: `Closed now · opens tomorrow at ${formatHour(tomorrow[0])}` };
}

function updateOpenStatus() {
  const status = openStatus();
  document.querySelectorAll("[data-open-status]").forEach((element) => {
    element.textContent = status.text;
    element.classList.toggle("is-open", status.open);
    element.classList.toggle("is-closed", !status.open);
  });
}

updateOpenStatus();
setInterval(updateOpenStatus, 60 * 1000); // stays right if the page is left open

const today = String(new Date().getDay());

document.querySelectorAll(".hours-list [data-days]").forEach((row) => {
  row.classList.toggle("is-today", row.dataset.days.split(" ").includes(today));
});

/* ---------- Keep the copyright year current ---------- */

document.querySelectorAll("[data-year]").forEach((element) => {
  element.textContent = new Date().getFullYear();
});
