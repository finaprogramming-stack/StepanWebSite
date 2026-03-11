document.addEventListener('DOMContentLoaded', () => {
    // 1. Логика Модального окна (Обратный звонок)
    const modal = document.getElementById('callbackModal');
    const btn = document.getElementById('callbackBtn');
    const span = document.getElementsByClassName('close-btn')[0];

    btn.onclick = () => modal.style.display = "flex";
    span.onclick = () => modal.style.display = "none";
    window.onclick = (event) => {
        if (event.target == modal) modal.style.display = "none";
    }

    document.getElementById('callbackForm').addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Заявка отправлена! (Здесь позже прикрутим отправку в Telegram бота)');
        modal.style.display = "none";
        e.target.reset();
    });

    // 2. Логика Отзывов (Local Storage)
    const reviewForm = document.getElementById('reviewForm');
    const reviewsList = document.getElementById('reviewsList');

    // Базовые отзывы для вида
    let reviews = JSON.parse(localStorage.getItem('autoReviews')) || [
        { id: 1, name: "Иван", text: "Степан приехал за 30 минут, завел машину в -20. Красавчик!" },
        { id: 2, name: "Алексей", text: "Быстро нашел обрыв в проводке. Цены адекватные, опыт реально чувствуется." }
    ];

    function renderReviews() {
        reviewsList.innerHTML = '';
        reviews.forEach(review => {
            const div = document.createElement('div');
            div.className = 'review-card';
            div.innerHTML = `
                <div class="reviewer-name">${review.name}</div>
                <div class="review-text">${review.text}</div>
                <button class="delete-btn" onclick="deleteReview(${review.id})"><i class="fas fa-trash"></i></button>
            `;
            reviewsList.prepend(div);
        });
    }

    reviewForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('reviewerName').value;
        const text = document.getElementById('reviewText').value;
        const newReview = { id: Date.now(), name, text };

        reviews.push(newReview);
        localStorage.setItem('autoReviews', JSON.stringify(reviews));
        renderReviews();
        reviewForm.reset();
    });

    window.deleteReview = (id) => {
        reviews = reviews.filter(r => r.id !== id);
        localStorage.setItem('autoReviews', JSON.stringify(reviews));
        renderReviews();
    };

    renderReviews();

    // 3. Секретный режим Админа для удаления отзывов
    // Нажми 3 раза быстро на логотип, чтобы появились кнопки удаления
    let clickCount = 0;
    document.querySelector('.logo-text').addEventListener('click', () => {
        clickCount++;
        if (clickCount >= 3) {
            document.body.classList.toggle('admin-mode');
            alert(document.body.classList.contains('admin-mode') ? 'Режим админа включен' : 'Режим админа выключен');
            clickCount = 0;
        }
        setTimeout(() => clickCount = 0, 2000);
    });
});