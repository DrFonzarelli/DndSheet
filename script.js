// Variabili
let alarmTimeout;
let audio = new Audio(); // Audio player
let audioFile = null; // File audio caricato
const fadeDuration = 600000; // 10 min in ms
const lightFadeDuration = 300000; // 5 min
const vibrationDelay = 300000; // 5 min dopo suono
const vibrationFadeDuration = 300000;
let isAlarmActive = false;

// Richiedi permessi all'avvio
async function requestPermissions() {
    if (Notification.permission !== 'granted') {
        await Notification.requestPermission();
    }
    // Wake Lock (tenere schermo acceso)
    if ('wakeLock' in navigator) {
        try {
            await navigator.wakeLock.request('screen');
        } catch (err) { console.error('Wake Lock fallito:', err); }
    }
}

// Carica audio personalizzato
document.getElementById('audio-file').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        audioFile = URL.createObjectURL(file);
        audio.src = audioFile;
    }
});

// Imposta sveglia
document.getElementById('set-alarm').addEventListener('click', () => {
    const timeInput = document.getElementById('alarm-time').value;
    if (!timeInput) return;
    const [hours, minutes] = timeInput.split(':').map(Number);
    const now = new Date();
    let alarmTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
    if (alarmTime < now) alarmTime.setDate(alarmTime.getDate() + 1);
    const delay = alarmTime - now;
    
    clearTimeout(alarmTimeout);
    alarmTimeout = setTimeout(triggerAlarm, delay);
    document.getElementById('status').textContent = `Sveglia impostata per ${timeInput}`;
    showNotification('Sveglia impostata', { body: `Alle ${timeInput}` });
});

// Test mode (trigger dopo 10 sec)
document.getElementById('test-alarm').addEventListener('click', () => {
    clearTimeout(alarmTimeout);
    alarmTimeout = setTimeout(triggerAlarm, 10000); // 10 sec per test
    document.getElementById('status').textContent = 'Test in corso...';
});

// Trigger alarm
async function triggerAlarm() {
    if (isAlarmActive) return;
    isAlarmActive = true;
    requestPermissions();

    // Mostra schermo full-screen simulando alba
    const alarmScreen = document.getElementById('alarm-screen');
    alarmScreen.classList.remove('hidden');
    alarmScreen.requestFullscreen();
    document.getElementById('time-display').textContent = new Date().toLocaleTimeString();

    // Simula fade luce (da nero a bianco/arancione)
    alarmScreen.style.background = 'black';
    let lightProgress = 0;
    const lightInterval = setInterval(() => {
        lightProgress += 1 / (lightFadeDuration / 100); // Step ogni 100ms
        const colorValue = Math.min(255, lightProgress * 255);
        alarmScreen.style.background = `rgb(${colorValue}, ${colorValue * 0.8}, ${colorValue * 0.6})`; // Arancione caldo
        if (lightProgress >= 1) clearInterval(lightInterval);
    }, 100);

    // Fade audio
    if (audio.src) {
        audio.volume = 0;
        audio.loop = true;
        audio.play();
        let volumeProgress = 0;
        const volumeInterval = setInterval(() => {
            volumeProgress += 1 / (fadeDuration / 100);
            audio.volume = Math.pow(volumeProgress, 2); // Curva logaritmica delicata
            if (volumeProgress >= 1) clearInterval(volumeInterval);
        }, 100);
    }

    // Vibrazione graduale dopo delay
    setTimeout(() => {
        let vibProgress = 0;
        const vibInterval = setInterval(() => {
            vibProgress += 1 / (vibrationFadeDuration / 100);
            const intensity = Math.min(200, vibProgress * 200); // Da 0 a 200ms
            navigator.vibrate(intensity);
            if (vibProgress >= 1) clearInterval(vibInterval);
        }, 1000); // Vibra ogni sec, intensità crescente
    }, vibrationDelay);

    showNotification('Sveglia!', { body: 'Tempo di svegliarsi!', icon: 'icon.png' }); // Aggiungi icona se hai
}

// Stop alarm
document.getElementById('stop-alarm').addEventListener('click', () => {
    isAlarmActive = false;
    audio.pause();
    audio.volume = 0;
    navigator.vibrate(0); // Stop vib
    document.getElementById('alarm-screen').classList.add('hidden');
    if (document.fullscreenElement) document.exitFullscreen();
    document.getElementById('status').textContent = 'Sveglia fermata';
});

// Mostra notifica (con icona status bar)
function showNotification(title, options) {
    if (Notification.permission === 'granted') {
        new Notification(title, options);
    }
}

// Per PWA: Registra service worker per offline/notifiche background
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').then(() => console.log('Service Worker registrato'));
}