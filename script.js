document.addEventListener('DOMContentLoaded', () => {
    const adminPanel = document.getElementById('admin-panel');
    const editableElements = () => document.querySelectorAll('.editable');
    const reviewsList = document.getElementById('reviews-list');
    const reviewForm = document.getElementById('review-form');
    const reviewerNameInput = document.getElementById('reviewer-name');
    const reviewTextInput = document.getElementById('review-text');
    const accordionItems = document.querySelectorAll('.accordion-item');
    const installAppButton = document.getElementById('install-app-button');

    let reviews = [];
    let content = {};

    // --- Custom Notification ---
    const showNotification = (message) => {
        const notification = document.getElementById('custom-notification');
        if (notification) {
            notification.textContent = message;
            notification.classList.add('show');
            setTimeout(() => {
                notification.classList.remove('show');
            }, 3000);
        }
    };

    // --- Core Functions ---

    const loadContent = () => {
        const savedContent = localStorage.getItem('father_site_content');
        if (savedContent) {
            content = JSON.parse(savedContent);
            editableElements().forEach(el => {
                const key = el.dataset.key;
                if (content[key]) {
                    el.innerHTML = content[key];
                }
            });
        }
    };

    const saveContent = () => {
        // The content object is now updated by the 'blur' event listener
        localStorage.setItem('father_site_content', JSON.stringify(content));
        console.log('Content saved to localStorage.');
    };

    const loadReviews = () => {
        const savedReviews = localStorage.getItem('father_site_reviews');
        reviews = savedReviews ? JSON.parse(savedReviews) : [];
        renderReviews();
    };

    const saveReviews = () => {
        localStorage.setItem('father_site_reviews', JSON.stringify(reviews));
    };

    const renderReviews = () => {
        reviewsList.innerHTML = '';
        if (reviews.length === 0) {
            reviewsList.innerHTML = '<p class="secondary-text" style="text-align: center; width: 100%;">Отзывов пока нет. Будьте первым!</p>';
            return;
        }
        reviews.forEach((review, index) => {
            const card = document.createElement('div');
            card.className = 'review-card';
            card.innerHTML = `
                <div class="review-header">
                    <h4 class="editable" data-key="review_${index}_name">${review.name}</h4>
                    <span class="review-timestamp">${review.timestamp || ''}</span>
                </div>
                <p class="editable" data-key="review_${index}_text">${review.text}</p>
                <button class="delete-review-btn" data-index="${index}">X</button>
            `;
            reviewsList.appendChild(card);
        });
        // Re-apply admin features for new elements, including editable review content
        if (window.location.hash === '#admin') {
            setupAdminFeatures();
        }
    };

    // --- Admin Mode ---

    const setupAdminFeatures = () => {
        const isAdmin = window.location.hash === '#admin';

        if (isAdmin) {
            adminPanel.style.display = 'block';
        } else {
            adminPanel.style.display = 'none';
        }

        // Handle editable text blocks
        editableElements().forEach(el => {
            const key = el.dataset.key;
            // Set initial content from loaded data
            if (content[key]) {
                el.innerHTML = content[key];
            }

            if (isAdmin) {
                el.contentEditable = 'true';
                el.addEventListener('blur', () => {
                    content[key] = el.innerHTML;
                    saveContent(); // Auto-save on blur
                    showNotification('Сохранено!');
                });
            } else {
                el.contentEditable = 'false';
                // It's good practice to remove listeners if the mode changes, but 'blur' is low-impact
            }
        });

        // Handle delete buttons on reviews
        document.querySelectorAll('.delete-review-btn').forEach(btn => {
            if (isAdmin) {
                btn.style.display = 'block';
                btn.onclick = (e) => {
                    const index = e.target.dataset.index;
                    if (confirm('Удалить этот отзыв?')) {
                        reviews.splice(index, 1);
                        saveReviews();
                        renderReviews();
                    }
                };
            } else {
                btn.style.display = 'none';
            }
        });
    };

    // --- Event Listeners ---

    reviewForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newReview = {
            name: reviewerNameInput.value.trim(),
            text: reviewTextInput.value.trim(),
            timestamp: new Date().toLocaleString('ru-RU', { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        };
        if (newReview.name && newReview.text) {
            reviews.unshift(newReview); // Add to the beginning
            saveReviews();
            renderReviews();
            reviewerNameInput.value = '';
            reviewTextInput.value = '';
            showNotification('Спасибо за ваш отзыв!');
        }
    });

    accordionItems.forEach(item => {
        const header = item.querySelector('.accordion-header');
        const content = item.querySelector('.accordion-content');
        const icon = item.querySelector('.accordion-icon');

        header.addEventListener('click', () => {
            const isOpen = content.style.maxHeight && content.style.maxHeight !== '0px';

            // Simple toggle logic
            if (isOpen) {
                content.style.maxHeight = '0px';
                icon.style.transform = 'rotate(0deg)';
            } else {
                content.style.maxHeight = content.scrollHeight + 'px';
                icon.style.transform = 'rotate(45deg)';
            }
        });
    });

    window.addEventListener('hashchange', setupAdminFeatures);

    // --- PWA Installation ---
    let deferredPrompt;

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        if(installAppButton) installAppButton.style.display = 'block';
    });

    if(installAppButton) {
        installAppButton.addEventListener('click', async () => {
            installAppButton.style.display = 'none';
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                console.log(`User response to the install prompt: ${outcome}`);
                deferredPrompt = null;
            }
        });
    }

    window.addEventListener('appinstalled', () => {
        if(installAppButton) installAppButton.style.display = 'none';
        deferredPrompt = null;
        console.log('PWA was installed');
    });

    // --- Initial Load ---
    loadContent();
    loadReviews();
    setupAdminFeatures();
});
