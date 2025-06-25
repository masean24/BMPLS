document.addEventListener('DOMContentLoaded', () => {
    // --- Ambil Elemen dari DOM ---
    const canvas = document.getElementById('twibbonCanvas');
    const ctx = canvas.getContext('2d');
    const imageLoader = document.getElementById('imageLoader');
    const zoomSlider = document.getElementById('zoomSlider');
    const downloadBtn = document.getElementById('downloadBtn');
    const resetBtn = document.getElementById('resetBtn');
    const placeholderText = document.getElementById('placeholder-text');

    // --- Variabel State ---
    let userImage = null;
    let templateImage = new Image();
    templateImage.src = 'template.png'; // Pastikan nama file sesuai

    let scale = 1.0;
    let position = { x: 0, y: 0 };
    let isDragging = false;
    let startDrag = { x: 0, y: 0 };

    // --- Fungsi Utama ---

    // Fungsi untuk menggambar ulang semua elemen di canvas
    function redrawCanvas() {
        // 1. Bersihkan canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 2. Gambar foto pengguna (jika ada)
        if (userImage) {
            // Sembunyikan teks placeholder jika ada gambar
            placeholderText.style.display = 'none';

            // Hitung dimensi gambar setelah di-zoom
            const scaledWidth = userImage.width * scale;
            const scaledHeight = userImage.height * scale;

            // Gambar foto pengguna dengan posisi dan skala yang sudah diatur
            ctx.drawImage(userImage, position.x, position.y, scaledWidth, scaledHeight);
        } else {
             placeholderText.style.display = 'block';
        }

        // 3. Gambar template Twibbon di atasnya
        ctx.drawImage(templateImage, 0, 0, canvas.width, canvas.height);
    }

    // Fungsi untuk mengaktifkan/menonaktifkan tombol
    function setControlsState(enabled) {
        zoomSlider.disabled = !enabled;
        downloadBtn.disabled = !enabled;
        resetBtn.disabled = !enabled;
    }

    // --- Event Listener ---

    // Ketika template Twibbon selesai dimuat
    templateImage.onload = () => {
        redrawCanvas(); // Langsung gambar template-nya
    };

    // Ketika pengguna memilih file foto
    imageLoader.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            userImage = new Image();
            userImage.onload = () => {
                // Reset posisi dan skala ke default saat gambar baru dimuat
                scale = Math.max(canvas.width / userImage.width, canvas.height / userImage.height);
                zoomSlider.value = scale;
                position = {
                    x: (canvas.width - userImage.width * scale) / 2,
                    y: (canvas.height - userImage.height * scale) / 2,
                };
                
                setControlsState(true);
                redrawCanvas();
            };
            userImage.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });

    // Ketika slider zoom diubah
    zoomSlider.addEventListener('input', (e) => {
        if (!userImage) return;

        const oldScale = scale;
        scale = parseFloat(e.target.value);

        // Logika agar zoom terasa berpusat pada gambar
        const oldWidth = userImage.width * oldScale;
        const newWidth = userImage.width * scale;
        position.x -= (newWidth - oldWidth) / 2;

        const oldHeight = userImage.height * oldScale;
        const newHeight = userImage.height * scale;
        position.y -= (newHeight - oldHeight) / 2;

        redrawCanvas();
    });

    // --- Logika Drag & Drop (Geser Posisi) ---
    function getEventPosition(event) {
        const rect = canvas.getBoundingClientRect();
        if (event.touches) { // Untuk layar sentuh (mobile)
            return {
                x: event.touches[0].clientX - rect.left,
                y: event.touches[0].clientY - rect.top
            };
        }
        // Untuk mouse (desktop)
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
    }

    canvas.addEventListener('mousedown', (e) => {
        if (!userImage) return;
        isDragging = true;
        canvas.style.cursor = 'grabbing';
        const pos = getEventPosition(e);
        startDrag = {
            x: pos.x - position.x,
            y: pos.y - position.y
        };
    });

    canvas.addEventListener('touchstart', (e) => {
        if (!userImage) return;
        isDragging = true;
        const pos = getEventPosition(e);
        startDrag = {
            x: pos.x - position.x,
            y: pos.y - position.y
        };
        e.preventDefault(); // Mencegah scrolling halaman saat drag di canvas
    });

    canvas.addEventListener('mousemove', (e) => {
        if (isDragging && userImage) {
            const pos = getEventPosition(e);
            position = {
                x: pos.x - startDrag.x,
                y: pos.y - startDrag.y
            };
            redrawCanvas();
        }
    });

    canvas.addEventListener('touchmove', (e) => {
        if (isDragging && userImage) {
            const pos = getEventPosition(e);
            position = {
                x: pos.x - startDrag.x,
                y: pos.y - startDrag.y
            };
            redrawCanvas();
            e.preventDefault();
        }
    });

    // Hentikan proses dragging
    function stopDragging() {
        isDragging = false;
        canvas.style.cursor = 'grab';
    }
    canvas.addEventListener('mouseup', stopDragging);
    canvas.addEventListener('touchend', stopDragging);
    canvas.addEventListener('mouseleave', stopDragging);

    // --- Logika Tombol Aksi ---

    // Tombol Reset
    resetBtn.addEventListener('click', () => {
        userImage = null;
        imageLoader.value = ''; // Mengosongkan input file
        scale = 1.0;
        position = { x: 0, y: 0 };
        zoomSlider.value = 1.0;
        setControlsState(false);
        redrawCanvas();
    });

    // Tombol Download
    downloadBtn.addEventListener('click', () => {
        // Membuat link sementara untuk di-klik
        const link = document.createElement('a');
        link.download = 'twibbon-hasil.png'; // Nama file hasil download
        link.href = canvas.toDataURL('image/png'); // Mengubah isi canvas menjadi data URL
        link.click();
    });

    // Inisialisasi awal
    setControlsState(false);
});