// Menunggu seluruh halaman HTML dimuat sebelum menjalankan script
document.addEventListener('DOMContentLoaded', () => {

    console.log("DOM siap, script mulai dijalankan.");

    // --- Ambil Elemen dari DOM ---
    const canvas = document.getElementById('twibbonCanvas');
    const ctx = canvas.getContext('2d');
    const imageLoader = document.getElementById('imageLoader');
    const zoomSlider = document.getElementById('zoomSlider');
    const downloadBtn = document.getElementById('downloadBtn');
    const resetBtn = document.getElementById('resetBtn');
    const placeholderText = document.getElementById('placeholderText');
    const loadingIndicator = document.getElementById('loadingIndicator');

    // --- Variabel State ---
    let userImage = null;
    let templateImage = new Image();
    let scale = 1.0;
    let position = { x: 0, y: 0 };
    let isDragging = false;
    let startDrag = { x: 0, y: 0 };
    
    // --- Optimasi untuk Layar Hi-DPI / Retina ---
    // Kode ini membuat canvas tetap tajam di layar modern
    const dpi = window.devicePixelRatio || 1;
    const style_width = +getComputedStyle(canvas).getPropertyValue("width").slice(0, -2);
    const style_height = +getComputedStyle(canvas).getPropertyValue("height").slice(0, -2);
    canvas.setAttribute('width', style_width * dpi);
    canvas.setAttribute('height', style_height * dpi);
    ctx.scale(dpi, dpi);
    console.log("Canvas dioptimasi untuk layar Hi-DPI dengan rasio:", dpi);

    // --- Fungsi Utama ---

    function redrawCanvas() {
        ctx.clearRect(0, 0, canvas.width / dpi, canvas.height / dpi);
        if (userImage) {
            placeholderText.style.display = 'none';
            const scaledWidth = userImage.width * scale;
            const scaledHeight = userImage.height * scale;
            ctx.drawImage(userImage, position.x, position.y, scaledWidth, scaledHeight);
        } else {
            placeholderText.style.display = 'block';
        }
        ctx.drawImage(templateImage, 0, 0, canvas.width / dpi, canvas.height / dpi);
    }

    function setControlsState(enabled) {
        zoomSlider.disabled = !enabled;
        downloadBtn.disabled = !enabled;
        resetBtn.disabled = !enabled;
    }

    // --- Event Listener ---

    templateImage.onload = () => {
        console.log("Gambar template berhasil dimuat.");
        redrawCanvas();
    };
    templateImage.onerror = () => {
        console.error("GAGAL memuat gambar template! Pastikan file 'template.png' ada dan tidak rusak.");
        alert("Gagal memuat file template.png!");
    };
    templateImage.src = './template.png';

    imageLoader.addEventListener('change', (e) => {
        const file = e.target.files[0];

        if (!file) {
            console.log("Pemilihan file dibatalkan oleh pengguna.");
            return;
        }

        if (!file.type.startsWith('image/')) {
            alert("File yang Anda pilih bukan gambar. Silakan pilih file .jpg atau .png.");
            console.warn("Tipe file tidak valid:", file.type);
            return;
        }

        const reader = new FileReader();
        console.log("1. FileReader mulai membaca file...");

        reader.onload = (event) => {
            console.log("2. FileReader selesai. Membuat object Image dari data...");
            userImage = new Image();
            
            userImage.onload = () => {
                console.log("3. Object Image BERHASIL dimuat. Mengatur posisi & skala awal.");
                loadingIndicator.style.display = 'none';

                // Skala awal agar gambar pas dengan canvas
                scale = Math.max((canvas.width / dpi) / userImage.width, (canvas.height / dpi) / userImage.height);
                zoomSlider.value = scale;
                position = {
                    x: ((canvas.width / dpi) - userImage.width * scale) / 2,
                    y: ((canvas.height / dpi) - userImage.height * scale) / 2,
                };
                
                console.log("4. Mengaktifkan tombol kontrol.");
                setControlsState(true);
                redrawCanvas();
                console.log("5. Proses selesai. Gambar pengguna ditampilkan.");
            };

            userImage.onerror = () => {
                console.error("GAGAL memuat data gambar. File mungkin rusak atau format tidak didukung.");
                alert("Gagal memuat file gambar yang Anda pilih. Coba gunakan file lain.");
                loadingIndicator.style.display = 'none';
            };
            
            userImage.src = event.target.result;
        };
        
        reader.onerror = () => {
             console.error("GAGAL membaca file dengan FileReader.");
             alert("Terjadi kesalahan saat membaca file. Coba lagi.");
             loadingIndicator.style.display = 'none';
        };

        loadingIndicator.style.display = 'block';
        reader.readAsDataURL(file);
    });

    // --- Sisa Event Listener (Zoom, Drag, Tombol) ---
    // Kode ini umumnya sudah benar dan tidak perlu diubah.

    zoomSlider.addEventListener('input', (e) => {
        if (!userImage) return;
        const oldScale = scale;
        scale = parseFloat(e.target.value);
        position.x -= (userImage.width * scale - userImage.width * oldScale) / 2;
        position.y -= (userImage.height * scale - userImage.height * oldScale) / 2;
        redrawCanvas();
    });

    function getEventPosition(event) {
        const rect = canvas.getBoundingClientRect();
        const clientX = event.touches ? event.touches[0].clientX : event.clientX;
        const clientY = event.touches ? event.touches[0].clientY : event.clientY;
        return {
            x: (clientX - rect.left) / (rect.width / (canvas.width / dpi)),
            y: (clientY - rect.top) / (rect.height / (canvas.height / dpi))
        };
    }

    function startDragging(e) {
        if (!userImage) return;
        isDragging = true;
        canvas.style.cursor = 'grabbing';
        const pos = getEventPosition(e);
        startDrag = { x: pos.x - position.x, y: pos.y - position.y };
        if (e.touches) e.preventDefault();
    }

    function doDrag(e) {
        if (!isDragging || !userImage) return;
        const pos = getEventPosition(e);
        position = { x: pos.x - startDrag.x, y: pos.y - startDrag.y };
        redrawCanvas();
        if (e.touches) e.preventDefault();
    }

    function stopDragging() {
        isDragging = false;
        canvas.style.cursor = 'grab';
    }

    canvas.addEventListener('mousedown', startDragging);
    canvas.addEventListener('touchstart', startDragging);
    canvas.addEventListener('mousemove', doDrag);
    canvas.addEventListener('touchmove', doDrag);
    canvas.addEventListener('mouseup', stopDragging);
    canvas.addEventListener('touchend', stopDragging);
    canvas.addEventListener('mouseleave', stopDragging);

    resetBtn.addEventListener('click', () => {
        userImage = null;
        imageLoader.value = '';
        scale = 1.0;
        zoomSlider.value = 1.0;
        setControlsState(false);
        redrawCanvas();
        console.log("Resetting aplication state.");
    });

    downloadBtn.addEventListener('click', () => {
        const link = document.createElement('a');
        link.download = 'twibbon-hasil.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        console.log("Downloading image...");
    });

    // Inisialisasi awal
    setControlsState(false);
});
