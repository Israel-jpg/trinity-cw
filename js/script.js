document.addEventListener('DOMContentLoaded', function () {
  const API_BASE_URL = 'https://trinity-cw-backend.onrender.com';

  // =========================
  // HELPERS
  // =========================
  function getAuthHeaders() {
    return {
      Authorization: `Bearer ${localStorage.getItem('adminToken')}`
    };
  }

  async function authFetch(url, options = {}) {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        ...getAuthHeaders()
      }
    });

    if (response.status === 401) {
      localStorage.removeItem('adminToken');
      window.location.href = 'login.html';
      throw new Error('Session expired. Please log in again.');
    }

    return response;
  }

  function capitalizeWords(text) {
    if (!text) return '';
    return text
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  function formatPrice(price) {
    return `₦${Number(price).toLocaleString()}`;
  }

  function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function getImageUrl(imagePath) {
    if (!imagePath) return '';
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;
    if (imagePath.startsWith('/uploads/')) return `http://localhost:5000${imagePath}`;
    return imagePath;
  }

  function formatFeatures(text) {
    if (!text) return '';

    const items = text
      .split('\n')
      .map(item => item.replace(/^[-•]\s*/, '').trim())
      .filter(item => item.length > 0);

    return `
      <ul class="property-features">
        ${items.map(item => `<li>${item}</li>`).join('')}
      </ul>
    `;
  }

  function createPropertyCard(property, addReveal = false) {
    const propertyId = property._id || property.id;
    const primaryImageRaw = property.image || (property.images && property.images[0]) || '';
    const primaryImage = getImageUrl(primaryImageRaw);
    const listingValue = (property.listing || '').toLowerCase();
    const typeValue = (property.type || '').toLowerCase();

    let listingText = 'PROPERTY';
    if (listingValue === 'sale') listingText = 'FOR SALE';
    if (listingValue === 'rent') listingText = 'FOR RENT';
    if (listingValue === 'shortlet') listingText = 'SHORTLET';
    if (listingValue === 'joint venture') listingText = 'JOINT VENTURE';
    if (listingValue === 'bush clearing') listingText = 'BUSH CLEARING';
    if (listingValue === 'survey sponsorship') listingText = 'SURVEY SPONSORSHIP';

    const detailsText = typeValue === 'land'
      ? `${escapeHtml(property.size || 'Land Listing')}`
      : `${property.bedrooms || 0} Beds • ${property.bathrooms || 0} Baths • ${escapeHtml(property.size || '')}`;

    return `
      <a href="property.html?id=${escapeHtml(propertyId)}" class="property-card-link ${addReveal ? 'reveal' : ''}"
        data-id="${escapeHtml(propertyId)}"
        data-name="${escapeHtml(property.name)}"
        data-location="${escapeHtml(property.location)}"
        data-listing="${escapeHtml(property.listing)}"
        data-type="${escapeHtml(property.type)}"
        data-price="${escapeHtml(property.price)}"
        data-bedrooms="${escapeHtml(property.bedrooms)}"
        data-bathrooms="${escapeHtml(property.bathrooms)}"
        data-size="${escapeHtml(property.size)}"
        data-image="${escapeHtml(primaryImageRaw)}"
        data-description="${escapeHtml(property.description || '')}"
        data-parking="${escapeHtml(property.parking || '')}"
        data-interior="${escapeHtml(property.interior || '')}"
        data-exterior="${escapeHtml(property.exterior || '')}">
        <div class="property-card">
          <div class="property-image">
            <span class="property-badge ${listingValue}">
              ${listingText}
            </span>
            <img src="${primaryImage}" alt="${escapeHtml(property.name)}">
          </div>
          <div class="property-info">
            <h4>${formatPrice(property.price)}</h4>
            <p class="property-location">${escapeHtml(property.location)}</p>
            <p class="property-details">${detailsText}</p>
          </div>
        </div>
      </a>
    `;
  }

  function createSkeletonCard() {
    return `
      <div class="skeleton-card">
        <div class="skeleton-image"></div>
        <div class="skeleton-content">
          <div class="skeleton-line price"></div>
          <div class="skeleton-line location"></div>
          <div class="skeleton-line details"></div>
        </div>
      </div>
    `;
  }

  function renderSkeletons(container, count = 6) {
    if (!container) return;
    container.innerHTML = Array.from({ length: count }, () => createSkeletonCard()).join('');
  }

  // =========================
  // API
  // =========================
  async function fetchAllProperties(search = '') {
    const url = search
      ? `${API_BASE_URL}/properties?search=${encodeURIComponent(search)}`
      : `${API_BASE_URL}/properties`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch properties');
    }
    return await response.json();
  }

  async function fetchPropertyById(id) {
    const response = await fetch(`${API_BASE_URL}/properties/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch property');
    }
    return await response.json();
  }

  async function fetchAllInquiries() {
    const response = await authFetch(`${API_BASE_URL}/inquiries`);

    if (!response.ok) {
      throw new Error('Failed to fetch inquiries');
    }

    return await response.json();
  }

  // =========================
  // REVEAL ON SCROLL
  // =========================
  function initRevealAnimation() {
    const revealElements = document.querySelectorAll('.reveal');
    if (!revealElements.length) return;

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('active');
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px'
      }
    );

    revealElements.forEach(element => observer.observe(element));
  }

  // =========================
  // DOM REFERENCES
  // =========================
  const menuToggle = document.getElementById('menuToggle');
  const navMenu = document.getElementById('navMenu');
  const menuOverlay = document.getElementById('menuOverlay');

  const homeSearch = document.getElementById('homeSearch');
  const homeSearchBtn = document.getElementById('homeSearchBtn');

  const filterBtn = document.querySelector('.filter-btn');
  const filterPopup = document.getElementById('filterPopup');
  const closeFilter = document.getElementById('closeFilter');

  const searchInput = document.getElementById('propertySearch');
  const resultsCount = document.getElementById('resultsCount');
  const minPriceInput = document.getElementById('minPrice');
  const maxPriceInput = document.getElementById('maxPrice');
  const sortBy = document.getElementById('sortBy');
  const applyBtn = document.getElementById('applyFilters');
  const resetBtn = document.getElementById('resetFilters');
  const propertiesGrid = document.querySelector('.properties-grid-page');
  const noResultsMessage = document.getElementById('noResultsMessage');

  const contactForm = document.querySelector('.contact-form');
  const contactFormMessage = document.getElementById('contactFormMessage');

  const adminPropertyForm = document.getElementById('adminPropertyForm');
  const adminFormMessage = document.getElementById('adminFormMessage');
  const adminPropertiesList = document.getElementById('adminPropertiesList');
  const adminInquiriesList = document.getElementById('adminInquiriesList');

  const imageInput = document.getElementById('image');
  const imagePreviewWrap = document.getElementById('imagePreviewWrap');

  const editModal = document.getElementById('editModal');
  const closeEditModalBtn = document.getElementById('closeEditModal');
  const cancelEditModalBtn = document.getElementById('cancelEditModal');
  const editModalBackdrop = document.getElementById('editModalBackdrop');
  const editPropertyForm = document.getElementById('editPropertyForm');
  const editFormMessage = document.getElementById('editFormMessage');
  const editImageInput = document.getElementById('editImage');
  const editImagePreviewWrap = document.getElementById('editImagePreviewWrap');

  const loginForm = document.getElementById('loginForm');
  const loginMessage = document.getElementById('loginMessage');

  const adminSearchInput = document.getElementById('propertySearch');
  const adminSearchBtn = document.getElementById('searchBtn');

  const logoutBtn = document.getElementById('logoutBtn');
  const token = localStorage.getItem('adminToken');

  const imageLightbox = document.getElementById('imageLightbox');
  const imageLightboxOverlay = document.getElementById('imageLightboxOverlay');
  const closeLightboxBtn = document.getElementById('closeLightbox');
  const lightboxImage = document.getElementById('lightboxImage');

  const typeSelect = document.getElementById('type');
  const bedroomsGroup = document.getElementById('bedroomsGroup');
  const bathroomsGroup = document.getElementById('bathroomsGroup');
  const bedroomsInput = document.getElementById('bedrooms');
  const bathroomsInput = document.getElementById('bathrooms');

  const editTypeSelect = document.getElementById('editType');
  const editBedroomsGroup = document.getElementById('editBedroomsGroup');
  const editBathroomsGroup = document.getElementById('editBathroomsGroup');
  const editBedroomsInput = document.getElementById('editBedrooms');
  const editBathroomsInput = document.getElementById('editBathrooms');

  let propertyCards = document.querySelectorAll('.property-card-link');

  // =========================
  // LAND FIELD TOGGLES
  // =========================
  function toggleLandFields() {
    if (!typeSelect) return;

    const isLand = typeSelect.value === 'land';

    if (bedroomsGroup) {
      bedroomsGroup.style.display = isLand ? 'none' : 'block';
    }

    if (bathroomsGroup) {
      bathroomsGroup.style.display = isLand ? 'none' : 'block';
    }

    if (isLand) {
      if (bedroomsInput) bedroomsInput.value = '';
      if (bathroomsInput) bathroomsInput.value = '';
    }
  }

  function toggleEditLandFields() {
    if (!editTypeSelect) return;

    const isLand = editTypeSelect.value === 'land';

    if (editBedroomsGroup) {
      editBedroomsGroup.style.display = isLand ? 'none' : 'block';
    }

    if (editBathroomsGroup) {
      editBathroomsGroup.style.display = isLand ? 'none' : 'block';
    }

    if (isLand) {
      if (editBedroomsInput) editBedroomsInput.value = '';
      if (editBathroomsInput) editBathroomsInput.value = '';
    }
  }

  // =========================
  // RENDER PROPERTIES
  // =========================
  async function renderFeaturedProperties() {
    const featuredGrid = document.getElementById('featuredPropertiesGrid');
    if (!featuredGrid) return;

    renderSkeletons(featuredGrid, 3);

    try {
      const properties = await fetchAllProperties();
      const featuredProperties = properties.filter(property => property.featured);

      featuredGrid.innerHTML = featuredProperties
        .map(property => createPropertyCard(property, true))
        .join('');

      initRevealAnimation();
    } catch (error) {
      console.error('Error loading featured properties:', error);
      featuredGrid.innerHTML = '<p>Unable to load featured properties.</p>';
    }
  }

  async function renderAllProperties() {
    const propertiesGridPage = document.getElementById('propertiesGridPage');
    if (!propertiesGridPage) return;

    renderSkeletons(propertiesGridPage, 6);

    try {
      const properties = await fetchAllProperties();

      propertiesGridPage.innerHTML = properties
        .map(property => createPropertyCard(property, true))
        .join('');

      attachCardSaveFallback();
      filterProperties();
      initRevealAnimation();
    } catch (error) {
      console.error('Error loading properties:', error);
      propertiesGridPage.innerHTML = '<p>Unable to load properties.</p>';
    }
  }

  async function renderAdminProperties(search = '') {
    if (!adminPropertiesList) return;

    try {
      const properties = await fetchAllProperties(search);

      if (!properties.length) {
        adminPropertiesList.innerHTML = '<p>No properties found.</p>';
        return;
      }

      adminPropertiesList.innerHTML = properties.map(property => {
        const imageSrc = getImageUrl(property.image || (property.images && property.images[0]) || '');
        const metaText = (property.type || '').toLowerCase() === 'land'
          ? `${formatPrice(property.price)} • ${capitalizeWords(property.type)}`
          : `${formatPrice(property.price)} • ${capitalizeWords(property.type)} • ${capitalizeWords(property.listing)}`;

        return `
          <div class="admin-property-item">
            <div class="admin-property-thumb">
              <img src="${imageSrc}" alt="${escapeHtml(property.name)}">
            </div>

            <div class="admin-property-info">
              <h4>${escapeHtml(property.name)}</h4>
              <p>${escapeHtml(property.location)}</p>
              <p>${metaText}</p>

              <div class="admin-property-actions">
                <button class="admin-btn edit" data-id="${property._id}">Edit</button>
                <button class="admin-btn delete" data-id="${property._id}">Delete</button>
              </div>
            </div>
          </div>
        `;
      }).join('');

      attachDeleteHandlers();
      attachEditHandlers(properties);
    } catch (error) {
      console.error('Error loading admin properties:', error);
      adminPropertiesList.innerHTML = '<p>Unable to load properties.</p>';
    }
  }

  async function renderAdminInquiries() {
    if (!adminInquiriesList) return;

    try {
      const inquiries = await fetchAllInquiries();

      if (!inquiries.length) {
        adminInquiriesList.innerHTML = '<p>No inquiries yet.</p>';
        return;
      }

      adminInquiriesList.innerHTML = inquiries.map(inquiry => `
        <div class="admin-inquiry-item">
          <div class="admin-inquiry-top">
            <div>
              <h4>${escapeHtml(inquiry.fullName)}</h4>
              <p class="admin-inquiry-meta">
                ${escapeHtml(inquiry.emailAddress)}
                ${inquiry.phoneNumber ? ` • ${escapeHtml(inquiry.phoneNumber)}` : ''}
              </p>
            </div>

            <p class="admin-inquiry-meta">
              ${new Date(inquiry.createdAt).toLocaleString()}
            </p>
          </div>

          <div class="admin-inquiry-message">${escapeHtml(inquiry.message)}</div>

          <div class="admin-inquiry-actions">
            <button class="admin-btn delete inquiry-delete-btn" data-id="${inquiry._id}">
              Delete
            </button>
          </div>
        </div>
      `).join('');

      attachDeleteInquiryHandlers();
    } catch (error) {
      console.error('Error loading inquiries:', error);
      adminInquiriesList.innerHTML = '<p>Unable to load inquiries.</p>';
    }
  }

  // =========================
  // MOBILE MENU
  // =========================
  if (menuToggle && navMenu && menuOverlay) {
    menuToggle.addEventListener('click', function () {
      navMenu.classList.toggle('active');
      menuOverlay.classList.toggle('active');
    });

    menuOverlay.addEventListener('click', function () {
      navMenu.classList.remove('active');
      menuOverlay.classList.remove('active');
    });
  }

  // =========================
  // HOMEPAGE SEARCH → REDIRECT
  // =========================
  function goToSearch() {
    if (!homeSearch) return;

    const value = homeSearch.value.trim();

    if (value) {
      window.location.href = `properties.html?search=${encodeURIComponent(value)}`;
    } else {
      window.location.href = 'properties.html';
    }
  }

  if (homeSearchBtn) {
    homeSearchBtn.addEventListener('click', goToSearch);
  }

  if (homeSearch) {
    homeSearch.addEventListener('keypress', function (e) {
      if (e.key === 'Enter') {
        goToSearch();
      }
    });
  }

  // =========================
  // FILTER POPUP
  // =========================
  if (filterBtn && filterPopup) {
    filterBtn.addEventListener('click', function () {
      filterPopup.classList.add('active');
      if (menuOverlay) menuOverlay.classList.add('active');
    });
  }

  if (closeFilter && filterPopup) {
    closeFilter.addEventListener('click', function () {
      filterPopup.classList.remove('active');
      if (menuOverlay) menuOverlay.classList.remove('active');
    });
  }

  if (menuOverlay && filterPopup) {
    menuOverlay.addEventListener('click', function () {
      filterPopup.classList.remove('active');
    });
  }

  // =========================
  // PROPERTIES PAGE LOGIC
  // =========================
  let filters = {
    listing: null,
    type: null,
    bedrooms: null,
    minPrice: null,
    maxPrice: null
  };

  const singleSelectGroups = document.querySelectorAll('.single-select');

  singleSelectGroups.forEach(group => {
    const buttons = group.querySelectorAll('button');
    const filterKey = group.dataset.filterGroup;

    buttons.forEach(button => {
      button.addEventListener('click', function () {
        if (button.classList.contains('active')) {
          button.classList.remove('active');
          filters[filterKey] = null;
        } else {
          buttons.forEach(btn => btn.classList.remove('active'));
          button.classList.add('active');
          filters[filterKey] = button.dataset.value;
        }

        filterProperties();
      });
    });
  });

  function filterProperties() {
    propertyCards = document.querySelectorAll('.property-card-link');

    if (!propertyCards.length) {
      if (resultsCount) {
        resultsCount.textContent = 'Showing 0 properties';
      }
      return;
    }

    const searchValue = searchInput ? searchInput.value.toLowerCase().trim() : '';

    filters.minPrice = minPriceInput ? minPriceInput.value.trim() : '';
    filters.maxPrice = maxPriceInput ? maxPriceInput.value.trim() : '';

    let visibleCount = 0;
    let visibleProperties = [];

    propertyCards.forEach(property => {
      const name = (property.dataset.name || '').toLowerCase();
      const location = (property.dataset.location || '').toLowerCase();
      const listing = property.dataset.listing || '';
      const type = property.dataset.type || '';
      const price = parseInt(property.dataset.price, 10) || 0;
      const bedrooms = parseInt(property.dataset.bedrooms, 10) || 0;

      let show = true;

      if (searchValue && !name.includes(searchValue) && !location.includes(searchValue)) {
        show = false;
      }

      if (filters.listing && listing !== filters.listing) {
        show = false;
      }

      if (filters.type && type !== filters.type) {
        show = false;
      }

      if (filters.bedrooms && type !== 'land' && bedrooms < parseInt(filters.bedrooms, 10)) {
        show = false;
      }

      if (filters.minPrice && price < parseInt(filters.minPrice, 10)) {
        show = false;
      }

      if (filters.maxPrice && price > parseInt(filters.maxPrice, 10)) {
        show = false;
      }

      if (show) {
        property.style.display = 'block';
        visibleCount++;
        visibleProperties.push(property);
      } else {
        property.style.display = 'none';
      }
    });

    if (sortBy && propertiesGrid) {
      const sortValue = sortBy.value;

      if (sortValue === 'price-asc') {
        visibleProperties.sort((a, b) => {
          return (parseInt(a.dataset.price, 10) || 0) - (parseInt(b.dataset.price, 10) || 0);
        });
      } else if (sortValue === 'price-desc') {
        visibleProperties.sort((a, b) => {
          return (parseInt(b.dataset.price, 10) || 0) - (parseInt(a.dataset.price, 10) || 0);
        });
      }

      visibleProperties.forEach(property => {
        propertiesGrid.appendChild(property);
      });
    }

    if (resultsCount) {
      resultsCount.textContent = `Showing ${visibleCount} propert${visibleCount === 1 ? 'y' : 'ies'}`;
    }

    if (noResultsMessage) {
      noResultsMessage.style.display = visibleCount === 0 ? 'block' : 'none';
    }

    initRevealAnimation();
  }

  // =========================
  // LOAD SEARCH FROM URL
  // =========================
  const urlParams = new URLSearchParams(window.location.search);
  const searchFromURL = urlParams.get('search');

  if (searchFromURL && searchInput) {
    searchInput.value = searchFromURL;
  }

  // =========================
  // LIGHTBOX
  // =========================
  function openImageLightbox(imageSrc, imageAlt = 'Full property image') {
    if (!imageLightbox || !lightboxImage) return;

    lightboxImage.src = imageSrc;
    lightboxImage.alt = imageAlt;
    imageLightbox.classList.add('active');
    document.body.classList.add('lightbox-open');
  }

  function closeImageLightbox() {
    if (!imageLightbox || !lightboxImage) return;

    imageLightbox.classList.remove('active');
    document.body.classList.remove('lightbox-open');
    lightboxImage.src = '';
  }

  // =========================
  // PROPERTY SLIDER
  // =========================
  function setupPropertySlider(property) {
    const rawImages = Array.isArray(property.images) && property.images.length
      ? property.images
      : [property.image].filter(Boolean);

    const propertyImages = rawImages.map(getImageUrl);

    const mainImage = document.getElementById('propertyImage');
    const imageCounter = document.getElementById('imageCounter');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const thumbnailsContainer = document.querySelector('.slider-thumbnails');
    const imageBox = document.querySelector('.property-main-image');

    let currentImageIndex = 0;
    const visibleThumbCount = 3;

    function getVisibleThumbnailIndexes() {
      const total = propertyImages.length;

      if (total <= visibleThumbCount) {
        return Array.from({ length: total }, (_, i) => i);
      }

      let start = currentImageIndex - 1;

      if (start < 0) start = 0;
      if (start + visibleThumbCount > total) {
        start = total - visibleThumbCount;
      }

      return Array.from({ length: visibleThumbCount }, (_, i) => start + i);
    }

    function renderThumbnails() {
      if (!thumbnailsContainer) return;

      const visibleIndexes = getVisibleThumbnailIndexes();

      thumbnailsContainer.innerHTML = visibleIndexes.map(index => {
        const img = propertyImages[index];
        return `
          <img
            src="${img}"
            alt="${escapeHtml(property.name)} thumbnail ${index + 1}"
            class="thumbnail ${index === currentImageIndex ? 'active-thumb' : ''}"
            data-index="${index}"
          >
        `;
      }).join('');

      const thumbnails = thumbnailsContainer.querySelectorAll('.thumbnail');
      thumbnails.forEach(thumb => {
        thumb.addEventListener('click', function () {
          currentImageIndex = parseInt(this.dataset.index, 10);
          updateSlider();
        });
      });
    }

    function updateSlider() {
      if (!mainImage || !propertyImages.length) return;

      mainImage.src = propertyImages[currentImageIndex];
      mainImage.alt = `${property.name} image ${currentImageIndex + 1}`;

      mainImage.onclick = function () {
        openImageLightbox(
          propertyImages[currentImageIndex],
          `${property.name} image ${currentImageIndex + 1}`
        );
      };

      if (imageCounter) {
        imageCounter.textContent = `${currentImageIndex + 1} / ${propertyImages.length}`;
      }

      renderThumbnails();
    }

    if (propertyImages.length) {
      updateSlider();
    }

    if (prevBtn) {
      prevBtn.style.display = propertyImages.length > 1 ? 'flex' : 'none';
      prevBtn.onclick = function () {
        currentImageIndex = (currentImageIndex - 1 + propertyImages.length) % propertyImages.length;
        updateSlider();
      };
    }

    if (nextBtn) {
      nextBtn.style.display = propertyImages.length > 1 ? 'flex' : 'none';
      nextBtn.onclick = function () {
        currentImageIndex = (currentImageIndex + 1) % propertyImages.length;
        updateSlider();
      };
    }

    let touchStartX = 0;
    let touchEndX = 0;

    function handleSwipe() {
      const swipeDistance = touchEndX - touchStartX;
      const minSwipeDistance = 50;

      if (Math.abs(swipeDistance) < minSwipeDistance) return;

      if (swipeDistance < 0) {
        currentImageIndex = (currentImageIndex + 1) % propertyImages.length;
        updateSlider();
      } else {
        currentImageIndex = (currentImageIndex - 1 + propertyImages.length) % propertyImages.length;
        updateSlider();
      }
    }

    const swipeTarget = imageBox || mainImage;

    if (swipeTarget) {
      swipeTarget.addEventListener('touchstart', function (e) {
        touchStartX = e.changedTouches[0].screenX;
      }, { passive: true });

      swipeTarget.addEventListener('touchend', function (e) {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
      }, { passive: true });
    }
  }

  // =========================
  // PROPERTY PAGE LOAD BY URL ID
  // =========================
  async function loadPropertyDetails() {
    const propertyIdFromURL = urlParams.get('id');
    if (!propertyIdFromURL) return;

    try {
      const property = await fetchPropertyById(propertyIdFromURL);

      const whatsappBtn = document.getElementById('whatsappBtn');

      if (whatsappBtn && property) {
        const message = `Hi, I’m interested in the ${property.name} in ${property.location} listed for ${formatPrice(property.price)}. Is it still available?`;
        const encodedMessage = encodeURIComponent(message);
        whatsappBtn.href = `https://wa.me/2349030106001?text=${encodedMessage}`;
      }

      const propertyTitle = document.getElementById('propertyTitle');
      const propertyLocation = document.getElementById('propertyLocation');
      const propertyPrice = document.getElementById('propertyPrice');
      const propertyDescription = document.getElementById('propertyDescription');
      const propertyBedrooms = document.getElementById('propertyBedrooms');
      const propertyBathrooms = document.getElementById('propertyBathrooms');
      const propertySize = document.getElementById('propertySize');
      const propertyType = document.getElementById('propertyType');
      const propertyListing = document.getElementById('propertyListing');
      const propertyParking = document.getElementById('propertyParking');
      const propertyInterior = document.getElementById('propertyInterior');
      const propertyExterior = document.getElementById('propertyExterior');

      const detailsBedrooms = document.getElementById('detailsBedrooms');
      const detailsBathrooms = document.getElementById('detailsBathrooms');
      const detailsFullBathrooms = document.getElementById('detailsFullBathrooms');
      const detailsType = document.getElementById('detailsType');
      const detailsListing = document.getElementById('detailsListing');
      const detailsSize = document.getElementById('detailsSize');

      const isLand = (property.type || '').toLowerCase() === 'land';

      if (propertyTitle) propertyTitle.textContent = property.name;

      if (propertyLocation) {
        propertyLocation.innerHTML = `<i class="fas fa-location-dot"></i> ${property.location}`;
      }

      if (propertyPrice) propertyPrice.textContent = formatPrice(property.price);
      if (propertyDescription) propertyDescription.innerHTML = (property.description || '').replace(/\n/g, '<br>');
      if (propertyBedrooms) propertyBedrooms.textContent = isLand ? 'N/A' : (property.bedrooms ?? '');
      if (propertyBathrooms) propertyBathrooms.textContent = isLand ? 'N/A' : (property.bathrooms ?? '');
      if (propertySize) propertySize.textContent = property.size || '';
      if (propertyType) propertyType.textContent = capitalizeWords(property.type || '');
      if (propertyListing) propertyListing.textContent = capitalizeWords(property.listing || '');
      if (propertyParking) propertyParking.textContent = property.parking || '';
      if (propertyInterior) propertyInterior.innerHTML = formatFeatures(property.interior);
      if (propertyExterior) propertyExterior.innerHTML = formatFeatures(property.exterior);

      if (detailsBedrooms) detailsBedrooms.textContent = isLand ? 'N/A' : (property.bedrooms ?? '');
      if (detailsBathrooms) detailsBathrooms.textContent = isLand ? 'N/A' : (property.bathrooms ?? '');
      if (detailsFullBathrooms) detailsFullBathrooms.textContent = isLand ? 'N/A' : (property.bathrooms ?? '');
      if (detailsType) detailsType.textContent = capitalizeWords(property.type || '');
      if (detailsListing) detailsListing.textContent = capitalizeWords(property.listing || '');
      if (detailsSize) detailsSize.textContent = property.size || '';

      setupPropertySlider(property);
    } catch (error) {
      console.error('Error loading property details:', error);
    }
  }

  // =========================
  // SAVE CLICKED PROPERTY (OPTIONAL FALLBACK)
  // =========================
  function attachCardSaveFallback() {
    propertyCards = document.querySelectorAll('.property-card-link');

    propertyCards.forEach(card => {
      card.addEventListener('click', function () {
        const propertyData = {
          id: this.dataset.id || '',
          name: this.dataset.name || '',
          location: this.dataset.location || '',
          listing: this.dataset.listing || '',
          type: this.dataset.type || '',
          price: this.dataset.price || '',
          bedrooms: this.dataset.bedrooms || '',
          bathrooms: this.dataset.bathrooms || '',
          size: this.dataset.size || '',
          image: this.dataset.image || '',
          description: this.dataset.description || '',
          parking: this.dataset.parking || '',
          interior: this.dataset.interior || '',
          exterior: this.dataset.exterior || ''
        };

        localStorage.setItem('selectedProperty', JSON.stringify(propertyData));
      });
    });
  }

  // =========================
  // IMAGE PREVIEW
  // =========================
  function renderImagePreview(files) {
    if (!imagePreviewWrap) return;

    if (!files || !files.length) {
      imagePreviewWrap.innerHTML = '<p class="image-preview-empty">No images selected yet.</p>';
      return;
    }

    imagePreviewWrap.innerHTML = '';

    Array.from(files).forEach((file, index) => {
      const reader = new FileReader();

      reader.onload = function (e) {
        const previewItem = document.createElement('div');
        previewItem.className = 'image-preview-item';

        previewItem.innerHTML = `
          <img src="${e.target.result}" alt="Preview ${index + 1}">
          ${index === 0 ? '<span class="image-preview-badge">Main Image</span>' : ''}
        `;

        imagePreviewWrap.appendChild(previewItem);
      };

      reader.readAsDataURL(file);
    });
  }

  function renderEditImagePreview(files) {
    if (!editImagePreviewWrap) return;

    if (!files || !files.length) {
      editImagePreviewWrap.innerHTML = '<p class="image-preview-empty">No new images selected.</p>';
      return;
    }

    editImagePreviewWrap.innerHTML = '';

    Array.from(files).forEach((file, index) => {
      const reader = new FileReader();

      reader.onload = function (e) {
        const previewItem = document.createElement('div');
        previewItem.className = 'image-preview-item';

        previewItem.innerHTML = `
          <img src="${e.target.result}" alt="Preview ${index + 1}">
          ${index === 0 ? '<span class="image-preview-badge">Main Image</span>' : ''}
        `;

        editImagePreviewWrap.appendChild(previewItem);
      };

      reader.readAsDataURL(file);
    });
  }

  function renderEditExistingImagePreview(imagePaths) {
    if (!editImagePreviewWrap) return;

    if (!imagePaths || !imagePaths.length) {
      editImagePreviewWrap.innerHTML = '<p class="image-preview-empty">No images available.</p>';
      return;
    }

    editImagePreviewWrap.innerHTML = '';

    imagePaths.forEach((imgPath, index) => {
      const previewItem = document.createElement('div');
      previewItem.className = 'image-preview-item';

      previewItem.innerHTML = `
        <img src="${getImageUrl(imgPath)}" alt="Existing image ${index + 1}">
        ${index === 0 ? '<span class="image-preview-badge">Main Image</span>' : ''}
      `;

      editImagePreviewWrap.appendChild(previewItem);
    });
  }

  if (imageInput) {
    renderImagePreview(imageInput.files);
    imageInput.addEventListener('change', function () {
      renderImagePreview(this.files);
    });
  }

  if (editImageInput) {
    renderEditImagePreview(editImageInput.files);
    editImageInput.addEventListener('change', function () {
      renderEditImagePreview(this.files);
    });
  }

  // =========================
  // EDIT MODAL
  // =========================
  function openEditModal() {
    if (!editModal) return;
    editModal.classList.add('active');
    document.body.classList.add('modal-open');
  }

  function closeEditModal() {
    if (!editModal) return;
    editModal.classList.remove('active');
    document.body.classList.remove('modal-open');

    if (editPropertyForm) {
      editPropertyForm.reset();
      delete editPropertyForm.dataset.editId;
    }

    if (editFormMessage) {
      editFormMessage.textContent = '';
      editFormMessage.className = 'admin-form-message';
    }

    renderEditImagePreview([]);
    toggleEditLandFields();
  }

  if (closeEditModalBtn) {
    closeEditModalBtn.addEventListener('click', closeEditModal);
  }

  if (cancelEditModalBtn) {
    cancelEditModalBtn.addEventListener('click', closeEditModal);
  }

  if (editModalBackdrop) {
    editModalBackdrop.addEventListener('click', closeEditModal);
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && editModal && editModal.classList.contains('active')) {
      closeEditModal();
    }
  });

  if (closeLightboxBtn) {
    closeLightboxBtn.addEventListener('click', closeImageLightbox);
  }

  if (imageLightboxOverlay) {
    imageLightboxOverlay.addEventListener('click', closeImageLightbox);
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && imageLightbox && imageLightbox.classList.contains('active')) {
      closeImageLightbox();
    }
  });

  // =========================
  // ADMIN PROPERTY ACTIONS
  // =========================
  function attachEditHandlers(properties) {
    const editButtons = document.querySelectorAll('.admin-btn.edit');

    editButtons.forEach(button => {
      button.addEventListener('click', function () {
        const propertyId = this.dataset.id;
        const property = properties.find(p => p._id === propertyId);

        if (!property || !editPropertyForm) return;

        document.getElementById('editName').value = property.name || '';
        document.getElementById('editLocation').value = property.location || '';
        document.getElementById('editListing').value = property.listing || '';
        document.getElementById('editType').value = property.type || '';
        document.getElementById('editPrice').value = property.price || '';
        document.getElementById('editBedrooms').value = property.bedrooms || '';
        document.getElementById('editBathrooms').value = property.bathrooms || '';
        document.getElementById('editSize').value = property.size || '';
        document.getElementById('editDescription').value = property.description || '';
        document.getElementById('editParking').value = property.parking || '';
        document.getElementById('editInterior').value = property.interior || '';
        document.getElementById('editExterior').value = property.exterior || '';
        document.getElementById('editFeatured').checked = property.featured || false;

        const existingImages = Array.isArray(property.images) && property.images.length
          ? property.images
          : [property.image].filter(Boolean);

        renderEditExistingImagePreview(existingImages);
        editPropertyForm.dataset.editId = propertyId;
        toggleEditLandFields();

        openEditModal();
      });
    });
  }

  function attachDeleteHandlers() {
    const deleteButtons = document.querySelectorAll('.admin-btn.delete');

    deleteButtons.forEach(button => {
      button.addEventListener('click', async function () {
        const propertyId = this.dataset.id;
        const confirmed = confirm('Are you sure you want to delete this property?');

        if (!confirmed) return;

        try {
          const response = await authFetch(`${API_BASE_URL}/properties/${propertyId}`, {
            method: 'DELETE'
          });

          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.error || result.message || 'Failed to delete property');
          }

          renderAdminProperties(adminSearchInput ? adminSearchInput.value.trim() : '');
          renderFeaturedProperties();
          renderAllProperties();
        } catch (error) {
          console.error('Error deleting property:', error);
          alert(error.message || 'Something went wrong while deleting.');
        }
      });
    });
  }

  function attachDeleteInquiryHandlers() {
    const deleteButtons = document.querySelectorAll('.inquiry-delete-btn');

    deleteButtons.forEach(button => {
      button.addEventListener('click', async function () {
        const inquiryId = this.dataset.id;
        const confirmed = confirm('Are you sure you want to delete this inquiry?');

        if (!confirmed) return;

        try {
          const response = await authFetch(`${API_BASE_URL}/inquiries/${inquiryId}`, {
            method: 'DELETE'
          });

          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.message || 'Failed to delete inquiry');
          }

          renderAdminInquiries();
        } catch (error) {
          console.error('Delete inquiry error:', error);
          alert(error.message || 'Something went wrong.');
        }
      });
    });
  }

  // =========================
  // SEARCH INPUT
  // =========================
  if (searchInput && document.getElementById('propertiesGridPage')) {
    searchInput.addEventListener('input', filterProperties);
  }

  if (minPriceInput) {
    minPriceInput.addEventListener('input', filterProperties);
  }

  if (maxPriceInput) {
    maxPriceInput.addEventListener('input', filterProperties);
  }

  if (sortBy) {
    sortBy.addEventListener('change', filterProperties);
  }

  if (applyBtn) {
    applyBtn.addEventListener('click', function () {
      filterProperties();

      if (filterPopup) filterPopup.classList.remove('active');
      if (menuOverlay) menuOverlay.classList.remove('active');
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      filters = {
        listing: null,
        type: null,
        bedrooms: null,
        minPrice: null,
        maxPrice: null
      };

      document.querySelectorAll('.filter-options button').forEach(btn => {
        btn.classList.remove('active');
      });

      if (searchInput) searchInput.value = '';
      if (minPriceInput) minPriceInput.value = '';
      if (maxPriceInput) maxPriceInput.value = '';
      if (sortBy) sortBy.value = 'default';

      filterProperties();
    });
  }

  // =========================
  // CONTACT FORM
  // =========================
  if (contactForm) {
    contactForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      const fullName = document.getElementById('fullName')?.value.trim() || '';
      const emailAddress = document.getElementById('emailAddress')?.value.trim() || '';
      const phoneNumber = document.getElementById('phoneNumber')?.value.trim() || '';
      const message = document.getElementById('message')?.value.trim() || '';

      if (!fullName || !emailAddress || !message) {
        if (contactFormMessage) {
          contactFormMessage.textContent = 'Please fill in your name, email address, and message.';
          contactFormMessage.className = 'admin-form-message error';
        }
        return;
      }

      try {
        if (contactFormMessage) {
          contactFormMessage.textContent = 'Sending message...';
          contactFormMessage.className = 'admin-form-message';
        }

        const response = await fetch(`${API_BASE_URL}/inquiries`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            fullName,
            emailAddress,
            phoneNumber,
            message
          })
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || 'Failed to send inquiry');
        }

        if (contactFormMessage) {
          contactFormMessage.textContent = 'Your message has been sent successfully.';
          contactFormMessage.className = 'admin-form-message success';
        }

        contactForm.reset();
      } catch (error) {
        console.error('Contact form error:', error);

        if (contactFormMessage) {
          contactFormMessage.textContent = error.message || 'Something went wrong.';
          contactFormMessage.className = 'admin-form-message error';
        }
      }
    });
  }

  // =========================
  // ADMIN PROPERTY FORM (ADD)
  // =========================
  if (adminPropertyForm) {
    adminPropertyForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      if (adminFormMessage) {
        adminFormMessage.textContent = 'Submitting property...';
        adminFormMessage.className = 'admin-form-message';
      }

      const files = imageInput?.files;

      if (!files || !files.length) {
        if (adminFormMessage) {
          adminFormMessage.textContent = 'Please choose at least one image.';
          adminFormMessage.className = 'admin-form-message error';
        }
        return;
      }

      if (files.length > 20) {
        if (adminFormMessage) {
          adminFormMessage.textContent = 'Maximum of 20 images allowed.';
          adminFormMessage.className = 'admin-form-message error';
        }
        return;
      }

      const formData = new FormData();
      formData.append('name', document.getElementById('name')?.value.trim() || '');
      formData.append('location', document.getElementById('location')?.value.trim() || '');
      formData.append('listing', document.getElementById('listing')?.value || '');
      formData.append('type', document.getElementById('type')?.value || '');
      formData.append('price', document.getElementById('price')?.value || '');
      formData.append('bedrooms', document.getElementById('bedrooms')?.value || '');
      formData.append('bathrooms', document.getElementById('bathrooms')?.value || '');
      formData.append('size', document.getElementById('size')?.value.trim() || '');
      formData.append('description', document.getElementById('description')?.value.trim() || '');
      formData.append('parking', document.getElementById('parking')?.value.trim() || '');
      formData.append('interior', document.getElementById('interior')?.value.trim() || '');
      formData.append('exterior', document.getElementById('exterior')?.value.trim() || '');
      formData.append('featured', document.getElementById('featured')?.checked ? 'true' : 'false');

      for (let i = 0; i < files.length; i++) {
        formData.append('images', files[i]);
      }

      try {
        const response = await authFetch(`${API_BASE_URL}/properties`, {
          method: 'POST',
          body: formData
        });

        const text = await response.text();
        let result;

        try {
          result = JSON.parse(text);
        } catch (err) {
          console.error('Non-JSON response:', text);
          throw new Error('Server did not return JSON. Check API URL or backend.');
        }

        if (!response.ok) {
          throw new Error(result.error || result.message || 'Failed to add property');
        }

        if (adminFormMessage) {
          adminFormMessage.textContent = 'Property added successfully.';
          adminFormMessage.className = 'admin-form-message success';
        }

        adminPropertyForm.reset();
        renderImagePreview([]);
        toggleLandFields();

        renderAdminProperties(adminSearchInput ? adminSearchInput.value.trim() : '');
        renderFeaturedProperties();
        renderAllProperties();
      } catch (error) {
        console.error('Error adding property:', error);

        if (adminFormMessage) {
          adminFormMessage.textContent = error.message || 'Something went wrong.';
          adminFormMessage.className = 'admin-form-message error';
        }
      }
    });
  }

  // =========================
  // EDIT PROPERTY FORM (MODAL)
  // =========================
  if (editPropertyForm) {
    editPropertyForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      const editId = editPropertyForm.dataset.editId;
      if (!editId) return;

      if (editFormMessage) {
        editFormMessage.textContent = 'Saving changes...';
        editFormMessage.className = 'admin-form-message';
      }

      try {
        const formData = new FormData();
        formData.append('name', document.getElementById('editName')?.value.trim() || '');
        formData.append('location', document.getElementById('editLocation')?.value.trim() || '');
        formData.append('listing', document.getElementById('editListing')?.value || '');
        formData.append('type', document.getElementById('editType')?.value || '');
        formData.append('price', document.getElementById('editPrice')?.value || '');
        formData.append('bedrooms', document.getElementById('editBedrooms')?.value || '');
        formData.append('bathrooms', document.getElementById('editBathrooms')?.value || '');
        formData.append('size', document.getElementById('editSize')?.value.trim() || '');
        formData.append('description', document.getElementById('editDescription')?.value.trim() || '');
        formData.append('parking', document.getElementById('editParking')?.value.trim() || '');
        formData.append('interior', document.getElementById('editInterior')?.value.trim() || '');
        formData.append('exterior', document.getElementById('editExterior')?.value.trim() || '');
        formData.append('featured', document.getElementById('editFeatured')?.checked ? 'true' : 'false');

        const editFiles = editImageInput?.files;
        if (editFiles && editFiles.length) {
          if (editFiles.length > 20) {
            throw new Error('Maximum of 20 images allowed.');
          }

          for (let i = 0; i < editFiles.length; i++) {
            formData.append('images', editFiles[i]);
          }
        }

        const response = await authFetch(`${API_BASE_URL}/properties/${editId}`, {
          method: 'PUT',
          body: formData
        });

        const text = await response.text();
        let result;

        try {
          result = JSON.parse(text);
        } catch (err) {
          console.error('Non-JSON response:', text);
          throw new Error('Server did not return JSON. Check backend update route.');
        }

        if (!response.ok) {
          throw new Error(result.error || result.message || 'Failed to update property');
        }

        if (editFormMessage) {
          editFormMessage.textContent = 'Property updated successfully.';
          editFormMessage.className = 'admin-form-message success';
        }

        renderAdminProperties(adminSearchInput ? adminSearchInput.value.trim() : '');
        renderFeaturedProperties();
        renderAllProperties();

        setTimeout(() => {
          closeEditModal();
        }, 700);
      } catch (error) {
        console.error('Error updating property:', error);

        if (editFormMessage) {
          editFormMessage.textContent = error.message || 'Something went wrong.';
          editFormMessage.className = 'admin-form-message error';
        }
      }
    });
  }

  // =========================
  // ADMIN SEARCH
  // =========================
  if (adminSearchBtn && adminPropertiesList) {
    adminSearchBtn.addEventListener('click', () => {
      renderAdminProperties(adminSearchInput.value.trim());
    });
  }

  if (adminSearchInput && adminPropertiesList) {
    adminSearchInput.addEventListener('input', () => {
      renderAdminProperties(adminSearchInput.value.trim());
    });
  }

  // =========================
  // LAND TOGGLE EVENTS
  // =========================
  if (typeSelect) {
    typeSelect.addEventListener('change', toggleLandFields);
    toggleLandFields();
  }

  if (editTypeSelect) {
    editTypeSelect.addEventListener('change', toggleEditLandFields);
  }

  // =========================
  // LOGIN FORM
  // =========================
  if (loginForm) {
    loginForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      const username = document.getElementById('username')?.value.trim() || '';
      const password = document.getElementById('password')?.value.trim() || '';

      try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ username, password })
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || 'Login failed');
        }

        localStorage.setItem('adminToken', result.token);

        if (loginMessage) {
          loginMessage.textContent = 'Login successful. Redirecting...';
          loginMessage.className = 'admin-form-message success';
        }

        window.location.href = 'admin.html';
      } catch (error) {
        if (loginMessage) {
          loginMessage.textContent = error.message || 'Something went wrong.';
          loginMessage.className = 'admin-form-message error';
        }
      }
    });
  }

  // =========================
  // PROTECT ADMIN PAGE
  // =========================
  function protectAdminPage() {
    const isAdminPage = window.location.pathname.includes('admin.html');
    if (!isAdminPage) return;

    const token = localStorage.getItem('adminToken');
    if (!token) {
      window.location.href = 'login.html';
    }
  }

  if (logoutBtn) {
    if (!token) {
      logoutBtn.style.display = 'none';
    } else {
      logoutBtn.addEventListener('click', function () {
        localStorage.removeItem('adminToken');
        window.location.href = 'login.html';
      });
    }
  }

  // =========================
  // INITIAL RUN
  // =========================
  protectAdminPage();
  initRevealAnimation();
  renderFeaturedProperties();
  renderAllProperties();
  renderAdminProperties();
  renderAdminInquiries();
  loadPropertyDetails();
  filterProperties();
});