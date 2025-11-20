document.addEventListener('DOMContentLoaded', () => {
    const articlesContainer = document.getElementById('articles-container');
    const searchButton = document.getElementById('botao-busca');
    const searchInput = document.getElementById('caixa-busca');
    const loadMoreButton = document.getElementById('load-more-btn');
    const loadMoreContainer = document.getElementById('load-more-container');
    const themeSwitcherButton = document.getElementById('theme-switcher-btn');
    const sortSelect = document.getElementById('sort-select');
    const categoryFilter = document.getElementById('category-filter');
    const tagFilter = document.getElementById('tag-filter');
    const backToTopButton = document.getElementById('back-to-top-btn');
    const body = document.body;

    let allData = [];
    let filteredData = [];
    let itemsToShow = 6;
    let itemsLoaded = 0;

    const FAVORITE_KEY = "favorites";
    let favorites = JSON.parse(localStorage.getItem(FAVORITE_KEY) || "[]");

    // =======================
    // Utils
    // =======================
    function debounce(func, delay) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), delay);
        };
    }

    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function highlight(text, term) {
        if (!term) return text;
        const regex = new RegExp(`(${escapeRegExp(term)})`, "gi");
        return text.replace(regex, "<mark>$1</mark>");
    }

    function toggleFavorite(name) {
        if (favorites.includes(name)) {
            favorites = favorites.filter(f => f !== name);
        } else {
            favorites.push(name);
        }
        localStorage.setItem(FAVORITE_KEY, JSON.stringify(favorites));
        sortAndRerender();
    }

    function isFavorite(name) {
        return favorites.includes(name);
    }

    // =======================
    // Theme
    // =======================
    const currentTheme = localStorage.getItem("theme") || "dark";
    setTheme(currentTheme === "light");

    function setTheme(isLight) {
        body.classList.toggle("light-theme", isLight);
        themeSwitcherButton.textContent = isLight ? "☀️" : "🌙";
        localStorage.setItem("theme", isLight ? "light" : "dark");
    }

    themeSwitcherButton.addEventListener("click", () => {
        setTheme(!body.classList.contains("light-theme"));
    });

    // =======================
    // Back to top
    // =======================
    window.addEventListener("scroll", () => {
        backToTopButton.style.display = window.scrollY > 200 ? "block" : "none";
    });

    backToTopButton.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });

    // =======================
    // Load JSON
    // =======================
    fetch("data.json")
        .then(res => res.json())
        .then(data => {
            allData = data;
            filteredData = allData;
            populateFilters();
            sortAndRerender();
        })
        .catch(err => console.error("Erro ao carregar JSON:", err));

    // =======================
    // Populate filters
    // =======================
    function populateFilters() {
        const categories = [...new Set(allData.map(item => item.Categoria))].sort();
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });

        const allTags = allData.flatMap(item => item.Tags || []);
        const uniqueTags = [...new Set(allTags)].sort();
        uniqueTags.forEach(tag => {
            const option = document.createElement('option');
            option.value = tag;
            option.textContent = tag;
            tagFilter.appendChild(option);
        });
    }

    // =======================
    // Create Article Card
    // =======================
    function createArticleElement(item, term = "") {
        const article = document.createElement("article");
        article.classList.add("fade-in");

        const validLink = item.link && /^https?:\/\//i.test(item.link);
        const tagsHTML = (item.Tags || []).map(tag => `<span class="tag">${tag}</span>`).join("");

        article.innerHTML = `
            <div class="card-header">
                <img class="logo" src="${item.Logo || ''}" alt="${item.Nome} logo">
                <h2>${highlight(item.Nome, term)} ${isFavorite(item.Nome) ? "⭐" : ""}</h2>
            </div>
            <p><strong>Categoria:</strong> ${item.Categoria || 'N/A'}</p>
            <p><strong>Tipo:</strong> ${item.Tipo || 'N/A'}</p>
            <p><strong>Popularidade:</strong> ⭐ ${item.Popularidade || 0}</p>
            <p><strong>Dificuldade:</strong> ${item.Dificuldade || 'N/A'}</p>
            <p><strong>Ano:</strong> ${item.Ano || 'N/A'}</p>
            <p><strong>Criador:</strong> ${item.Criador || 'N/A'}</p>
            <p class="desc">${highlight(item.Descricao || '', term)}</p>
            <div class="tags">${tagsHTML}</div>
            ${validLink
                ? `<a class="saiba-mais" href="${item.link}" target="_blank">Saiba mais</a>`
                : `<span class="link-indisponivel">Link indisponível</span>`
            }
            <button class="fav-btn" data-name="${item.Nome}">
                ${isFavorite(item.Nome) ? "★ Remover Favorito" : "☆ Favoritar"}
            </button>
        `;

        const favBtn = article.querySelector(".fav-btn");
        favBtn.addEventListener("click", () => toggleFavorite(item.Nome));

        return article;
    }

    // =======================
    // Display & Load More
    // =======================
    function displayItems(items, term) {
        items.forEach(item => articlesContainer.appendChild(createArticleElement(item, term)));
        itemsLoaded += items.length;
        updateLoadMoreButton();
    }

    function loadMoreItems() {
        const term = searchInput.value.toLowerCase();
        const items = filteredData.slice(itemsLoaded, itemsLoaded + itemsToShow);
        displayItems(items, term);
    }

    function updateLoadMoreButton() {
        loadMoreContainer.style.display = itemsLoaded >= filteredData.length ? "none" : "block";
    }

    // =======================
    // Search & Filter
    // =======================
    function iniciarBusca() {
        const term = searchInput.value.toLowerCase().trim();
        const selectedCategory = categoryFilter.value;
        const selectedTag = tagFilter.value;

        filteredData = allData.filter(item => {
            const matchesSearch = !term || (
                (item.Nome && item.Nome.toLowerCase().includes(term)) ||
                (item.Descricao && item.Descricao.toLowerCase().includes(term)) ||
                (item.Categoria && item.Categoria.toLowerCase().includes(term)) ||
                (item.Criador && item.Criador.toLowerCase().includes(term)) ||
                (item.Tipo && item.Tipo.toLowerCase().includes(term)) ||
                ((item.Tags || []).some(tag => tag.toLowerCase().includes(term)))
            );

            const matchesCategory = selectedCategory === "all" || item.Categoria === selectedCategory;
            const matchesTag = selectedTag === "all" || (item.Tags && item.Tags.includes(selectedTag));

            return matchesSearch && matchesCategory && matchesTag;
        });

        sortAndRerender();

        if (filteredData.length === 0) {
            articlesContainer.innerHTML = "<p>Nenhum resultado encontrado.</p>";
        }
    }

    // =======================
    // Sorting
    // =======================
    function sortAndRerender() {
        const sortValue = sortSelect.value;

        switch (sortValue) {
            case "name-asc": filteredData.sort((a, b) => a.Nome.localeCompare(b.Nome)); break;
            case "name-desc": filteredData.sort((a, b) => b.Nome.localeCompare(a.Nome)); break;
            case "year-asc": filteredData.sort((a, b) => (a.Ano || 0) - (b.Ano || 0)); break;
            case "year-desc": filteredData.sort((a, b) => (b.Ano || 0) - (a.Ano || 0)); break;
            case "popularity-asc": filteredData.sort((a, b) => (a.Popularidade || 0) - (b.Popularidade || 0)); break;
            case "popularity-desc": filteredData.sort((a, b) => (b.Popularidade || 0) - (a.Popularidade || 0)); break;
            case "favorites": filteredData.sort((a, b) => isFavorite(b.Nome) - isFavorite(a.Nome)); break;
        }

        articlesContainer.innerHTML = "";
        itemsLoaded = 0;
        loadMoreItems();
    }

    // =======================
    // Event Listeners
    // =======================
    searchButton.addEventListener("click", iniciarBusca);
    searchInput.addEventListener("keyup", debounce(iniciarBusca, 300));
    loadMoreButton.addEventListener("click", loadMoreItems);
    sortSelect.addEventListener("change", sortAndRerender);
    categoryFilter.addEventListener("change", iniciarBusca);
    tagFilter.addEventListener("change", iniciarBusca);
});
