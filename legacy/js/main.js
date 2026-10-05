// Variables globales
let currentUser = null;
let services = [];
let barbers = [];
let appointments = [];

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    loadServices();
    loadBarbers();
    loadPromotions();
    loadTestimonials();
    setupEventListeners();
    checkUserAppointments();
});

// Verificar autenticación
function checkAuth() {
    const token = localStorage.getItem('token');
    if (token) {
        // Simular usuario logueado
        currentUser = {
            id: 1,
            name: 'Juan Pérez',
            email: 'juan@email.com',
            phone: '+58 412-1234567',
            points: 150
        };
        updateUIForAuth();
    }
}

// Actualizar UI para usuario autenticado
function updateUIForAuth() {
    document.querySelector('.auth-buttons').innerHTML = `
        <button class="btn-login" onclick="window.location.href='pages/perfil.html'">
            <i class="fas fa-user"></i> ${currentUser.name}
        </button>
    `;
    document.getElementById('proximasCitasSection').style.display = 'block';
}

// Cargar servicios
function loadServices() {
    services = [
        {
            id: 1,
            name: 'Corte Clásico',
            description: 'Corte de cabello tradicional con acabado perfecto',
            price: 15,
            duration: 30,
            image: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'
        },
        {
            id: 2,
            name: 'Corte + Barba',
            description: 'Servicio completo de corte y arreglo de barba',
            price: 25,
            duration: 45,
            image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'
        },
        {
            id: 3,
            name: 'Afeitado Profesional',
            description: 'Afeitado con toalla caliente y productos premium',
            price: 20,
            duration: 30,
            image: 'https://images.unsplash.com/photo-1622287112023-94b7c56ed93a?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'
        },
        {
            id: 4,
            name: 'Corte Infantil',
            description: 'Corte especial para los más pequeños',
            price: 12,
            duration: 25,
            image: 'https://images.unsplash.com/photo-1612714102836-90cf34ad646d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'
        },
        {
            id: 5,
            name: 'Tratamiento Capilar',
            description: 'Hidratación y cuidado para tu cabello',
            price: 30,
            duration: 40,
            image: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'
        },
        {
            id: 6,
            name: 'Tinte y Estilo',
            description: 'Cambia tu look con nuestros expertos',
            price: 45,
            duration: 60,
            image: 'https://images.unsplash.com/photo-1560869713-7d0a2946e9b7?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'
        }
    ];

    renderDestacados();
}

// Renderizar servicios destacados
function renderDestacados() {
    const container = document.getElementById('destacadosContainer');
    if (!container) return;

    const destacados = services.slice(0, 3);
    container.innerHTML = destacados.map(service => `
        <div class="service-card">
            <div class="service-img" style="background-image: url('${service.image}')"></div>
            <div class="service-info">
                <h3>${service.name}</h3>
                <p>${service.description}</p>
                <span class="price">$${service.price}</span>
                <span class="duration"><i class="far fa-clock"></i> ${service.duration} min</span>
                <button class="btn-book" onclick="selectService(${service.id})">
                    Reservar
                </button>
            </div>
        </div>
    `).join('');
}

// Cargar barberos
function loadBarbers() {
    barbers = [
        {
            id: 1,
            name: 'Carlos Rodríguez',
            specialty: 'Experto en Cortes Clásicos',
            rating: 4.9,
            reviews: 234,
            image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
            favorite: true
        },
        {
            id: 2,
            name: 'Miguel Ángel',
            specialty: 'Especialista en Barbas',
            rating: 4.8,
            reviews: 189,
            image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
            favorite: false
        },
        {
            id: 3,
            name: 'Javier Mendoza',
            specialty: 'Master en Estilos Modernos',
            rating: 5.0,
            reviews: 312,
            image: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
            favorite: true
        },
        {
            id: 4,
            name: 'Andrés Castillo',
            specialty: 'Barbero Profesional',
            rating: 4.7,
            reviews: 156,
            image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
            favorite: false
        }
    ];

    renderBarbers();
}

// Renderizar barberos
function renderBarbers() {
    const container = document.getElementById('barbersContainer');
    if (!container) return;

    container.innerHTML = barbers.map(barber => `
        <div class="barber-card">
            <div class="barber-img" style="background-image: url('${barber.image}')"></div>
            <div class="barber-info">
                <h3>${barber.name}</h3>
                <p>${barber.specialty}</p>
                <div class="rating">
                    ${generateStars(barber.rating)}
                    <span>(${barber.reviews} reseñas)</span>
                </div>
                ${barber.favorite ? '<span class="badge badge-gold"><i class="fas fa-star"></i> Barbero Favorito</span>' : ''}
                <button class="btn-book" onclick="selectBarber(${barber.id})">
                    Ver Disponibilidad
                </button>
            </div>
        </div>
    `).join('');
}

// Generar estrellas de calificación
function generateStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= Math.floor(rating)) {
            stars += '<i class="fas fa-star" style="color: #c9a959;"></i>';
        } else if (i - rating < 1 && i - rating > 0) {
            stars += '<i class="fas fa-star-half-alt" style="color: #c9a959;"></i>';
        } else {
            stars += '<i class="far fa-star" style="color: #c9a959;"></i>';
        }
    }
    return stars;
}

// Cargar promociones
function loadPromotions() {
    const promotions = [
        {
            id: 1,
            title: 'Primera Cita',
            description: '20% de descuento en tu primer servicio',
            code: 'BIENVENIDO20',
            validUntil: '31/12/2025',
            image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'
        },
        {
            id: 2,
            title: 'Paquete Mensual',
            description: '4 cortes por el precio de 3',
            code: 'PAQUETE4X3',
            validUntil: '31/03/2025',
            image: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'
        },
        {
            id: 3,
            title: 'Descuento por Referidos',
            description: 'Trae un amigo y ambos obtienen 15% off',
            code: 'AMIGOS15',
            validUntil: '30/06/2025',
            image: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'
        }
    ];

    renderPromotions(promotions);
}

// Renderizar promociones
function renderPromotions(promotions) {
    const container = document.getElementById('promocionesContainer');
    if (!container) return;

    container.innerHTML = promotions.map(promo => `
        <div class="promotion-card">
            <div class="service-img" style="background-image: url('${promo.image}')"></div>
            <div class="promotion-info">
                <h3>${promo.title}</h3>
                <p>${promo.description}</p>
                <p><strong>Código:</strong> <span style="color: #c9a959;">${promo.code}</span></p>
                <p><small>Válido hasta: ${promo.validUntil}</small></p>
                <button class="btn-book" onclick="applyPromo('${promo.code}')">
                    Aplicar Código
                </button>
            </div>
        </div>
    `).join('');
}

// Cargar testimonios
function loadTestimonials() {
    const testimonials = [
        {
            id: 1,
            name: 'Carlos Méndez',
            rating: 5,
            comment: 'Excelente servicio, el mejor corte que he tenido. Carlos es un profesional.',
            date: '15/03/2025'
        },
        {
            id: 2,
            name: 'Luis Fernández',
            rating: 5,
            comment: 'Ambiente genial y atención de primera. Volveré sin duda.',
            date: '14/03/2025'
        },
        {
            id: 3,
            name: 'Ana Torres',
            rating: 4,
            comment: 'Mi esposo quedó encantado con su corte. Muy recomendados.',
            date: '13/03/2025'
        }
    ];

    renderTestimonials(testimonials);
}

// Renderizar testimonios
function renderTestimonials(testimonials) {
    const container = document.getElementById('testimoniosContainer');
    if (!container) return;

    container.innerHTML = testimonials.map(testimonial => `
        <div class="testimonial-card">
            <div class="rating">
                ${generateStars(testimonial.rating)}
            </div>
            <p class="testimonial-comment">"${testimonial.comment}"</p>
            <p class="testimonial-author">- ${testimonial.name}</p>
            <small>${testimonial.date}</small>
        </div>
    `).join('');
}

// Verificar citas del usuario
function checkUserAppointments() {
    if (!currentUser) return;

    appointments = [
        {
            id: 1,
            service: 'Corte Clásico',
            barber: 'Carlos Rodríguez',
            date: '20/03/2025',
            time: '10:00',
            status: 'confirmada'
        },
        {
            id: 2,
            service: 'Corte + Barba',
            barber: 'Javier Mendoza',
            date: '22/03/2025',
            time: '15:30',
            status: 'pendiente'
        }
    ];

    renderProximasCitas();
}

// Renderizar próximas citas
function renderProximasCitas() {
    const container = document.getElementById('proximasCitas');
    if (!container) return;

    container.innerHTML = appointments.map(apt => `
        <div class="appointment-card">
            <div class="appointment-info">
                <h4>${apt.service}</h4>
                <p><i class="fas fa-user"></i> ${apt.barber}</p>
                <p><i class="fas fa-calendar"></i> ${apt.date} - ${apt.time}</p>
                <span class="badge badge-${apt.status}">${apt.status}</span>
            </div>
            <div class="appointment-actions">
                <button class="btn-small" onclick="cancelAppointment(${apt.id})">
                    Cancelar
                </button>
                <button class="btn-small btn-gold" onclick="rescheduleAppointment(${apt.id})">
                    Reprogramar
                </button>
            </div>
        </div>
    `).join('');
}

// Configurar event listeners
function setupEventListeners() {
    const menuToggle = document.getElementById('menuToggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', toggleMenu);
    }

    // Cerrar modales al hacer clic fuera
    window.addEventListener('click', function(event) {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
}

// Toggle menú móvil
function toggleMenu() {
    const navLinks = document.getElementById('navLinks');
    navLinks.classList.toggle('show');
}

// Funciones de utilidad
function selectService(serviceId) {
    localStorage.setItem('selectedService', serviceId);
    window.location.href = 'pages/reservas.html';
}

function selectBarber(barberId) {
    localStorage.setItem('selectedBarber', barberId);
    window.location.href = 'pages/calendario.html';
}

function applyPromo(code) {
    alert(`Código ${code} aplicado correctamente`);
}

function cancelAppointment(id) {
    if (confirm('¿Estás seguro de cancelar esta cita?')) {
        // Aquí iría la lógica de cancelación
        alert('Cita cancelada exitosamente');
    }
}

function rescheduleAppointment(id) {
    window.location.href = 'pages/calendario.html?reschedule=' + id;
}

// Logout
function logout() {
    localStorage.removeItem('token');
    window.location.reload();
}