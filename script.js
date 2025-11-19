document.addEventListener('DOMContentLoaded', () => {
    const articlesContainer = document.getElementById('articles-container');
    const searchButton = document.getElementById('botao-busca');
    const searchInput = document.getElementById('caixa-busca');
    const loadMoreButton = document.getElementById('load-more-btn');
    const loadMoreContainer = document.getElementById('load-more-container');
    const themeSwitcherButton = document.getElementById('theme-switcher-btn');
    const sortSelect = document.getElementById('sort-select');
    const body = document.body;

    let allData = [];
    let filteredData = [];
    let itemsToShow = 4;
    let itemsLoaded = 0;

    // --- THEME SWITCHER LOGIC ---
    const currentTheme = localStorage.getItem('theme');

    function setTeam(isLight) {
        body.classList.toggle('light-theme', isLight);
        themeSwitcherButton.textContent = isLight ? '☀️' : '🌙';
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
    }

    if (currentTheme === 'light') {
        setTeam(true);
    }

    themeSwitcherButton.addEventListener('click', () => {
        setTeam(!body.classList.contains('light-theme'));
    });


    // --- DATA FETCHING AND DISPLAY LOGIC ---
    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            allData = data;
            filteredData = allData;
            sortAndRerender();
        })
        .catch(error => console.error('Erro ao carregar os dados:', error));

    // Function to display a batch of articles
    function displayItems(items) {
        items.forEach((item, index) => {
            const article = document.createElement('article');
            article.innerHTML = `
                <h2>${item.Nome}</h2>
                <p><strong>Ano de criação:</strong> ${item.Ano}</p>
                <p>${item.Descricao}</p>
                <a href="${item.link}" target="_blank" rel="noopener noreferrer">Saiba mais</a>
            `;
            // Staggered animation
            article.style.animationDelay = `${(itemsLoaded % itemsToShow) * 100}ms`;
            articlesContainer.appendChild(article);
        });
        itemsLoaded += items.length;
        updateLoadMoreButton();
    }

    // Function to load the next batch of items
    function loadMoreItems() {
        const itemsToLoad = filteredData.slice(itemsLoaded, itemsLoaded + itemsToShow);
        displayItems(itemsToLoad);
    }

    // Update visibility of the "Load More" button
    function updateLoadMoreButton() {
        if (itemsLoaded >= filteredData.length) {
            loadMoreContainer.style.display = 'none';
        } else {
            loadMoreContainer.style.display = 'block';
        }
    }

    // Function to handle search
    function iniciarBusca() {
        const searchTerm = searchInput.value.toLowerCase();
        filteredData = allData.filter(item => 
            item.Nome.toLowerCase().includes(searchTerm) ||
            item.Descricao.toLowerCase().includes(searchTerm)
        );
        sortAndRerender();

        if (filteredData.length === 0) {
            articlesContainer.innerHTML = '<p>Nenhum resultado encontrado.</p>';
        }
    }

    // --- SORTING LOGIC ---
    function sortAndRerender() {
        const sortValue = sortSelect.value;

        switch (sortValue) {
            case 'name-asc':
                filteredData.sort((a, b) => a.Nome.localeCompare(b.Nome));
                break;
            case 'name-desc':
                filteredData.sort((a, b) => b.Nome.localeCompare(a.Nome));
                break;
            case 'year-desc':
                filteredData.sort((a, b) => b.Ano - a.Ano);
                break;
            case 'year-asc':
                filteredData.sort((a, b) => a.Ano - b.Ano);
                break;
        }

        articlesContainer.innerHTML = '';
        itemsLoaded = 0;
        loadMoreItems();
    }


    // Event listeners
    searchButton.addEventListener('click', iniciarBusca);
    searchInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            iniciarBusca();
        }
    });
    loadMoreButton.addEventListener('click', loadMoreItems);
    sortSelect.addEventListener('change', sortAndRerender);
});
