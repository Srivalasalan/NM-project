// Basic DOM elements
const coinSearch = document.getElementById('coinSearch');
const cryptoData = document.getElementById('cryptoData');
const priceChartElement = document.getElementById('priceChart');
const priceChartCtx = priceChartElement.getContext('2d');

// Create coin details container if it doesn't exist
const coinDetailsContainer = document.getElementById('coinDetails') || document.createElement('div');
coinDetailsContainer.id = 'coinDetails';
document.querySelector('.container').appendChild(coinDetailsContainer);

let chartInstance = null;

// Basic fetch function with error handling
async function fetchData(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
}

// Main function to fetch coin data
async function fetchCoinData() {
    try {
        // Show loading state
        cryptoData.innerHTML = '<tr><td colspan="4" style="text-align: center;">Loading...</td></tr>';

        // Fetch data from CoinGecko
        const data = await fetchData('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=true');
        
        if (!data || data.length === 0) {
            throw new Error('No data received');
        }

        // Display the data
        displayCoins(data);
        createChart(data);
    } catch (error) {
        console.error('Error:', error);
        cryptoData.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; color: red;">
                    Failed to load data. Please try again.
                    <br>
                    <button onclick="fetchCoinData()" style="margin-top: 10px; padding: 5px 10px;">
                        Retry
                    </button>
                </td>
            </tr>`;
    }
}

// Display coins in the table
function displayCoins(coins) {
    cryptoData.innerHTML = '';
    coins.forEach(coin => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${coin.name}</td>
            <td>$${coin.current_price.toFixed(2)}</td>
            <td>$${coin.market_cap.toLocaleString()}</td>
            <td style="color: ${coin.price_change_percentage_24h < 0 ? 'red' : 'green'}">
                ${coin.price_change_percentage_24h.toFixed(2)}%
            </td>
        `;
        row.addEventListener('click', () => fetchCoinDetails(coin.id));
        cryptoData.appendChild(row);
    });
}

// Fetch individual coin details
async function fetchCoinDetails(coinId) {
    try {
        coinDetailsContainer.innerHTML = '<div style="text-align: center;">Loading coin details...</div>';
        
        const coin = await fetchData(`https://api.coingecko.com/api/v3/coins/${coinId}`);
        
        if (!coin || !coin.market_data) {
            throw new Error('Invalid coin data');
        }
        
        const detailsHtml = `
            <div style="background: rgba(255, 255, 255, 0.1); border-radius: 10px; padding: 20px; margin-top: 20px;">
                <h2 style="margin-top: 0; color: white;">${coin.name} Details</h2>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 10px;"><strong>Market Cap Rank:</strong></td>
                        <td style="padding: 10px;">#${coin.market_cap_rank}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px;"><strong>Current Price:</strong></td>
                        <td style="padding: 10px;">$${coin.market_data.current_price.usd.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px;"><strong>24h High:</strong></td>
                        <td style="padding: 10px;">$${coin.market_data.high_24h.usd.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px;"><strong>24h Low:</strong></td>
                        <td style="padding: 10px;">$${coin.market_data.low_24h.usd.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px;"><strong>24h Price Change:</strong></td>
                        <td style="padding: 10px; color: ${coin.market_data.price_change_percentage_24h < 0 ? 'red' : 'green'}">
                            ${coin.market_data.price_change_percentage_24h.toFixed(2)}%
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 10px;"><strong>Total Volume:</strong></td>
                        <td style="padding: 10px;">$${coin.market_data.total_volume.usd.toLocaleString()}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px;"><strong>Market Cap:</strong></td>
                        <td style="padding: 10px;">$${coin.market_data.market_cap.usd.toLocaleString()}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px;"><strong>Circulating Supply:</strong></td>
                        <td style="padding: 10px;">${coin.market_data.circulating_supply.toLocaleString()} ${coin.symbol.toUpperCase()}</td>
                    </tr>
                </table>
            </div>
        `;
        
        coinDetailsContainer.innerHTML = detailsHtml;
    } catch (error) {
        console.error('Error:', error);
        coinDetailsContainer.innerHTML = `
            <div style="background: rgba(255, 0, 0, 0.1); border-radius: 10px; padding: 20px; margin-top: 20px; text-align: center;">
                Failed to load coin details. Please try again.
                <br>
                <button onclick="fetchCoinDetails('${coinId}')" style="margin-top: 10px; padding: 5px 10px;">
                    Retry
                </button>
            </div>`;
    }
}

// Create price chart
function createChart(coins) {
    if (chartInstance) {
        chartInstance.destroy();
    }

    const coinPrices = coins.map(coin => coin.current_price);
    const coinNames = coins.map(coin => coin.name);

    chartInstance = new Chart(priceChartCtx, {
        type: 'bar',
        data: {
            labels: coinNames,
            datasets: [{
                label: 'Price (USD)',
                data: coinPrices,
                backgroundColor: 'rgba(42, 80, 106, 0.6)',
                borderColor: 'rgb(58, 112, 148)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Search functionality
coinSearch.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const rows = cryptoData.getElementsByTagName('tr');
    
    Array.from(rows).forEach(row => {
        const firstCell = row.cells[0];
        if (firstCell) {
            const name = firstCell.textContent.toLowerCase();
            row.style.display = name.includes(searchTerm) ? '' : 'none';
        }
    });
});

// Initialize the app
fetchCoinData();