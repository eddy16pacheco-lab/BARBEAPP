document.addEventListener('DOMContentLoaded', function() {
    loadDashboardStats();
    loadTodayAppointments();
    loadPendingPayments();
    loadServicesManagement();
    loadBarbersManagement();
});

function loadDashboardStats() {
    const stats = {
        todayAppointments: 24,
        todayIncome: 520,
        activeBarbers: 4,
        upcomingAppointments: 12,
        pendingPayments: 8,
        totalClients: 156,
        monthlyIncome: 12500,
        averageRating: 4.8
    };

    document.getElementById('todayAppointments').textContent = stats.todayAppointments;
    document.getElementById('todayIncome').textContent = `$${stats.todayIncome}`;
    document.getElementById('activeBarbers').textContent = stats.activeBarbers;
    document.getElementById('upcomingAppointments').textContent = stats.upcomingAppointments;
    document.getElementById('pendingPayments').textContent = stats.pendingPayments;
    document.getElementById('totalClients').textContent = stats.totalClients;
    document.getElementById('monthlyIncome').textContent = `$${stats.monthlyIncome}`;
    document.getElementById('averageRating').textContent = stats.averageRating;
}

function loadTodayAppointments() {
    const appointments = [
        {
            id: 1,
            time: '09:00',
            client: 'Carlos Méndez',
            service: 'Corte Clásico',
            barber: 'Carlos R.',
            status: 'confirmada'
        },
        {
            id: 2,
            time: '10:00',
            client: 'Luis Fernández',
            service: 'Corte + Barba',
            barber: 'Miguel Á.',
            status: 'en_proceso'
        },
        {
            id: 3,
            time: '11:00',
            client: 'Ana Torres',
            service: 'Afeitado',
            barber: 'Javier M.',
            status: 'pendiente'
        }
    ];

    const container = document.getElementById('todayAppointmentsList');
    if (!container) return;

    container.innerHTML = appointments.map(apt => `
        <tr>
            <td>${apt.time}</td>
            <td>${apt.client}</td>
            <td>${apt.service}</td>
            <td>${apt.barber}</td>
            <td><span class="badge badge-${apt.status}">${apt.status}</span></td>
            <td>
                <button class="btn-small" onclick="updateAppointmentStatus(${apt.id})">
                    Actualizar
                </button>
            </td>
        </tr>
    `).join('');
}

function loadPendingPayments() {
    const payments = [
        {
            id: 1,
            client: 'Pedro Gil',
            service: 'Corte + Barba',
            amount: 25,
            date: '15/03/2025',
            reference: 'REF123456',
            status: 'pendiente'
        },
        {
            id: 2,
            client: 'María López',
            service: 'Tratamiento',
            amount: 30,
            date: '15/03/2025',
            reference: 'REF789012',
            status: 'pendiente'
        }
    ];

    const container = document.getElementById('pendingPaymentsList');
    if (!container) return;

    container.innerHTML = payments.map(payment => `
        <tr>
            <td>${payment.client}</td>
            <td>${payment.service}</td>
            <td>$${payment.amount}</td>
            <td>${payment.date}</td>
            <td>${payment.reference}</td>
            <td>
                <button class="btn-small btn-success" onclick="confirmPayment(${payment.id})">
                    Confirmar
                </button>
                <button class="btn-small btn-danger" onclick="rejectPayment(${payment.id})">
                    Rechazar
                </button>
            </td>
        </tr>
    `).join('');
}

function loadServicesManagement() {
    const services = [
        { id: 1, name: 'Corte Clásico', price: 15, duration: 30, active: true },
        { id: 2, name: 'Corte + Barba', price: 25, duration: 45, active: true },
        { id: 3, name: 'Afeitado', price: 20, duration: 30, active: true }
    ];

    const container = document.getElementById('servicesList');
    if (!container) return;

    container.innerHTML = services.map(service => `
        <tr>
            <td>${service.name}</td>
            <td>$${service.price}</td>
            <td>${service.duration} min</td>
            <td>
                <span class="badge badge-${service.active ? 'success' : 'danger'}">
                    ${service.active ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td>
                <button class="btn-small" onclick="editService(${service.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-small btn-danger" onclick="toggleService(${service.id})">
                    <i class="fas fa-power-off"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function loadBarbersManagement() {
    const barbers = [
        { id: 1, name: 'Carlos Rodríguez', specialty: 'Cortes Clásicos', schedule: 'Lun-Vie 9-18', active: true },
        { id: 2, name: 'Miguel Ángel', specialty: 'Barbas', schedule: 'Mar-Sáb 10-19', active: true },
        { id: 3, name: 'Javier Mendoza', specialty: 'Estilos Modernos', schedule: 'Lun-Sáb 9-20', active: true }
    ];

    const container = document.getElementById('barbersList');
    if (!container) return;

    container.innerHTML = barbers.map(barber => `
        <tr>
            <td>${barber.name}</td>
            <td>${barber.specialty}</td>
            <td>${barber.schedule}</td>
            <td>
                <span class="badge badge-${barber.active ? 'success' : 'danger'}">
                    ${barber.active ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td>
                <button class="btn-small" onclick="editBarber(${barber.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-small btn-danger" onclick="toggleBarber(${barber.id})">
                    <i class="fas fa-power-off"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function confirmPayment(paymentId) {
    if (confirm('¿Confirmar este pago?')) {
        showAlert('Pago confirmado exitosamente', 'success');
        loadPendingPayments();
    }
}

function rejectPayment(paymentId) {
    if (confirm('¿Rechazar este pago?')) {
        showAlert('Pago rechazado', 'info');
        loadPendingPayments();
    }
}

function showAddServiceModal() {
    document.getElementById('serviceModal').style.display = 'block';
}

function saveService(event) {
    event.preventDefault();
    showAlert('Servicio guardado exitosamente', 'success');
    document.getElementById('serviceModal').style.display = 'none';
}

function showAddBarberModal() {
    document.getElementById('barberModal').style.display = 'block';
}

function saveBarber(event) {
    event.preventDefault();
    showAlert('Barbero agregado exitosamente', 'success');
    document.getElementById('barberModal').style.display = 'none';
}

function exportReport(type) {
    showAlert(`Exportando reporte ${type}...`, 'info');
}