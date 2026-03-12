import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, push, onValue, remove } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyDaK5Jw96nkc9vG8UjRPwd01ppEHukiJkQ",
    authDomain: "impulse-auto.firebaseapp.com",
    projectId: "impulse-auto",
    storageBucket: "impulse-auto.firebasestorage.app",
    messagingSenderId: "465285689392",
    appId: "1:465285689392:web:8326a196ac739fd567bdf5",
    databaseURL: "https://impulse-auto-default-rtdb.europe-west1.firebasedatabase.app"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const reviewsRef = ref(db, 'reviews');

document.addEventListener('DOMContentLoaded', () => {
    // --- UI Elements ---
    const reviewsShortList = document.getElementById('reviews-short-list');
    const fullReviewsList = document.getElementById('full-reviews-list');
    const averageRatingDisplay = document.getElementById('average-rating-display');
    const reviewForm = document.getElementById('review-form');
    const starsSelector = document.getElementById('stars-selector');
    const openReviewsBtn = document.getElementById('open-all-reviews-btn');
    const reviewsCountDisplay = document.getElementById('reviews-count');
    const reviewsAverageRatingDisplay = document.getElementById('reviews-average-rating');

    // Modals
    const galleryModal = document.getElementById('full-gallery-modal');
    const reviewsModal = document.getElementById('all-reviews-modal');
    const closeGalleryBtn = document.getElementById('close-gallery-btn');
    const closeReviewsBtn = document.getElementById('close-all-reviews-btn');

    let userSelectedRating = null; // null indicates no user selection
    let allReviews = {};
    let currentSortOrder = 'desc';

    // --- Notification System ---
    const showNotification = (message, isError = false) => {
        const notification = document.getElementById('custom-notification');
        if (notification) {
            notification.textContent = message;
            notification.style.backgroundColor = isError ? '#ff4d4d' : '#28a745';
            notification.classList.add('show');
            setTimeout(() => notification.classList.remove('show'), 4000);
        }
    };

    // --- Star Rating Logic ---
    const setActiveStars = (rating) => {
        const stars = starsSelector.querySelectorAll('span');
        stars.forEach(s => {
            s.classList.toggle('active', parseInt(s.dataset.value) <= rating);
        });
    };

    if (starsSelector) {
        starsSelector.querySelectorAll('span').forEach(star => {
            star.onclick = () => {
                userSelectedRating = parseInt(star.dataset.value);
                if (userSelectedRating < 1) userSelectedRating = 1; // Ensure minimum 1 star
                setActiveStars(userSelectedRating);
            };
        });
    }

    // --- Modal Management ---
    const toggleModal = (modal, show) => {
        modal.classList.toggle('show', show);
        document.body.style.overflow = show ? 'hidden' : 'auto';
    };

    document.getElementById('open-gallery-btn')?.addEventListener('click', () => toggleModal(galleryModal, true));
    closeGalleryBtn?.addEventListener('click', () => toggleModal(galleryModal, false));
    openReviewsBtn?.addEventListener('click', () => toggleModal(reviewsModal, true));
    closeReviewsBtn?.addEventListener('click', () => toggleModal(reviewsModal, false));

    // --- Data Handling (Firebase) ---
    onValue(reviewsRef, (snapshot) => {
        allReviews = snapshot.val() || {};
        renderAll();
    });

    const renderAll = () => {
        const reviewsArray = Object.entries(allReviews).map(([key, val]) => ({ id: key, ...val }));

        updateAverageRating(reviewsArray);
        updateReviewCounts(reviewsArray);

        // Sort for short list (always newest)
        reviewsArray.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        renderShortList(reviewsArray.slice(0, 4));

        // Render full list with current sort order
        renderFullList(reviewsArray);
    };

    const updateAverageRating = (reviews) => {
        if (reviews.length === 0) {
            averageRatingDisplay.textContent = "⭐ 5.0";
            reviewsAverageRatingDisplay.textContent = "⭐ 5.0";
            return;
        }
        const sum = reviews.reduce((acc, rev) => acc + (rev.rating || 5), 0);
        const avg = (sum / reviews.length).toFixed(1);
        averageRatingDisplay.textContent = `⭐ ${avg}`;
        reviewsAverageRatingDisplay.textContent = `| Средний балл: ${avg}`;
    };

    const updateReviewCounts = (reviews) => {
        const count = reviews.length;
        openReviewsBtn.textContent = `Показать все отзывы (${count})`;
        reviewsCountDisplay.textContent = `Всего отзывов: ${count}`;
    };

    const createReviewCard = (review) => {
        const stars = "⭐".repeat(review.rating || 5);
        const isLong = review.text.length > 150; // Increased threshold for "Развернуть"
        const date = review.timestamp ? new Date(review.timestamp).toLocaleDateString('ru-RU') : 'Недавно';
        return `
            <div class="review-card" data-review-id="${review.id}">
                <div class="review-header">
                    <h4>${review.name}</h4>
                    <div class="review-stars">${stars}</div>
                </div>
                <div class="review-body">
                    <p class="review-text">${review.text}</p>
                    ${isLong ? '<button class="expand-review-btn">Развернуть</button>' : ''}
                </div>
                <div class="review-footer">
                    <span class="review-timestamp">${date}</span>
                </div>
                <button class="delete-review-btn" data-key="${review.id}" style="display:none">X</button>
            </div>
        `;
    };

    const renderShortList = (reviews) => {
        reviewsShortList.innerHTML = reviews.length ? reviews.map(createReviewCard).join('') : '<p>Отзывов пока нет</p>';
        addExpandListeners(reviewsShortList);
        setupAdmin();
    };

    const renderFullList = (reviews) => {
        const sortedReviews = [...reviews].sort((a, b) => {
            const ratingA = a.rating || 5;
            const ratingB = b.rating || 5;
            if (currentSortOrder === 'desc') {
                return ratingB - ratingA || new Date(b.timestamp) - new Date(a.timestamp);
            } else {
                return ratingA - ratingB || new Date(b.timestamp) - new Date(a.timestamp);
            }
        });
        fullReviewsList.innerHTML = sortedReviews.length ? sortedReviews.map(createReviewCard).join('') : '<p style="text-align:center; padding:20px;">Отзывов пока нет</p>';
        addExpandListeners(fullReviewsList);
        setupAdmin();
    };

    const addExpandListeners = (container) => {
        container.querySelectorAll('.expand-review-btn').forEach(btn => {
            btn.onclick = (e) => {
                const p = e.target.closest('.review-body').querySelector('.review-text');
                p.classList.toggle('expanded');
                e.target.textContent = p.classList.contains('expanded') ? 'Свернуть' : 'Развернуть';
            };
        });
    };

    // --- Sorting ---
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentSortOrder = btn.dataset.sort;
            const reviewsArray = Object.entries(allReviews).map(([key, val]) => ({ id: key, ...val }));
            renderFullList(reviewsArray);
        };
    });

    // --- Review Submission ---
    if (reviewForm) {
        reviewForm.onsubmit = (e) => {
            e.preventDefault();
            const name = document.getElementById('reviewer-name').value.trim();
            const text = document.getElementById('review-text').value.trim();

            if (!name || !text) {
                showNotification('Заполните все поля', true);
                return;
            }

            const ratingToSend = userSelectedRating === null ? 5 : userSelectedRating;

            push(reviewsRef, { name, text, rating: ratingToSend, timestamp: new Date().toISOString() })
                .then(() => {
                    reviewForm.reset();
                    userSelectedRating = null; // Reset after submission
                    setActiveStars(0); // Visually reset stars to grey
                    showNotification('Спасибо за отзыв!');
                });
        };
    }

    // --- Admin ---
    const setupAdmin = () => {
        const isAdmin = window.location.hash === '#MinePiotr18';
        document.getElementById('admin-panel')?.classList.toggle('show', isAdmin);

        document.querySelectorAll('.delete-review-btn').forEach(btn => {
            btn.style.display = isAdmin ? 'block' : 'none';
            btn.onclick = () => {
                if (confirm('Удалить отзыв?')) {
                    remove(ref(db, `reviews/${btn.dataset.key}`));
                }
            };
        });

        document.querySelectorAll('.editable').forEach(el => {
            el.contentEditable = isAdmin;
            if (isAdmin) {
                el.onblur = () => {
                    const content = JSON.parse(localStorage.getItem('father_site_content') || '{}');
                    content[el.dataset.key] = el.innerHTML;
                    localStorage.setItem('father_site_content', JSON.stringify(content));
                };
            }
        });
    };

    // Load editable content
    const saved = localStorage.getItem('father_site_content');
    if (saved) {
        const content = JSON.parse(saved);
        document.querySelectorAll('.editable').forEach(el => {
            if (content[el.dataset.key]) el.innerHTML = content[el.dataset.key];
        });
    }

    window.addEventListener('hashchange', setupAdmin);
    setupAdmin();
});
