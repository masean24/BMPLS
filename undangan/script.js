// 1. Ganti dengan konfigurasi Firebase Anda sendiri dari Konsol Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAlk05b2hP7vy97Aw-sd-3CVZbpwzzIhns",
  authDomain: "undangandanish.firebaseapp.com",
  projectId: "undangandanish",
  storageBucket: "undangandanish.firebasestorage.app",
  messagingSenderId: "423545198878",
  appId: "1:423545198878:web:0145835ab3e8d8801ad10f",
  measurementId: "G-B48MQBMQHS"
};

// 2. Inisialisasi Firebase
firebase.initializeApp(firebaseConfig);

// 3. Dapatkan referensi ke layanan Firestore
const db = firebase.firestore();
const ucapanCollection = db.collection('ucapan'); // 'ucapan' adalah nama koleksi Anda di Firestore

let musicPlaying = false;
const music = document.getElementById('backgroundMusic');
const musicBtn = document.getElementById('musicBtn');

// Target event date for countdown (12 Juli 2025, 10:00:00 WIB)
// Perbarui tanggal ini sesuai dengan acara utama
const eventDate = new Date("Jul 12, 2025 10:00:00").getTime();

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    music.volume = 0.3; // Atur volume awal
    
    // TIDAK ADA KODE music.play() DI SINI
    // Musik tidak akan otomatis putar saat DOMContentLoaded
    
    // Get recipient name from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const recipientName = urlParams.get('to');
    
    if (recipientName) {
        // Replace + with spaces and capitalize
        const formattedName = decodeURIComponent(recipientName.replace(/\+/g, ' '));
        document.getElementById('coverRecipientName').textContent = formattedName;
        document.getElementById('recipientName').textContent = formattedName; 
    } else {
        document.getElementById('coverRecipientName').textContent = "Bapak/Ibu/Saudara/i";
        document.getElementById('recipientName').textContent = "Bapak/Ibu/Saudara/i";
    }
    
    // Load saved ucapan
    loadUcapan();
});

// Function to open the main invitation
function openInvitation() {
    document.getElementById('cover-page').style.display = 'none'; // Sembunyikan halaman cover
    document.querySelector('.main-content').style.display = 'block'; // Tampilkan konten utama undangan
    document.getElementById('musicBtn').style.display = 'flex'; // Tampilkan kontrol musik
    document.querySelector('.bottom-nav').style.display = 'flex'; // Tampilkan navigasi bawah

    // Musik akan diputar DI SINI, setelah tombol "Buka Undangan" diklik
    if (!musicPlaying) {
        music.play().then(() => {
            musicPlaying = true;
            musicBtn.innerHTML = '🔊'; // Ganti ikon menjadi speaker jika musik diputar
            musicBtn.style.opacity = '1';
        }).catch(e => {
            console.log('Music autoplay prevented after interaction:', e);
            musicBtn.innerHTML = '🎵'; // Tetap tampilkan ikon not musik jika gagal play
        });
    }

    // Mulai hitungan mundur saat undangan dibuka
    startCountdown();
}

function toggleMusic() {
    if (musicPlaying) {
        music.pause();
        musicBtn.innerHTML = '🎵';
        musicBtn.style.opacity = '0.7';
        musicPlaying = false;
    } else {
        music.play().catch(e => {
            console.log('Music autoplay prevented by browser');
        });
        musicBtn.innerHTML = '🔊';
        musicBtn.style.opacity = '1';
        musicPlaying = true;
    }
}

function showSection(sectionId, clickedElement) {
    // Hide all sections in main content
    const sections = document.querySelectorAll('.main-content .section');
    sections.forEach(section => {
        section.classList.remove('active');
    });

    // Show selected section
    document.getElementById(sectionId).classList.add('active');

    // Update active nav item
    const navItems = document.querySelectorAll('.bottom-nav .nav-item');
    navItems.forEach(item => {
        item.classList.remove('active');
    });
    clickedElement.classList.add('active');

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function submitUcapan(event) { // Tambahkan 'async' di sini
    event.preventDefault();
    
    const senderName = document.getElementById('senderName').value; // Ambil nilai langsung dari input
    const ucapanMessage = document.getElementById('ucapanMessage').value; // Ambil nilai langsung dari textarea

    if (!senderName || !ucapanMessage) {
        alert('Nama dan ucapan tidak boleh kosong!');
        return;
    }

    try {
        // Tambahkan data ke Firestore
        await ucapanCollection.add({
            sender: senderName,
            message: ucapanMessage,
            timestamp: firebase.firestore.FieldValue.serverTimestamp() // Firestore akan mengisi timestamp otomatis
        });

        const resultDiv = document.getElementById('ucapanResult');
        resultDiv.innerHTML = `
            <div style="background: #d4f7d4; color: #2d5a2d; border: 2px solid #90ee90; border-radius: 15px; padding: 20px;">
                <h4 style="margin-bottom: 10px; font-size: 18px; color: #2d5a2d;">✅ Jazakallahu Khairan, ${senderName}!</h4>
                <p style="margin-bottom: 10px;">Ucapan dan doa Anda telah terkirim dan tersimpan.</p>
                <p style="font-style: italic; color: #3a7a3a;">"Semoga Allah membalas kebaikan Anda dan doa Anda menjadi berkah untuk Danish Maleeq Jibrani! 🤲"</p>
            </div>
        `;
        resultDiv.style.display = 'block';
        
        // Reset form
        document.getElementById('senderName').value = '';
        document.getElementById('ucapanMessage').value = '';
        
        // Reload ucapan display
        loadUcapan(); // Panggil ulang untuk menampilkan ucapan yang baru terkirim
        
        resultDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        setTimeout(() => {
            resultDiv.style.display = 'none';
        }, 5000);

    } catch (error) {
        console.error("Error writing document: ", error);
        const resultDiv = document.getElementById('ucapanResult');
        resultDiv.innerHTML = `
            <div style="background: #f7d4d4; color: #5a2d2d; border: 2px solid #ee9090; border-radius: 15px; padding: 20px;">
                <h4>❌ Terjadi kesalahan!</h4>
                <p>Gagal mengirim ucapan. Mohon coba lagi. (${error.message})</p>
            </div>
        `;
        resultDiv.style.display = 'block';
        setTimeout(() => { 
            resultDiv.style.display = 'none'; 
        }, 5000);
    }
}

async function loadUcapan() { // Tambahkan 'async' di sini
    const ucapanContainer = document.getElementById('ucapanContainer');
    ucapanContainer.innerHTML = '<div style="text-align: center; color: #a0927a;">Memuat ucapan...</div>'; // Tampilan loading

    try {
        // Ambil semua dokumen dari koleksi 'ucapan', urutkan berdasarkan timestamp terbaru
        const snapshot = await ucapanCollection.orderBy('timestamp', 'desc').get();
        const ucapanList = [];
        
        snapshot.forEach(doc => {
            const data = doc.data();
            // Format timestamp dari Firebase Timestamp menjadi string yang bisa dibaca
            let formattedTimestamp = 'Belum tersedia';
            if (data.timestamp && data.timestamp.toDate) { // Pastikan timestamp adalah Firebase Timestamp
                formattedTimestamp = data.timestamp.toDate().toLocaleString('id-ID', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            } else if (data.timestamp) { // Jika timestamp sudah string (misal dari manual entry)
                 formattedTimestamp = data.timestamp;
            }

            ucapanList.push({
                id: doc.id,
                sender: data.sender,
                message: data.message,
                timestamp: formattedTimestamp
            });
        });
        
        if (ucapanList.length === 0) {
            ucapanContainer.innerHTML = `
                <div class="no-ucapan">
                    <div class="icon">💌</div>
                    <p>Belum ada ucapan dan doa. Jadilah yang pertama memberikan ucapan tulus Anda untuk Danish Maleeq Jibrani!</p>
                </div>
            `;
            return;
        }

        ucapanContainer.innerHTML = ucapanList.map(ucapan => `
            <div class="ucapan-card">
                <div class="ucapan-sender">💝 ${ucapan.sender}</div>
                <div class="ucapan-message">"${ucapan.message}"</div>
                <div class="ucapan-time">
                    ${ucapan.timestamp}
                </div>
            </div>
        `).join(''); // Hapus tombol hapus untuk saat ini
        // Tombol hapus tidak ada di sini lagi karena akan ditambahkan dengan cara lain jika diminta

        // Tidak ada event listener untuk tombol hapus di sini, karena tombol hapusnya dihapus dari map
        // document.querySelectorAll('.delete-ucapan-btn').forEach(button => {
        //     button.addEventListener('click', deleteUcapan);
        // });

    } catch (error) {
        console.error("Error getting documents: ", error);
        ucapanContainer.innerHTML = `
            <div class="no-ucapan" style="color: #5a2d2d; border-color: #ee9090; background: #f7d4d4;">
                <div class="icon" style="color: #d45a5a;">⚠️</div>
                <p>Gagal memuat ucapan. Mohon periksa koneksi atau konfigurasi Firebase Anda.</p>
            </div>
        `;
    }
}

// Countdown Timer Logic
function startCountdown() {
    // Update the count down every 1 second
    const x = setInterval(function() {
        const now = new Date().getTime();
        const distance = eventDate - now;
            
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            
        // Display the result in the corresponding elements
        const daysEl = document.getElementById("days");
        const hoursEl = document.getElementById("hours");
        const minutesEl = document.getElementById("minutes");
        const secondsEl = document.getElementById("seconds");

        if (daysEl) daysEl.innerHTML = (days < 10 ? "0" : "") + days;
        if (hoursEl) hoursEl.innerHTML = (hours < 10 ? "0" : "") + hours;
        if (minutesEl) minutesEl.innerHTML = (minutes < 10 ? "0" : "") + minutes;
        if (secondsEl) secondsEl.innerHTML = (seconds < 10 ? "0" : "") + seconds;
            
        // If the count down is finished, write some text
        if (distance < 0) {
            clearInterval(x);
            const countdownElement = document.getElementById("countdown");
            if (countdownElement) { 
                countdownElement.innerHTML = "🎉 Acara Sedang Berlangsung! 🎉";
                countdownElement.style.fontSize = "22px";
                countdownElement.style.color = "#7a5e43";
                countdownElement.style.fontWeight = "bold";
                countdownElement.style.display = "block"; 
                countdownElement.style.textAlign = "center"; 
            }
        }
    }, 1000);
}

// Function to save event to Google Calendar
function saveEventToCalendar() {
    const eventTitle = encodeURIComponent("Walimatul Khitan Danish Maleeq Jibrani");
    const eventLocation = encodeURIComponent("Kediaman Bapak Sarmadi, Jl. Japos Raya Pondok Jati Utara, RT. 05 RW. 03, Gg Liyas Kel. Jurangmangu Barat, Kec Pondok Aren, Kota Tangerang Selatan");
    const eventDescription = encodeURIComponent("Syukuran Walimatul Khitan putra kami Danish Maleeq Jibrani. Semoga menjadi anak yang sholeh dan berbakti kepada orang tua.");
    
    // Event Start Time: 12 Juli 2025, 10:00 WIB
    // Event End Time: 12 Juli 2025, Selesai (asumsi 13:00 WIB)
    const startDate = new Date(2025, 6, 12, 10, 0, 0); // Month is 0-indexed (July is 6)
    const endDate = new Date(2025, 6, 12, 13, 0, 0); // Asumsi selesai jam 1 siang

    const formatForGoogleCalendar = (date) => {
        const pad = (num) => num < 10 ? '0' + num : num;
        return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T` +
               `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
    };

    const formattedStart = formatForGoogleCalendar(startDate);
    const formattedEnd = formatForGoogleCalendar(endDate);

    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${eventTitle}&dates=${formattedStart}/${formattedEnd}&details=${eventDescription}&location=${eventLocation}&sf=true&output=xml`;

    window.open(googleCalendarUrl, '_blank'); // Open in new tab
}

document.addEventListener('click', function(e) {
    const navItem = e.target.closest('.nav-item');
    if (navItem) {
        const ripple = document.createElement('div');
        ripple.style.cssText = `
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.4);
            transform: scale(0);
            animation: ripple 0.6s linear;
            pointer-events: none;
            opacity: 1;
        `;
        
        const rect = navItem.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
        ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
        
        navItem.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 600);
    }
});
