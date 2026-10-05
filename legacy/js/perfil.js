// Cargar datos del perfil
document.addEventListener('DOMContentLoaded', function() {
    loadUserProfile();
    loadUserAppointments();
    loadUserPoints();
    loadFavoriteBarber();
});

function loadUserProfile() {
    const user = JSON.parse(localStorage.getItem('user')) || {
        name: 'Juan Pérez',
        email: 'juan@email.com',
        phone: '+58 412-1234567',
        points: 150
    };

    document.getElementById('userName').textContent = user.name;
    document.getElementById('userEmail').textContent = user.email;
    document.getElementById('userPhone').textContent = user.phone;
    document.getElementById('userPoints').textContent = user.points;
}

function loadUserAppointments() {
    const appointments = [
        {
            id: 1,
            service: 'Corte Clásico',
            barber: 'Carlos Rodríguez',
            date: '15/03/2025',
            time: '10:00',
            status: 'Completada',
            rating: 5,
            review: 'Excelente servicio'
        },
        {
            id: 2,
            service: 'Corte + Barba',
            barber: 'Miguel Ángel',
            date: '10/03/2025',
            time: '11:00',
            status: 'Completada',
            rating: 4,
            review: 'Muy buen trabajo'
        },
        {
            id: 3,
            service: 'Afeitado Profesional',
            barber: 'Javier Mendoza',
            date: '05/03/2025',
            time: '09:00',
            status: 'Cancelada',
            rating: null,
            review: null
        }
    ];

    renderAppointments(appointments);
}

function renderAppointments(appointments) {
    const container = document.getElementById('appointmentsHistory');
    if (!container) return;

    container.innerHTML = appointments.map(apt => `
        <div class="appointment-item">
            <div class="appointment-header">
                <h4>${apt.service}</h4>
                <span class="badge badge-${apt.status.toLowerCase()}">${apt.status}</span>
            </div>
            <p><i class="fas fa-user"></i> ${apt.barber}</p>
            <p><i class="fas fa-calendar"></i> ${apt.date} - ${apt.time}</p>
            ${apt.rating ? `
                <div class="rating-display">
                    ${generateStars(apt.rating)}
                    <p class="review">"${apt.review}"</p>
                </div>
            ` : apt.status === 'Completada' ? `
                <button class="btn-small" onclick="rateAppointment(${apt.id})">
                    Calificar Servicio
                </button>
            ` : ''}
        </div>
    `).join('');
}

function loadUserPoints() {
    const points = 150;
    const pointsHistory = [
        { date: '15/03/2025', concept: 'Corte Clásico', points: 15 },
        { date: '10/03/2025', concept: 'Corte + Barba', points: 25 },
        { date: '05/03/2025', concept: 'Cumpleaños', points: 50 }
    ];

    const availablePoints = points;
    const pointsToNextReward = 50 - (points % 50);

    document.getElementById('availablePoints').textContent = availablePoints;
    document.getElementById('pointsToNext').textContent = pointsToNextReward;

    renderPointsHistory(pointsHistory);
}

function renderPointsHistory(history) {
    const container = document.getElementById('pointsHistory');
    if (!container) return;

    container.innerHTML = history.map(item => `
        <tr>
            <td>${item.date}</td>
            <td>${item.concept}</td>
            <td style="color: #c9a959;">+${item.points}</td>
        </tr>
    `).join('');
}

function loadFavoriteBarber() {
    const favoriteBarber = {
        name: 'Carlos Rodríguez',
        specialty: 'Experto en Cortes Clásicos',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
        nextAvailable: 'Hoy 14:00'
    };

    const container = document.getElementById('favoriteBarber');
    if (!container) return;

    container.innerHTML = `
        <div class="favorite-barber-card">
            <img src="${favoriteBarber.image}" alt="${favoriteBarber.name}">
            <div class="info">
                <h4>${favoriteBarber.name}</h4>
                <p>${favoriteBarber.specialty}</p>
                <p>Próximo disponible: <strong>${favoriteBarber.nextAvailable}</strong></p>
                <button class="btn-book" onclick="window.location.href='reservas.html?barber=1'">
                    Reservar con él
                </button>
            </div>
        </div>
    `;
}

function editProfile() {
    const modal = document.getElementById('editProfileModal');
    modal.style.display = 'block';
    
    // Cargar datos actuales
    const user = JSON.parse(localStorage.getItem('user')) || {
        name: 'Juan Pérez',
        email: 'juan@email.com',
        phone: '+58 412-1234567'
    };

    document.getElementById('editName').value = user.name;
    document.getElementById('editEmail').value = user.email;
    document.getElementById('editPhone').value = user.phone;
}

function saveProfile(event) {
    event.preventDefault();
    
    const updatedUser = {
        name: document.getElementById('editName').value,
        email: document.getElementById('editEmail').value,
        phone: document.getElementById('editPhone').value
    };

    localStorage.setItem('user', JSON.stringify(updatedUser));
    
    showAlert('Perfil actualizado exitosamente', 'success');
    
    setTimeout(() => {
        document.getElementById('editProfileModal').style.display = 'none';
        window.location.reload();
    }, 1500);
}

function rateAppointment(appointmentId) {
    const modal = document.getElementById('rateModal');
    modal.style.display = 'block';
    localStorage.setItem('ratingAppointment', appointmentId);
}

function submitRating(event) {
    event.preventDefault();
    
    const rating = document.getElementById('rating').value;
    const review = document.getElementById('review').value;
    
    showAlert('Calificación enviada. ¡Gracias por tu feedback!', 'success');
    
    setTimeout(() => {
        document.getElementById('rateModal').style.display = 'none';
        window.location.reload();
    }, 1500);
}