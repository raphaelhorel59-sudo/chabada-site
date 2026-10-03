(function () {
  const SANITY_PROJECT_ID = "ehmw6xk5";
  const SANITY_DATASET = "production";
  const API_VERSION = "2026-05-08";

  const SANITY_CATEGORIES = ["formules", "entrees", "plats", "desserts", "cocktails"];
  const DISH_CACHE = Object.create(null);
  const FALLBACK_IMAGES = {
    formules: { src: "images/table-burger.jpg", title: "Formules" },
    entrees: { src: "images/croquettes.jpg", title: "Entrées" },
    plats: { src: "images/plat-poulet.jpg", title: "Plats" },
    desserts: { src: "images/vins.jpg", title: "Desserts" },
    cocktails: { src: "images/cocktails.jpg", title: "Cocktails" },
  };

  let currentService = "soir";
  let visibleTab = "entrees";

  function groqForCategory(category, service) {
    return (
      '*[_type == "dish" && coalesce(published, true) == true && category == "' +
      category +
      '" && coalesce(available, true) == true && ("' +
      service +
      '" in coalesce(service, ["soir"]))] | order(coalesce(sortOrder, 9999) asc, name asc) { _id, name, description, price, priceLabel, allergens, "imageUrl": image.asset->url }'
    );
  }

  function getStaticDishes(category, service) {
    const root = window.CHABADA_STATIC_MENU;
    if (!root || !root[service]) return [];
    const list = root[service][category];
    return Array.isArray(list) ? list : [];
  }

  // Démo: menu en dur. Remettre Sanity plus tard avec ?sanity=1 ou en retirant le static.
  async function fetchDishes(category, service) {
    const wantSanity = new URLSearchParams(window.location.search).get("sanity") === "1";
    if (!wantSanity && window.CHABADA_STATIC_MENU) {
      return getStaticDishes(category, service);
    }

    const query = groqForCategory(category, service);
    const base = `https://${SANITY_PROJECT_ID}.apicdn.sanity.io/v${API_VERSION}/data/query/${SANITY_DATASET}`;
    const url = `${base}?query=${encodeURIComponent(query)}`;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Sanity HTTP ${res.status}`);
      const json = await res.json();
      return Array.isArray(json.result) ? json.result : [];
    } catch (err) {
      console.warn("[CHABADA menu] Sanity indisponible, menu statique.", err);
      return getStaticDishes(category, service);
    }
  }

  function formatAllergensLabel(text) {
    if (!text || !String(text).trim()) return "";
    const t = String(text).trim();
    if (/^allergène/i.test(t)) return t;
    return `Allergènes: ${t}`;
  }

  function formatPrice(dish) {
    if (dish.priceLabel && String(dish.priceLabel).trim()) return String(dish.priceLabel).trim();
    if (dish.price == null || dish.price === "") return "";
    const n = Number(dish.price);
    if (Number.isNaN(n)) return "";
    return Number.isInteger(n) ? `${n} €` : `${String(n).replace(".", ",")} €`;
  }

  function setShowcase(dishOrFallback) {
    const feature = document.querySelector(".menu-feature");
    if (!feature) return;
    const img = feature.querySelector("img");
    const title = feature.querySelector(".cap h3");
    const kicker = feature.querySelector(".cap small");

    if (img && dishOrFallback.src) {
      img.src = dishOrFallback.src;
      img.alt = dishOrFallback.alt || dishOrFallback.title || "";
    }
    if (title) title.textContent = dishOrFallback.title || "";
    if (kicker) kicker.textContent = dishOrFallback.kicker || "Coup de Cœur";
  }

  function renderDish(dish) {
    const article = document.createElement("div");
    article.className = "menu-item";
    if (dish.imageUrl) {
      article.classList.add("menu-item--has-image");
      article.setAttribute("role", "button");
      article.tabIndex = 0;
      article.title = "Afficher la photo";
    }

    const head = document.createElement("div");
    head.className = "menu-item-head";

    const nameEl = document.createElement("h4");
    nameEl.textContent = dish.name || "";

    const priceEl = document.createElement("span");
    priceEl.className = "price";
    priceEl.textContent = formatPrice(dish);

    head.appendChild(nameEl);
    head.appendChild(priceEl);
    article.appendChild(head);

    if (dish.description) {
      const p = document.createElement("p");
      p.textContent = dish.description;
      article.appendChild(p);
    }

    if (dish.allergens) {
      const allergens = document.createElement("p");
      allergens.className = "menu-item-allergens";
      allergens.textContent = formatAllergensLabel(dish.allergens);
      article.appendChild(allergens);
    }

    if (dish.imageUrl) {
      const show = function () {
        setShowcase({
          src: dish.imageUrl,
          title: dish.name || "",
          alt: dish.name ? `Illustration : ${dish.name}` : "",
          kicker: "Coup de Cœur",
        });
      };
      article.addEventListener("click", show);
      article.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          show();
        }
      });
    }

    return article;
  }

  function syncShowcaseFromCache(category) {
    const dishes = DISH_CACHE[currentService + ":" + category];
    const withImg = Array.isArray(dishes)
      ? dishes.filter(function (d) {
          return d && d.imageUrl;
        })
      : [];
    const primary = withImg[0];

    if (primary) {
      setShowcase({
        src: primary.imageUrl,
        title: primary.name || "",
        alt: primary.name ? `Illustration : ${primary.name}` : "",
        kicker: "Coup de Cœur",
      });
      return;
    }

    const fallback = FALLBACK_IMAGES[category] || FALLBACK_IMAGES.entrees;
    setShowcase({
      src: fallback.src,
      title: fallback.title,
      alt: fallback.title,
      kicker: "La Carte",
    });
  }

  function updateServiceButtons() {
    document.querySelectorAll(".menu-mode-link[data-service]").forEach(function (btn) {
      const on = btn.getAttribute("data-service") === currentService;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-selected", on ? "true" : "false");
    });
  }

  function updateCategoryTabs() {
    SANITY_CATEGORIES.forEach(function (cat) {
      const dishes = DISH_CACHE[currentService + ":" + cat];
      const has = Array.isArray(dishes) && dishes.length > 0;
      document.querySelectorAll('.tab[data-tab="' + cat + '"]').forEach(function (tab) {
        tab.hidden = !has;
      });
    });

    const currentHas =
      Array.isArray(DISH_CACHE[currentService + ":" + visibleTab]) &&
      DISH_CACHE[currentService + ":" + visibleTab].length > 0;
    if (!currentHas) {
      visibleTab = SANITY_CATEGORIES.find(function (cat) {
        const dishes = DISH_CACHE[currentService + ":" + cat];
        return Array.isArray(dishes) && dishes.length > 0;
      }) || "entrees";
    }
  }

  async function loadMenusFromSanity() {
    await Promise.all(
      SANITY_CATEGORIES.map(async function (cat) {
        const container = document.querySelector(`[data-dish-list="${cat}"]`);
        if (!container) return;
        const cacheKey = currentService + ":" + cat;

        const dishes = await fetchDishes(cat, currentService);
        DISH_CACHE[cacheKey] = dishes;
        container.innerHTML = "";
        if (dishes.length === 0) {
          const p = document.createElement("p");
          p.className = "menu-empty";
          p.textContent =
            cat === "formules"
              ? "Aucune formule pour ce service."
              : "Aucun plat dans cette catégorie pour le moment.";
          container.appendChild(p);
          return;
        }
        dishes.forEach(function (dish) {
          container.appendChild(renderDish(dish));
        });
      })
    );
  }

  function setActiveTab(category) {
    visibleTab = category;
    document.querySelectorAll(".tab[data-tab]").forEach(function (tab) {
      tab.classList.toggle("active", tab.getAttribute("data-tab") === category);
    });
    document.querySelectorAll("[data-cat]").forEach(function (group) {
      const on = group.getAttribute("data-cat") === category;
      group.style.display = on ? "" : "none";
    });
    syncShowcaseFromCache(category);
  }

  const run = async function () {
    const params = new URLSearchParams(window.location.search);
    const urlService = params.get("service");
    const urlTab = params.get("tab");
    currentService = urlService === "midi" ? "midi" : "soir";
    visibleTab = SANITY_CATEGORIES.includes(urlTab) ? urlTab : "entrees";

    updateServiceButtons();
    await loadMenusFromSanity();
    updateCategoryTabs();
    if (visibleTab === "formules" && document.querySelector('.tab[data-tab="formules"]')?.hidden) {
      visibleTab = "entrees";
    }
    setActiveTab(visibleTab);

    document.querySelectorAll("[data-service]").forEach(function (btn) {
      btn.addEventListener("click", async function (e) {
        e.preventDefault();
        const service = btn.getAttribute("data-service");
        if (!service || service === currentService) return;
        currentService = service;
        updateServiceButtons();
        await loadMenusFromSanity();
        updateCategoryTabs();
        if (visibleTab === "formules" && document.querySelector('.tab[data-tab="formules"]')?.hidden) {
          visibleTab = "entrees";
        }
        setActiveTab(visibleTab);
        const next = new URL(window.location.href);
        next.searchParams.set("service", currentService);
        next.searchParams.set("tab", visibleTab);
        window.history.replaceState({ service: currentService, tab: visibleTab }, "", next);
      });
    });

    document.querySelectorAll(".tab[data-tab]").forEach(function (tab) {
      tab.addEventListener("click", function (e) {
        e.preventDefault();
        const cat = tab.getAttribute("data-tab");
        if (!cat || !SANITY_CATEGORIES.includes(cat) || tab.hidden) return;
        setActiveTab(cat);
        const next = new URL(window.location.href);
        next.searchParams.set("service", currentService);
        next.searchParams.set("tab", cat);
        window.history.replaceState({ service: currentService, tab: cat }, "", next);
      });
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
