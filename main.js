/* =========================================================
   Holidae Prototype JS
   - Mobile nav toggle (responsive usability)
   - Theme toggle (saved to localStorage)
   - Package filtering + search (landing page)
   - FAQ accordion
   - Booking total calculator + validation
   - Gallery modal (package page)
   - Save selection (localStorage) + show it on contact page
   ========================================================= */

(function () {
  // ---------- Helpers ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function setStatus(el, msg, ok = true) {
    if (!el) return;
    el.textContent = msg;
    el.style.color = ok ? "inherit" : "crimson";
  }

  // ---------- Mobile nav ----------
  const navToggle = $(".nav-toggle");
  const nav = $("#site-nav");

  if (navToggle && nav) {
    navToggle.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });

    // Close menu when clicking a link (nice for mobile)
    $$(".site-nav a").forEach((link) => {
      link.addEventListener("click", () => {
        nav.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // ---------- Theme toggle ----------
  const themeBtn = $(".theme-toggle");
  const savedTheme = localStorage.getItem("holidaeTheme");

  if (savedTheme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
    if (themeBtn) themeBtn.setAttribute("aria-pressed", "true");
  }

  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const isDark = document.documentElement.getAttribute("data-theme") === "dark";
      if (isDark) {
        document.documentElement.removeAttribute("data-theme");
        localStorage.setItem("holidaeTheme", "light");
        themeBtn.setAttribute("aria-pressed", "false");
        themeBtn.textContent = "Dark mode";
      } else {
        document.documentElement.setAttribute("data-theme", "dark");
        localStorage.setItem("holidaeTheme", "dark");
        themeBtn.setAttribute("aria-pressed", "true");
        themeBtn.textContent = "Light mode";
      }
    });
  }

  // ---------- Landing page filter + search ----------
  const filterSelect = $("#packageFilter");
  const searchInput = $("#packageSearch");
  const cardsRoot = document.querySelector("[data-cards]");

  function applyCardFilters() {
    if (!cardsRoot) return;

    const category = filterSelect ? filterSelect.value : "all";
    const query = searchInput ? searchInput.value.trim().toLowerCase() : "";

    $$(".card", cardsRoot).forEach((card) => {
      const cardCat = card.getAttribute("data-category") || "";
      const keywords = (card.getAttribute("data-keywords") || "").toLowerCase();

      const matchesCategory = category === "all" || cardCat === category;
      const matchesQuery = !query || keywords.includes(query);

      card.style.display = (matchesCategory && matchesQuery) ? "" : "none";
    });
  }

  if (filterSelect) filterSelect.addEventListener("change", applyCardFilters);
  if (searchInput) searchInput.addEventListener("input", applyCardFilters);

  // ---------- FAQ accordion ----------
  const accordion = document.querySelector("[data-accordion]");
  if (accordion) {
    const questions = $$(".faq-q", accordion);

    questions.forEach((btn) => {
      btn.addEventListener("click", () => {
        const expanded = btn.getAttribute("aria-expanded") === "true";
        // Toggle just this one (simple accordion)
        btn.setAttribute("aria-expanded", String(!expanded));

        const answer = btn.nextElementSibling;
        if (answer) answer.hidden = expanded;
      });
    });
  }

  // ---------- Gallery modal ----------
  const gallery = document.querySelector("[data-gallery]");
  const modal = document.querySelector("[data-modal]");
  const modalImg = document.querySelector("[data-modal-img]");
  const modalCaption = document.querySelector("[data-modal-caption]");
  const modalClose = document.querySelector("[data-modal-close]");

  function openModal(src, alt) {
    if (!modal || !modalImg) return;

    modalImg.src = src;
    modalImg.alt = alt || "Selected image";

    if (modalCaption) modalCaption.textContent = alt || "";

    // dialog supported in modern browsers; if not, user still sees images inline.
    if (typeof modal.showModal === "function") {
      modal.showModal();
    }
  }

  function closeModal() {
    if (modal && typeof modal.close === "function") modal.close();
  }

  if (gallery) {
    $$(".gallery-item", gallery).forEach((btn) => {
      btn.addEventListener("click", () => {
        const img = $("img", btn);
        if (!img) return;
        openModal(img.src, img.alt);
      });
    });
  }

  if (modalClose) modalClose.addEventListener("click", closeModal);
  if (modal) {
    modal.addEventListener("click", (e) => {
      // Close if user clicks backdrop area (not the image)
      const rect = modal.getBoundingClientRect();
      const inDialog =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;

      if (!inDialog) closeModal();
    });
  }

  // ---------- Booking form (package page) ----------
  const bookingForm = document.querySelector("[data-booking-form]");
  const totalEl = document.querySelector("[data-total]");
  const basePriceEl = document.querySelector("[data-base-price]");
  const saveBtn = document.querySelector("[data-save-selection]");

  function calcTotal() {
    if (!bookingForm || !totalEl || !basePriceEl) return;

    const base = Number(basePriceEl.textContent) || 0;
    const travellers = Number($("#travellers", bookingForm)?.value || 1);
    const month = $("#month", bookingForm)?.value || "low";

    // Simple seasonal multiplier (prototype)
    const multiplier = month === "high" ? 1.25 : month === "mid" ? 1.1 : 1.0;

    const breakfast = bookingForm.elements["breakfast"]?.checked ? 35 : 0;
    const transfers = bookingForm.elements["transfers"]?.checked ? 20 : 0;

    const perPerson = Math.round(base * multiplier + breakfast + transfers);
    const total = perPerson * travellers;

    totalEl.textContent = `£${total}`;
    return { total, travellers, month, perPerson };
  }

  if (bookingForm) {
    // Update total whenever inputs change
    ["change", "input"].forEach((evt) => bookingForm.addEventListener(evt, calcTotal));
    calcTotal();

    bookingForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const name = $("#fullName", bookingForm)?.value.trim();
      const email = $("#email", bookingForm)?.value.trim();
      const msgEl = bookingForm.querySelector("[data-form-message]");

      // Basic validation (simple + clear)
      if (!name) return setStatus(msgEl, "Please enter your full name.", false);
      if (!email || !email.includes("@")) return setStatus(msgEl, "Please enter a valid email address.", false);

      const summary = calcTotal();
      setStatus(
        msgEl,
        `Reserved (prototype)! Estimated total ${summary ? `£${summary.total}` : ""}. Check your email for confirmation (not really sent).`,
        true
      );

      // Optional: reset the form but keep totals recalculating
      // bookingForm.reset();
      // calcTotal();
    });
  }

  // Save selection (simulate “browse on mobile, book later on desktop”)
  if (saveBtn && bookingForm) {
    saveBtn.addEventListener("click", () => {
      const summary = calcTotal() || {};
      const payload = {
        packageName: "Costa Escape (Spain)",
        travellers: Number($("#travellers", bookingForm)?.value || 1),
        month: $("#month", bookingForm)?.value || "low",
        total: summary.total || 0,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem("holidaeSavedSelection", JSON.stringify(payload));

      const msgEl = bookingForm.querySelector("[data-form-message]");
      setStatus(msgEl, "Saved! You can view this on the Contact page under “Saved selection”.", true);
    });
  }

  // ---------- Contact page: show saved selection ----------
  const savedBox = document.querySelector("[data-saved]");
  const clearSavedBtn = document.querySelector("[data-clear-saved]");

  function renderSaved() {
    if (!savedBox) return;
    const raw = localStorage.getItem("holidaeSavedSelection");

    if (!raw) {
      savedBox.innerHTML = `<p class="small muted">Nothing saved yet.</p>`;
      return;
    }

    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      savedBox.innerHTML = `<p class="small muted">Saved data was corrupted. Clear and try again.</p>`;
      return;
    }

    const when = new Date(data.savedAt);
    const niceDate = isNaN(when.getTime()) ? "" : when.toLocaleString();

    savedBox.innerHTML = `
      <p><strong>${data.packageName || "Saved package"}</strong></p>
      <p class="small muted">Travellers: ${data.travellers || 1}</p>
      <p class="small muted">Departure band: ${data.month || "low"}</p>
      <p class="small muted">Estimate: £${data.total || 0}</p>
      <p class="small muted">Saved: ${niceDate}</p>
    `;
  }

  if (savedBox) renderSaved();

  if (clearSavedBtn) {
    clearSavedBtn.addEventListener("click", () => {
      localStorage.removeItem("holidaeSavedSelection");
      renderSaved();
    });
  }
})();
