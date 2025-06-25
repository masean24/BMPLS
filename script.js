document.addEventListener('DOMContentLoaded', () => {
    // --- Ambil Elemen dari DOM ---
    const canvas = document.getElementById('twibbonCanvas');
    const ctx = canvas.getContext('2d');
    const imageLoader = document.getElementById('imageLoader');
    const zoomSlider = document.getElementById('zoomSlider');
    const zoomValue = document.getElementById('zoomValue');
    const downloadBtn = document.getElementById('downloadBtn');
    const resetBtn = document.getElementById('resetBtn');
    const placeholderText = document.getElementById('placeholder-text');
    const fileInfo = document.getElementById('fileInfo');
    const dragHint = document.getElementById('dragHint');
    const loadingOverlay = document.getElementById('loadingOverlay');

    // Alert elements
    const successAlert = document.getElementById('successAlert');
    const errorAlert = document.getElementById('errorAlert');
    const warningAlert = document.getElementById('warningAlert');
    const successMessage = document.getElementById('successMessage');
    const errorMessage = document.getElementById('errorMessage');
    const warningMessage = document.getElementById('warningMessage');

    // --- Variabel State ---
    let userImage = null;
    let templateImage = new Image();
    let scale = 1.0;
    let position = { x: 0, y: 0 };
    let isDragging = false;
    let startDrag = { x: 0, y: 0 };
    let isTemplateLoaded = false;

    // --- Template Image (menggunakan base64 contoh) ---
    // Untuk demo, saya buat template sederhana. Ganti dengan template asli Anda
    const templateBase64 = createSampleTemplate();

    // --- Utility Functions ---
    function showAlert(type, message) {
        hideAllAlerts();
        const alert = type === 'success' ? successAlert : 
                      type === 'error' ? errorAlert : warningAlert;
        const messageEl = type === 'success' ? successMessage : 
                          type === 'error' ? errorMessage : warningMessage;
        
        messageEl.textContent = message;
        alert.style.display = 'flex';
        
        setTimeout(() => {
            alert.style.display = 'none';
        }, 5000);
    }

    function hideAllAlerts() {
        successAlert.style.display = 'none';
        errorAlert.style.display = 'none';
        warningAlert.style.display = 'none';
    }

    function showLoading() {
        loadingOverlay.style.display = 'flex';
    }

    function hideLoading() {
        loadingOverlay.style.display = 'none';
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function updateZoomValue() {
        const percentage = Math.round(scale * 100);
        zoomValue.textContent = percentage + '%';
    }

    // --- Template Creation (Sample) ---
    function createSampleTemplate() {
        const canvas = document.createElement('canvas');
        canvas.width = 1080;
        canvas.height = 1080;
        const ctx = canvas.getContext('2d');

        // Background gradient
        const gradient = ctx.createLinearGradient(0, 0, 1080, 1080);
        gradient.addColorStop(0, 'rgba(0, 123, 255, 0.1)');
        gradient.addColorStop(1, 'rgba(0, 123, 255, 0.05)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1080, 1080);

        // Frame border
        ctx.strokeStyle = '#007bff';
        ctx.lineWidth = 20;
        ctx.strokeRect(50, 50, 980, 980);

        // Corner decorations
        ctx.fillStyle = '#007bff';
        ctx.fillRect(0, 0, 150, 150);
        ctx.fillRect(930, 0, 150, 150);
        ctx.fillRect(0, 930, 150, 150);
        ctx.fillRect(930, 930, 150, 150);

        // Sample text overlay
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(200, 900, 680, 120);
        
        ctx.fillStyle = '#007bff';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('TWIBBON GENERATOR', 540, 950);
        ctx.font = '32px Arial';
        ctx.fillText('Created with ❤️', 540, 990);

        return canvas.toDataURL();
    }

    // --- Fungsi Utama ---
    function redrawCanvas() {
        if (!ctx) {
            showAlert('error', 'Canvas tidak didukung oleh browser Anda');
            return;
        }

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw user image first (background)
        if (userImage) {
            placeholderText.style.display = 'none';
            canvas.classList.add('has-image');

            const scaledWidth = userImage.width * scale;
            const scaledHeight = userImage.height * scale;

            // Enable image smoothing for better quality
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            ctx.drawImage(userImage, position.x, position.y, scaledWidth, scaledHeight);
        } else {
            placeholderText.style.display = 'block';
            canvas.classList.remove('has-image');
        }

        // Draw template overlay (foreground)
        if (isTemplateLoaded) {
            ctx.drawImage(templateImage, 0, 0, canvas.width, canvas.height);
        }
    }

    function setControlsState(enabled) {
        zoomSlider.disabled = !enabled;
        downloadBtn.disabled = !enabled;
        resetBtn.disabled = !enabled;
        
        if (enabled) {
            dragHint.style.display = 'block';
            showAlert('success', 'Foto berhasil dimuat! Sekarang atur posisi dan ukurannya.');
        } else {
            dragHint.style.display = 'none';
        }
    }

    function validateFile(file) {
        const maxSize = 10 * 1024 * 1024; // 10MB
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

        if (!allowedTypes.includes(file.type)) {
            throw new Error('Format file tidak didukung. Gunakan JPG, PNG, atau WebP.');
        }

        if (file.size > maxSize) {
            throw new Error('Ukuran file terlalu besar. Maksimal 10MB.');
        }

        return true;
    }

    // --- Event Listeners ---

    // Template loading
    templateImage.onload = () => {
        isTemplateLoaded = true;
        redrawCanvas();
        console.log('Template berhasil dimuat');
    };

    templateImage.onerror = () => {
        showAlert('error', 'Template gagal dimuat. Silakan refresh halaman.');
        console.error('Template gagal dimuat');
    };

    // Load template
    templateImage.src = templateBase64;

    // File upload
    imageLoader.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            validateFile(file);
            showLoading();
            
            // Show file info
            fileInfo.innerHTML = `
                <strong>📄 File:</strong> ${file.name}<br>
                <strong>📏 Ukuran:</strong> ${formatFileSize(file.size)}
            `;
            fileInfo.style.display = 'block';

            const reader = new FileReader();
            reader.onload = (event) => {
                userImage = new Image();
                userImage.onload = () => {
                    // Auto-scale to fit canvas
                    const scaleX = canvas.width / userImage.width;
                    const scaleY = canvas.height / userImage.height;
                    scale = Math.max(scaleX, scaleY) * 0.8; // Slightly smaller than full fit
                    
                    // Center the image
                    const scaledWidth = userImage.width * scale;
                    const scaledHeight = userImage.height * scale;
                    position = {
                        x: (canvas.width - scaledWidth) / 2,
                        y: (canvas.height - scaledHeight) / 2,
                    };

                    zoomSlider.value = scale;
                    updateZoomValue();
                    setControlsState(true);
                    redrawCanvas();
                    hideLoading();
                };

                userImage.onerror = () => {
                    hideLoading();
                    showAlert('error', 'Gagal memuat gambar. Pastikan file tidak rusak.');
                };

                userImage.src = event.target.result;
            };

            reader.onerror = () => {
                hideLoading();
                showAlert('error', 'Gagal membaca file. Silakan coba lagi.');
            };

            reader.readAsDataURL(file);
        } catch (error) {
            showAlert('error', error.message);
            imageLoader.value = '';
            fileInfo.style.display = 'none';
        }
    });

    // Zoom control
    zoomSlider.addEventListener('input', (e) => {
        if (!userImage) return;

        const oldScale = scale;
        scale = parseFloat(e.target.value);
        updateZoomValue();

        // Zoom towards center
        const oldWidth = userImage.width * oldScale;
        const newWidth = userImage.width * scale;
        position.x -= (newWidth - oldWidth) / 2;

        const oldHeight = userImage.height * oldScale;
        const newHeight = userImage.height * scale;
        position.y -= (newHeight - oldHeight) / 2;

        redrawCanvas();
    });

    // --- Drag & Drop Logic ---
    function getEventPosition(event) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        if (event.touches) {
            return {
                x: (event.touches[0].clientX - rect.left) * scaleX,
                y: (event.touches[0].clientY - rect.top) * scaleY
            };
        }
        return {
            x: (event.clientX - rect.left) * scaleX,
            y: (event.clientY - rect.top) * scaleY
        };
    }

    // Mouse events
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

    canvas.addEventListener('mouseup', () => {
        isDragging = false;
        canvas.style.cursor = userImage ? 'grab' : 'default';
    });

    canvas.addEventListener('mouseleave', () => {
        isDragging = false;
        canvas.style.cursor = userImage ? 'grab' : 'default';
    });

    // Touch events
    canvas.addEventListener('touchstart', (e) => {
        if (!userImage) return;
        isDragging = true;
        const pos = getEventPosition(e);
        startDrag = {
            x: pos.x - position.x,
            y: pos.y - position.y
        };
        e.preventDefault();
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

    canvas.addEventListener('touchend', () => {
        isDragging = false;
    });

    // Action buttons
    resetBtn.addEventListener('click', () => {
        if (confirm('Yakin ingin mengulang dari awal? Semua perubahan akan hilang.')) {
            userImage = null;
            imageLoader.value = '';
            fileInfo.style.display = 'none';
            scale = 1.0;
            position = { x: 0, y: 0 };
            zoomSlider.value = 1.0;
            updateZoomValue();
            setControlsState(false);
            redrawCanvas();
            showAlert('success', 'Berhasil direset! Silakan upload foto baru.');
        }
    });

    downloadBtn.addEventListener('click', () => {
        try {
            const link = document.createElement('a');
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            link.download = `twibbon-${timestamp}.png`;
            link.href = canvas.toDataURL('image/png', 1.0);
            link.click();
            showAlert('success', 'Twibbon berhasil didownload! 🎉');
        } catch (error) {
            showAlert('error', 'Gagal mendownload gambar. Silakan coba lagi.');
            console.error('Download error:', error);
        }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (!userImage) return;
        
        const moveStep = 10;
        let moved = false;

        switch(e.key) {
            case 'ArrowUp':
                position.y -= moveStep;
                moved = true;
                break;
            case 'ArrowDown':
                position.y += moveStep;
                moved = true;
                break;
            case 'ArrowLeft':
                position.x -= moveStep;
                moved = true;
                break;
            case 'ArrowRight':
                position.x += moveStep;
                moved = true;
                break;
            case '+':
            case '=':
                if (scale < 2.5) {
                    scale += 0.1;
                    zoomSlider.value = scale;
                    updateZoomValue();
                    moved = true;
                }
                break;
            case '-':
                if (scale > 0.3) {
                    scale -= 0.1;
                    zoomSlider.value = scale;
                    updateZoomValue();
                    moved = true;
                }
                break;
        }

        if (moved) {
            e.preventDefault();
            redrawCanvas();
        }
    });

    // Double click to reset position
    canvas.addEventListener('dblclick', () => {
        if (!userImage) return;
        
        // Center the image
        const scaledWidth = userImage.width * scale;
        const scaledHeight = userImage.height * scale;
        position = {
            x: (canvas.width - scaledWidth) / 2,
            y: (canvas.height - scaledHeight) / 2,
        };
        redrawCanvas();
        showAlert('success', 'Posisi gambar dikembalikan ke tengah');
    });

    // Prevent context menu on canvas
    canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });

    // Handle window resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            redrawCanvas();
        }, 250);
    });

    // Initialize
    setControlsState(false);
    updateZoomValue();
    
    // Show welcome message
    setTimeout(() => {
        showAlert('success', 'Selamat datang! Upload foto untuk mulai membuat twibbon.');
    }, 1000);

    // Add some helpful tooltips
    const addTooltip = (element, text) => {
        element.title = text;
    };

    addTooltip(zoomSlider, 'Gunakan slider ini atau tombol +/- untuk zoom');
    addTooltip(canvas, 'Klik dan seret untuk menggeser foto, atau gunakan tombol panah. Double-click untuk reset posisi ke tengah');
    addTooltip(downloadBtn, 'Download hasil twibbon dalam format PNG berkualitas tinggi');
    addTooltip(resetBtn, 'Hapus foto dan mulai dari awal');

    console.log('🎨 Twibbon Generator berhasil dimuat!');
});
