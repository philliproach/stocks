// Store for active symbols and their names
let activeSymbols = [];
let symbolsData = {};

// Function to store stock name data
function initializeStockData() {
    // Add data for standard predefined stocks
    document.querySelectorAll('input[type="checkbox"][data-name]').forEach(checkbox => {
        symbolsData[checkbox.value] = {
            name: checkbox.getAttribute('data-name'),
            category: getStockCategory(checkbox)
        };
    });
}

// Function to get stock category
function getStockCategory(checkbox) {
    const categoryContainer = checkbox.closest('.stock-category');
    if (categoryContainer) {
        const categoryTitle = categoryContainer.querySelector('.category-title');
        return categoryTitle ? categoryTitle.textContent : 'Other';
    }
    return 'Other';
}

// Function to load theme preference from localStorage
function loadThemePreference() {
    const darkMode = localStorage.getItem('darkMode') === 'true';
    if (darkMode) {
        document.body.classList.add('dark-mode');
        document.getElementById('theme-toggle').checked = true;
    }
}

// Function to toggle theme
function toggleTheme() {
    const darkMode = document.getElementById('theme-toggle').checked;
    if (darkMode) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
    localStorage.setItem('darkMode', darkMode);
}

// Function to load symbols from localStorage
function loadSavedSymbols() {
    const savedSymbols = localStorage.getItem('activeSymbols');
    if (savedSymbols) {
        activeSymbols = JSON.parse(savedSymbols);
        
        // Check the boxes for saved symbols
        activeSymbols.forEach(symbol => {
            const checkbox = document.getElementById(symbol);
            if (checkbox) {
                checkbox.checked = true;
            }
        });
        
        // Load custom symbols data if available
        const savedSymbolsData = localStorage.getItem('symbolsData');
        if (savedSymbolsData) {
            const parsedData = JSON.parse(savedSymbolsData);
            // Merge with existing data, keeping predefined data intact
            symbolsData = { ...symbolsData, ...parsedData };
        }
        
        // Update UI
        updateCheckedStocksDisplay();
        renderCharts();
    }
}

// Function to save symbols to localStorage
function saveSymbols() {
    localStorage.setItem('activeSymbols', JSON.stringify(activeSymbols));
    localStorage.setItem('symbolsData', JSON.stringify(symbolsData));
}

// Function to update the checked stocks display
function updateCheckedStocksDisplay() {
    const container = document.getElementById('checked-stocks-display');
    container.innerHTML = '';
    
    if (activeSymbols.length === 0) {
        container.innerHTML = '<p>No stocks selected. Check boxes from the categories or use the search bar.</p>';
        return;
    }
    
    activeSymbols.forEach(symbol => {
        const name = symbolsData[symbol]?.name || symbol;
        const chip = document.createElement('div');
        chip.className = 'stock-chip';
        chip.innerHTML = `
            <span>${name} (${symbol})</span>
            <span class="remove-stock" data-symbol="${symbol}">✕</span>
        `;
        container.appendChild(chip);
    });
    
    // Add event listeners to remove buttons
    document.querySelectorAll('.remove-stock').forEach(btn => {
        btn.addEventListener('click', function() {
            const symbolToRemove = this.getAttribute('data-symbol');
            removeSymbol(symbolToRemove);
        });
    });
}

// Function to add a symbol
function addSymbol(symbol, name = null) {
    // Check if symbol is already in the list
    if (!activeSymbols.includes(symbol)) {
        activeSymbols.push(symbol);
        
        // Add to symbols data if it's a custom symbol
        if (name && !symbolsData[symbol]) {
            symbolsData[symbol] = {
                name: name,
                category: 'Custom'
            };
        } else if (!symbolsData[symbol]) {
            symbolsData[symbol] = {
                name: symbol,
                category: 'Custom'
            };
        }
        
        saveSymbols();
        updateCheckedStocksDisplay();
        renderCharts();
        
        // Check the box if it exists
        const checkbox = document.getElementById(symbol);
        if (checkbox) {
            checkbox.checked = true;
        }
    }
}

// Function to remove a symbol
function removeSymbol(symbol) {
    activeSymbols = activeSymbols.filter(s => s !== symbol);
    saveSymbols();
    updateCheckedStocksDisplay();
    renderCharts();
    
    // Uncheck the box if it exists
    const checkbox = document.getElementById(symbol);
    if (checkbox) {
        checkbox.checked = false;
    }
}

// Function to create a TradingView widget
function createWidget(container, symbol) {
    // Get current theme
    const isDarkMode = document.body.classList.contains('dark-mode');
    
    // Create widget
    new TradingView.widget({
        "width": "100%",
        "height": 600,
        "symbol": symbol,
        "interval": document.getElementById('interval').value,
        "timezone": "Etc/UTC",
        "theme": isDarkMode ? "dark" : "light",
        "style": "1",
        "locale": "en",
        "toolbar_bg": isDarkMode ? "#2d2d2d" : "#f1f3f6",
        "enable_publishing": false,
        "hide_top_toolbar": true,
        "hide_legend": true,
        "save_image": false,
        "container_id": container
    });
}

// Function to render all charts
function renderCharts() {
    const chartsContainer = document.getElementById('charts-container');
    chartsContainer.innerHTML = '';
    
    if (activeSymbols.length === 0) {
        chartsContainer.innerHTML = '<p>No stocks selected to display.</p>';
        return;
    }
    
    activeSymbols.forEach((symbol, index) => {
        // Create wrapper for the chart with header
        const chartWrapper = document.createElement('div');
        chartWrapper.className = 'chart-wrapper';
        
        // Create header for the chart
        const chartHeader = document.createElement('div');
        chartHeader.className = 'chart-header';
        
        const name = symbolsData[symbol]?.name || symbol;
        chartHeader.innerHTML = `
            <div class="chart-title">${name}</div>
            <div class="chart-symbol">${symbol}</div>
        `;
        
        // Create chart container
        const chartDiv = document.createElement('div');
        chartDiv.className = 'chart-item';
        chartDiv.id = `chart-${index}`;
        
        // Append to wrapper
        chartWrapper.appendChild(chartHeader);
        chartWrapper.appendChild(chartDiv);
        
        // Add to page
        chartsContainer.appendChild(chartWrapper);
        
        // Create widget
        createWidget(`chart-${index}`, symbol);
    });
}

// Initialize TradingView script
function initTradingViewScript() {
    return new Promise((resolve, reject) => {
        if (window.TradingView) {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/tv.js';
        script.async = true;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Function to handle adding a custom symbol
function handleAddSymbol() {
    const symbolInput = document.getElementById('symbolInput');
    const symbol = symbolInput.value.trim().toUpperCase();
    
    if (symbol) {
        // Try to extract name if entered in format "Name (SYMBOL)"
        let name = symbol;
        const match = symbol.match(/(.+)\s*\(([^)]+)\)/);
        
        if (match) {
            name = match[1].trim();
            symbol = match[2].trim();
        }
        
        addSymbol(symbol, name !== symbol ? name : null);
        symbolInput.value = '';
    }
}

// Event listener for the theme toggle
document.getElementById('theme-toggle').addEventListener('change', function() {
    toggleTheme();
    renderCharts(); // Re-render charts to match the new theme
});

// Event listener for the search button
document.getElementById('searchBtn').addEventListener('click', handleAddSymbol);

// Event listener for the search input (enter key)
document.getElementById('symbolInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        handleAddSymbol();
    }
});

// Event listener for checkboxes
document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    if (checkbox.id !== 'theme-toggle') { // Skip the theme toggle checkbox
        checkbox.addEventListener('change', function() {
            const symbol = this.value;
            if (this.checked) {
                const name = this.getAttribute('data-name');
                addSymbol(symbol, name);
            } else {
                removeSymbol(symbol);
            }
        });
    }
});

// Event listener for update charts button
document.getElementById('updateChartsBtn').addEventListener('click', function() {
    renderCharts();
});

// Event listener for clear all button
document.getElementById('clearAllBtn').addEventListener('click', function() {
    activeSymbols = [];
    saveSymbols();
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        if (checkbox.id !== 'theme-toggle') { // Skip the theme toggle checkbox
            checkbox.checked = false;
        }
    });
    updateCheckedStocksDisplay();
    renderCharts();
});

// Event listener for interval dropdown (NEW CODE)
document.getElementById('interval').addEventListener('change', function() {
    renderCharts();
});

// Initialize when page loads
window.addEventListener('DOMContentLoaded', async function() {
    try {
        // Initialize stock data
        initializeStockData();
        
        // Load theme preferences first
        loadThemePreference();
        
        await initTradingViewScript();
        loadSavedSymbols();
    } catch (error) {
        console.error('Failed to load TradingView script:', error);
        alert('Failed to load TradingView charts. Please refresh the page.');
    }
});
