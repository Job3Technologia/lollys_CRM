let allMenuItems = [];
let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
    loadMenuItems();
    
    // "All Items" filter
    const allBtn = document.querySelector('[data-filter="all"]');
    if(allBtn) {
        allBtn.addEventListener('click', () => {
            currentFilter = 'all';
            filterAndDisplay();
            updateActiveFilter(allBtn);
        });
    }

    // Search functionality
    const searchInput = document.getElementById('menu-search');
    if(searchInput) {
        searchInput.addEventListener('input', (e) => {
            filterAndDisplay(e.target.value.toLowerCase());
        });
    }
});

const MOCK_CATEGORIES = [
    { id: 1, name: 'Daily Special Meals' },
    { id: 2, name: 'Weekly Daily Specials' },
    { id: 3, name: 'Breakfast' },
    { id: 4, name: 'Gwinya Combos' },
    { id: 5, name: 'Zulu Burger Combos' },
    { id: 6, name: 'Kota Menu' },
    { id: 7, name: 'Wings' },
    { id: 8, name: 'Fried Chips' },
    { id: 9, name: 'Rolls' }
];

async function loadCategories() {
    try {
        let categories = await api.get('/menu/categories');
        
        if (!Array.isArray(categories) || categories.length === 0) {
             categories = MOCK_CATEGORIES;
        }

        const container = document.getElementById('category-filters');
        
        container.innerHTML = '';
        
        categories.forEach(cat => {
            const btn = document.createElement('button');
            btn.className = 'btn btn-secondary';
            btn.textContent = cat.name;
            btn.style.borderRadius = '30px';
            btn.style.padding = '10px 25px';
            btn.onclick = (e) => {
                currentFilter = cat.id;
                filterAndDisplay();
                updateActiveFilter(e.target);
            };
            container.appendChild(btn);
        });
    } catch (error) {
        console.warn('Error loading categories, using mock:', error);
        // Fallback to mock
        const container = document.getElementById('category-filters');
        container.innerHTML = '';
        MOCK_CATEGORIES.forEach(cat => {
            const btn = document.createElement('button');
            btn.className = 'btn btn-secondary';
            btn.textContent = cat.name;
            btn.style.borderRadius = '30px';
            btn.style.padding = '10px 25px';
            btn.onclick = (e) => {
                currentFilter = cat.id;
                filterAndDisplay();
                updateActiveFilter(e.target);
            };
            container.appendChild(btn);
        });
    }
}

const MOCK_MENU = [
    // Daily Special Meals (Category 1)
    { id: 1, category_id: 1, category_name: 'Daily Special Meals', name: 'Beef Curry', price: 81.00, description: 'Tender beef slow-cooked in aromatic spices', special_badge: 'Popular', is_available: true, image_url: 'images/beef_curry.jpg' },
    { id: 2, category_id: 1, category_name: 'Daily Special Meals', name: 'Chicken Curry', price: 81.00, description: 'Succulent chicken in a rich, spicy gravy', special_badge: null, is_available: true, image_url: 'images/chicken_curry.jpg' },
    
    // Weekly Daily Specials (Category 2)
    { id: 3, category_id: 2, category_name: 'Weekly Daily Specials', name: 'Monday Special: Mutton Curry', price: 88.00, description: 'Traditional mutton curry (Monday Only)', special_badge: 'Mon Special', is_available: true },
    { id: 4, category_id: 2, category_name: 'Weekly Daily Specials', name: 'Tuesday Special: Chicken Biryani', price: 81.00, description: 'Fragrant basmati rice with spiced chicken (Tuesday Only)', special_badge: 'Tue Special', is_available: true },
    { id: 5, category_id: 2, category_name: 'Weekly Daily Specials', name: 'Wednesday Special: Umgxabhiso', price: 81.00, description: 'Traditional tripe served with steam bread or pap (Wednesday Only)', special_badge: 'Wed Special', is_available: true },
    { id: 6, category_id: 2, category_name: 'Weekly Daily Specials', name: 'Thursday Special: Isitambu', price: 81.00, description: 'Samp and beans with meat stew (Thursday Only)', special_badge: 'Thu Special', is_available: true },

    // Breakfast (Category 3)
    { id: 7, category_id: 3, category_name: 'Breakfast', name: 'Classic Breakfast', price: 80.00, description: 'Eggs, bacon, toast, and grilled tomato', special_badge: 'Morning Only', is_available: true },

    // Gwinya Combos (Category 4)
    { id: 8, category_id: 4, category_name: 'Gwinya Combos', name: 'Gwinya Vetkoek Combo', price: 7.00, description: 'Freshly fried traditional vetkoek', special_badge: null, is_available: true },
    { id: 9, category_id: 4, category_name: 'Gwinya and Polony Combo', price: 10.00, description: 'Vetkoek filled with polony slices', special_badge: null, is_available: true },
    { id: 10, category_id: 4, category_name: 'Gwinya and Cheese Combo', price: 12.00, description: 'Vetkoek filled with cheddar cheese', special_badge: null, is_available: true },
    { id: 11, category_id: 4, category_name: 'Gwinya, Polony and Cheese Combo', price: 15.00, description: 'The ultimate breakfast mix', special_badge: 'Value', is_available: true },
    { id: 12, category_id: 4, category_name: 'Gwinya and Fried Chips Small Combo', price: 34.00, description: 'Vetkoek served with a side of small chips', special_badge: null, is_available: true },

    // Zulu Burger Combos (Category 5)
    { id: 13, category_id: 5, category_name: 'Zulu Burger Combos', name: 'Zulu Burger Combo', price: 22.00, description: 'Traditional seasoned patty on a fresh bun', special_badge: null, is_available: true },
    { id: 14, category_id: 5, category_name: 'Zulu Burger Combos', name: 'Zulu Burger with Polony Combo', price: 25.00, description: 'Zulu burger topped with polony', special_badge: null, is_available: true },
    { id: 15, category_id: 5, category_name: 'Zulu Burger with Cheese and Polony Combo', price: 30.00, description: 'Fully loaded Zulu burger with cheese and polony', special_badge: 'Tasty', is_available: true },

    // Kota Menu (Category 6)
    { id: 16, category_id: 6, category_name: 'Kota Menu', name: 'Kota 1', price: 37.00, description: 'Standard Kota with chips and polony', special_badge: null, is_available: true },
    { id: 17, category_id: 6, category_name: 'Kota Menu', name: 'Kota 2', price: 37.00, description: 'Kota with chips and vienna', special_badge: null, is_available: true },
    { id: 18, category_id: 6, category_name: 'Kota Menu', name: 'Kota 3', price: 44.00, description: 'Kota with chips, polony and cheese', special_badge: null, is_available: true },
    { id: 19, category_id: 6, category_name: 'Kota Menu', name: 'Kota 4', price: 59.00, description: 'Kota with chips, russian, cheese and egg', special_badge: 'Hungry?', is_available: true },
    { id: 20, category_id: 6, category_name: 'Kota Menu', name: 'Kota 5', price: 59.00, description: 'Kota with chips, beef patty, cheese and egg', special_badge: null, is_available: true },
    { id: 21, category_id: 6, category_name: 'Kota Menu', name: 'Last Number Kota', price: 81.00, description: 'The Legend: Fully loaded with everything', special_badge: 'Best Seller', is_available: true, image_url: 'images/last_number_kota.jpg' },

    // Wings (Category 7)
    { id: 22, category_id: 7, category_name: 'Wings', name: 'Fried Wings', price: 206.00, description: 'Platter of crispy fried wings', special_badge: 'Shareable', is_available: true },
    { id: 23, category_id: 7, category_name: 'Wings', name: 'Wings and Chips', price: 66.00, description: '6 Wings served with crispy chips', special_badge: null, is_available: true },

    // Fried Chips (Category 8)
    { id: 24, category_id: 8, category_name: 'Fried Chips', name: 'Fried Chips', price: 21.00, description: 'Golden crispy potato chips', special_badge: null, is_available: true },

    // Rolls (Category 9)
    { id: 25, category_id: 9, category_name: 'Rolls', name: 'Cheese Russian Roll', price: 44.00, description: 'Fresh roll with russian sausage and melted cheese', special_badge: null, is_available: true }
];

async function loadMenuItems() {
    try {
        // Try to fetch from API first
        allMenuItems = await api.get('/menu');
        
        // Use Mock Data if API returns empty or fails (for demo purposes)
        if (!Array.isArray(allMenuItems) || allMenuItems.length === 0) {
            console.warn('API returned empty or invalid data, using mock data for demo.');
            allMenuItems = MOCK_MENU;
        }
        
        filterAndDisplay();
    } catch (error) {
        console.warn('API fetch failed, using mock data for demo:', error);
        allMenuItems = MOCK_MENU;
        filterAndDisplay();
    }
}

function updateActiveFilter(activeBtn) {
    document.querySelectorAll('.menu-filters .btn').forEach(btn => btn.classList.remove('active'));
    activeBtn.classList.add('active');
}

function filterAndDisplay(searchTerm = '') {
    const content = document.getElementById('menu-content');
    content.innerHTML = ''; // Clear content
    
    let filtered = allMenuItems;

    // Filter logic
    if (currentFilter !== 'all') {
        filtered = filtered.filter(item => item.category_id === currentFilter);
    }
    if (searchTerm) {
        filtered = filtered.filter(item => 
            item.name.toLowerCase().includes(searchTerm) || 
            (item.description && item.description.toLowerCase().includes(searchTerm))
        );
    }
    
    // Empty state
    if (filtered.length === 0) {
        content.innerHTML = `
            <div style="text-align: center; padding: 50px;">
                <i class="fas fa-search" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 20px;"></i>
                <h3 style="color: var(--text-muted);">No items found</h3>
                <p>Try adjusting your search or filter.</p>
            </div>`;
        return;
    }

    // Display Logic: Grouped vs Flat
    // If "All" is selected and no search term, show categorized sections
    if (currentFilter === 'all' && !searchTerm) {
        // Get unique categories present in filtered items
        const categoriesInItems = [...new Set(filtered.map(item => item.category_id))];
        // Sort categories by display order if we had that info, but here we just iterate
        // Ideally we should use the loaded categories list to ensure order
        
        // Fetch loaded categories again or rely on DOM/cache? 
        // Let's assume we can match IDs.
        // We'll just group by category ID.
        
        categoriesInItems.forEach(catId => {
            const catItems = filtered.filter(i => i.category_id === catId);
            const catName = catItems[0].category_name || 'Category'; // Backend sends category_name
            
            const section = document.createElement('div');
            section.className = 'menu-section';
            section.style.marginBottom = '60px';
            section.innerHTML = `
                <h2 style="margin-bottom: 30px; font-size: 1.8rem; border-left: 5px solid var(--accent-orange); padding-left: 15px;">${catName}</h2>
                <div class="menu-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 30px;">
                    ${catItems.map(item => createCardHTML(item)).join('')}
                </div>
            `;
            content.appendChild(section);
        });
    } else {
        // Flat grid for specific category or search results
        const grid = document.createElement('div');
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(300px, 1fr))';
        grid.style.gap = '30px';
        grid.innerHTML = filtered.map(item => createCardHTML(item)).join('');
        content.appendChild(grid);
    }
    
    // Re-run reveal animations
    if (window.reveal) reveal();
}

function createCardHTML(item) {
    const isSoldOut = !item.is_available;
    // Image placeholder logic
    const imageSrc = item.image_url || 'https://via.placeholder.com/400x300?text=Lollys';
    
    return `
        <div class="card food-card ${isSoldOut ? 'sold-out' : ''}" data-reveal style="position: relative; overflow: hidden; transition: transform 0.3s, box-shadow 0.3s;">
            ${item.special_badge ? `<span class="badge badge-popular" style="position: absolute; top: 15px; right: 15px; z-index: 10; background: var(--accent-orange); color: white; padding: 5px 15px; border-radius: 20px; font-weight: 700; font-size: 0.8rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">${item.special_badge}</span>` : ''}
            ${isSoldOut ? `<div class="sold-out-overlay"><span>SOLD OUT</span></div>` : ''}
            
            <div class="img-container" style="height: 220px; overflow: hidden; border-radius: 16px;">
                <img src="${imageSrc}" onerror="this.src='https://placehold.co/400x300?text=Lollys+Food'" alt="${item.name}" loading="lazy" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s;">
            </div>
            
            <div class="food-info" style="padding: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                    <h3 style="margin: 0; font-size: 1.1rem; font-weight: 700;">${item.name}</h3>
                    <span class="price-tag" style="font-size: 1.1rem; color: var(--accent-orange); font-weight: 800;">R${parseFloat(item.price).toFixed(2)}</span>
                </div>
                <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 20px; min-height: 40px; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${item.description || ''}</p>
                
                <div class="card-actions" style="display: flex; gap: 10px; align-items: center;">
                    <div class="quantity-selector" style="display: flex; align-items: center; background: #f3f4f6; border-radius: 8px; padding: 5px;">
                        <button onclick="adjustQty(this, -1)" style="border: none; background: none; padding: 5px 10px; cursor: pointer; color: var(--text-dark); font-weight: bold;">-</button>
                        <input type="number" value="1" min="1" max="10" style="width: 30px; text-align: center; border: none; background: none; font-weight: 600;" readonly>
                        <button onclick="adjustQty(this, 1)" style="border: none; background: none; padding: 5px 10px; cursor: pointer; color: var(--text-dark); font-weight: bold;">+</button>
                    </div>
                    <button class="btn btn-primary quick-add-btn" style="flex: 1; display: flex; justify-content: center; align-items: center; gap: 8px; font-size: 0.9rem;" 
                            onclick="addToCartWithQty(this, ${item.id}, '${item.name}', ${item.price})" ${isSoldOut ? 'disabled' : ''}>
                        <i class="fas fa-shopping-bag"></i> ${isSoldOut ? 'Unavailable' : 'Add'}
                    </button>
                </div>
            </div>
        </div>
    `;
}

function adjustQty(btn, change) {
    const input = btn.parentElement.querySelector('input');
    let newVal = parseInt(input.value) + change;
    if (newVal < 1) newVal = 1;
    if (newVal > 10) newVal = 10;
    input.value = newVal;
}

function addToCartWithQty(btn, id, name, price) {
    const qty = parseInt(btn.parentElement.querySelector('input').value);
    // Call updated addToCart from cart.js which supports quantity
    if (typeof addToCart === 'function') {
        addToCart(id, name, price, qty);
    } else {
        console.error('addToCart function not found');
    }
}
