let currentBooking = null;

document.addEventListener('DOMContentLoaded', function() {
    loadBookingDetails();
    loadBankInfo();
});

function loadBookingDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const bookingId = urlParams.get('booking');
    
    if (bookingId) {
        const bookings = JSON.parse(localStorage.getItem('bookings')) || [];
        currentBooking = bookings.find(b => b.id == bookingId);
        
        if (currentBooking) {
            document.getElementById('bookingService').textContent = currentBooking.service.name;
            document.getElementById('bookingBarber').textContent = currentBooking.barber.name;
            document.getElementById('bookingDateTime').textContent = 
                `${currentBooking.date} - ${currentBooking.time}`;
            document.getElementById('bookingAmount').textContent = 
                `$${currentBooking.service.price}`;
        }
    }
}

function loadBankInfo() {
    const bankInfo = {
        bank: 'Banco de Venezuela',
        accountType: 'Corriente',
        accountNumber: '0102-0123-45-12345678',
        rif: 'J-12345678-9',
        beneficiary: 'BarbApp C.A.',
        phone: '0414-1234567'
    };

    document.getElementById('bankName').textContent = bankInfo.bank;
    document.getElementById('accountType').textContent = bankInfo.accountType;
    document.getElementById('accountNumber').textContent = bankInfo.accountNumber;
    document.getElementById('rif').textContent = bankInfo.rif;
    document.getElementById('beneficiary').textContent = bankInfo.beneficiary;
    document.getElementById('bankPhone').textContent = bankInfo.phone;
}

function processPayment(event) {
    event.preventDefault();
    
    const paymentData = {
        bank: document.getElementById('paymentBank').value,
        reference: document.getElementById('reference').value,
        date: document.getElementById('paymentDate').value,
        amount: document.getElementById('paymentAmount').value,
        voucher: document.getElementById('voucher').files[0]
    };

    if (!paymentData.bank || !paymentData.reference || !paymentData.date || !paymentData.amount) {
        showAlert('Por favor completa todos los campos', 'error');
        return;
    }

    // Simular subida de comprobante
    showAlert('Procesando pago...', 'info');
    
    setTimeout(() => {
        showAlert('Pago registrado exitosamente. Tu reserva está pendiente de confirmación.', 'success');
        
        // Actualizar estado de la reserva
        if (currentBooking) {
            currentBooking.payment = {
                ...paymentData,
                status: 'pendiente'
            };
            
            let bookings = JSON.parse(localStorage.getItem('bookings')) || [];
            const index = bookings.findIndex(b => b.id === currentBooking.id);
            if (index !== -1) {
                bookings[index] = currentBooking;
                localStorage.setItem('bookings', JSON.stringify(bookings));
            }
        }
        
        setTimeout(() => {
            window.location.href = 'reservas.html';
        }, 3000);
    }, 2000);
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showAlert('Copiado al portapapeles', 'success');
    });
}