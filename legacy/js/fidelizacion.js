document.addEventListener('DOMContentLoaded', function() {
    loadPointsSummary();
    loadRewardsCatalog();
    loadPointsHistory();
    loadReferralProgram();
});

function loadPointsSummary() {
    const pointsData = {
        current: 150,
        nextReward: 200,
        pointsNeeded: 50,
        tier: 'Oro',
        benefits: [
            '15% de descuento en servicios',
            'Prioridad en reservas',
            'Corte gratis cada 10 citas'
        ]
    };

    document.getElementById('currentPoints').textContent = pointsData.current;
    document.getElementById('nextReward').textContent = pointsData.nextReward;
    document.getElementById('pointsNeeded').textContent = pointsData.pointsNeeded;
    document.getElementById('userTier').textContent = pointsData.tier;

    const benefitsList = document.getElementById('tierBenefits');
    if (benefitsList) {
        benefitsList.innerHTML = pointsData.benefits.map(benefit => 
            `<li><i class="fas fa-check" style="color: #c9a959;"></i> ${benefit}</li>`
        ).join('');
    }
}

function loadRewardsCatalog() {
    const rewards = [
        {
            id: 1,
            name: 'Corte Clásico Gratis',
            points: 150,
            description: 'Canjea por un corte clásico completamente gratis',
            image: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'
        },
        {
            id: 2,
            name: '20% de Descuento',
            points: 100,
            description: 'Obtén 20% de descuento en tu próximo servicio',
            image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'
        },
        {
            id: 3,
            name: 'Producto Premium',
            points: 200,
            description: 'Llévate un producto premium para el cuidado de tu barba',
            image: 'https://images.unsplash.com/photo-1622287112023-94b7c56ed93a?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'
        },
        {
            id: 4,
            name: 'Upgrade de Servicio',
            points: 75,
            description: 'Mejora tu servicio sin costo adicional',
            image: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'
        }
    ];

    const container = document.getElementById('rewardsCatalog');
    if (!container) return;

    container.innerHTML = rewards.map(reward => `
        <div class="reward-card">
            <div class="reward-img" style="background-image: url('${reward.image}')"></div>
            <div class="reward-info">
                <h3>${reward.name}</h3>
                <p>${reward.description}</p>
                <div class="points-required">
                    <i class="fas fa-star" style="color: #c9a959;"></i>
                    <span>${reward.points} puntos</span>
                </div>
                <button class="btn-book" onclick="redeemReward(${reward.id}, ${reward.points})"
                        ${reward.points > 150 ? 'disabled' : ''}>
                    Canjear
                </button>
            </div>
        </div>
    `).join('');
}

function loadPointsHistory() {
    const history = [
        { date: '15/03/2025', concept: 'Corte Clásico', points: 15, type: 'earned' },
        { date: '10/03/2025', concept: 'Corte + Barba', points: 25, type: 'earned' },
        { date: '05/03/2025', concept: 'Cumpleaños', points: 50, type: 'bonus' },
        { date: '01/03/2025', concept: 'Canje: Corte Gratis', points: 150, type: 'redeemed' }
    ];

    const container = document.getElementById('pointsHistory');
    if (!container) return;

    container.innerHTML = history.map(item => `
        <tr>
            <td>${item.date}</td>
            <td>${item.concept}</td>
            <td style="color: ${item.type === 'earned' || item.type === 'bonus' ? '#4caf50' : '#f44336'};">
                ${item.type === 'earned' || item.type === 'bonus' ? '+' : '-'}${item.points}
            </td>
            <td>
                <span class="badge badge-${item.type}">
                    ${item.type === 'earned' ? 'Ganados' : item.type === 'bonus' ? 'Bono' : 'Canjeados'}
                </span>
            </td>
        </tr>
    `).join('');
}

function loadReferralProgram() {
    const referralCode = 'BARBAPP123';
    const referralLink = `https://barbapp.com/ref/${referralCode}`;
    const referrals = [
        { name: 'Carlos M.', date: '10/03/2025', points: 50 },
        { name: 'Luis F.', date: '08/03/2025', points: 50 },
        { name: 'Ana T.', date: '05/03/2025', points: 50 }
    ];

    document.getElementById('referralCode').textContent = referralCode;
    document.getElementById('referralLink').textContent = referralLink;
    document.getElementById('referralCount').textContent = referrals.length;
    document.getElementById('referralPoints').textContent = referrals.length * 50;

    const container = document.getElementById('referralsList');
    if (container) {
        container.innerHTML = referrals.map(ref => `
            <tr>
                <td>${ref.name}</td>
                <td>${ref.date}</td>
                <td style="color: #4caf50;">+${ref.points}</td>
            </tr>
        `).join('');
    }
}

function redeemReward(rewardId, pointsNeeded) {
    const currentPoints = 150;
    
    if (currentPoints < pointsNeeded) {
        showAlert('No tienes suficientes puntos para canjear esta recompensa', 'error');
        return;
    }

    if (confirm(`¿Confirmas el canje de esta recompensa por ${pointsNeeded} puntos?`)) {
        showAlert('¡Recompensa canjeada exitosamente!', 'success');
        
        setTimeout(() => {
            window.location.href = 'reservas.html?reward=' + rewardId;
        }, 2000);
    }
}

function copyReferralCode() {
    const code = document.getElementById('referralCode').textContent;
    navigator.clipboard.writeText(code).then(() => {
        showAlert('Código copiado al portapapeles', 'success');
    });
}

function shareWhatsApp() {
    const link = document.getElementById('referralLink').textContent;
    const message = encodeURIComponent(`¡Únete a BarbApp con mi código y obtén beneficios! ${link}`);
    window.open(`https://wa.me/?text=${message}`, '_blank');
}