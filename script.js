document.addEventListener('DOMContentLoaded', () => {
    // === DOM ELEMENTS ===
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

    // === STATE VARIABLES ===
    let userImage = null;
    let templateImage = new Image();
    let scale = 1.0;
    let position = { x: 0, y: 0 };
    let isDragging = false;
    let startDrag = { x: 0, y: 0 };
    let isTemplateLoaded = false;
    let isImageProcessing = false;

    // === TEMPLATE CONFIGURATION ===
    const templateBase64 = createSampleTemplate();

    // === UTILITY FUNCTIONS ===
    
    /**
     * Menampilkan alert dengan tipe dan pesan tertentu
     */
    function showAlert(type, message) {
        hideAllAlerts();
        const alert = type === 'success' ? successAlert : 
                      type === 'error' ? errorAlert : warningAlert;
        const messageEl = type === 'success' ? successMessage : 
                          type === 'error' ? errorMessage : warningMessage;
        
        messageEl.textContent = message;
        alert.style.display = 'flex';
        
        // Auto hide after 5 seconds
        setTimeout(() => {
            alert.style.display = 'none';
        }, 5000);
    }

    /**
     * Menyembunyikan semua alert
     */
    function hideAllAlerts() {
        successAlert.style.display = 'none';
        errorAlert.style.display = 'none';
        warningAlert.style.display = 'none';
    }

    /**
     * Menampilkan loading overlay
     */
    function showLoading() {
        loadingOverlay.style.display = 'flex';
        isImageProcessing = true;
    }

    /**
     * Menyembunyikan loading overlay
     */
    function hideLoading() {
        loadingOverlay.style.display = 'none';
        isImageProcessing = false;
    }

    /**
     * Format ukuran file ke string yang readable
     */
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Update display zoom percentage
     */
    function updateZoomValue() {
        const percentage = Math.round(scale * 100);
        zoomValue.textContent = percentage + '%';
    }

    /**
     * Validasi file yang diupload
     */
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

    /**
     * Membuat template sample dengan area transparan untuk foto user
     */
    function createSampleTemplate() {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 1080;
        tempCanvas.height = 1080;
        const tempCtx = tempCanvas.getContext('2d');

        // Fill dengan background transparan
        tempCtx.clearRect(0, 0, 1080, 1080);

        // Border luar dengan gradient
        const gradient = tempCtx.createLinearGradient(0, 0, 1080, 1080);
        gradient.addColorStop(0, '#007bff');
        gradient.addColorStop(0.5, '#0056b3');
        gradient.addColorStop(1, '#004085');
        
        // Border frame (hollow di tengah untuk foto user)
        tempCtx.fillStyle = gradient;
        tempCtx.fillRect(0, 0, 1080, 150); // Top border
        tempCtx.fillRect(0, 930, 1080, 150); // Bottom border
        tempCtx.fillRect(0, 150, 150, 780); // Left border
        tempCtx.fillRect(930, 150, 150, 780); // Right border

        // Corner decorations dengan pattern
        const cornerSize = 150;
        
        // Top-left corner
        tempCtx.fillStyle = '#FFD700';
        tempCtx.beginPath();
        tempCtx.arc(0, 0, cornerSize/2, 0, Math.PI/2);
        tempCtx.fill();
        
        // Top-right corner
        tempCtx.beginPath();
        tempCtx.arc(1080, 0, cornerSize/2, Math.PI/2, Math.PI);
        tempCtx.fill();
        
        // Bottom-left corner
        tempCtx.beginPath();
        tempCtx.arc(0, 1080, cornerSize/2, -Math.PI/2, 0);
        tempCtx.fill();
        
        // Bottom-right corner
        tempCtx.beginPath();
        tempCtx.arc(1080, 1080, cornerSize/2, Math.PI, -Math.PI/2);
        tempCtx.fill();

        // Inner decorative borders
        tempCtx.strokeStyle = '#FFD700';
        tempCtx.lineWidth = 8;
        tempCtx.setLineDash([20, 10]);
        tempCtx.strokeRect(160, 160, 760, 760);
        tempCtx.setLineDash([]);

        // Text overlay di bagian bawah
        tempCtx.fillStyle = 'rgba(0, 123, 255, 0.9)';
        tempCtx.fillRect(150, 930, 780, 150);
        
        // Shadow untuk text
        tempCtx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        tempCtx.shadowBlur = 4;
        tempCtx.shadowOffsetX = 2;
        tempCtx.shadowOffsetY = 2;
        
        tempCtx.fillStyle = '#FFFFFF';
        tempCtx.font = 'bold 42px Arial';
        tempCtx.textAlign = 'center';
        tempCtx.fillText('🎨 TWIBBON GENERATOR', 540, 975);
        tempCtx.font = '28px Arial';
        tempCtx.fillText('Made with Love ❤️', 540, 1015);
        
        // Reset shadow
        tempCtx.shadowColor = 'transparent';
        tempCtx.shadowBlur = 0;
        tempCtx.shadowOffsetX = 0;
        tempCtx.shadowOffsetY = 0;

        // Decorative stars
        tempCtx.fillStyle = '#FFD700';
        const stars = [
            {x: 100, y: 75}, {x: 980, y: 75}, {x: 100, y: 1005}, {x: 980, y: 1005},
            {x: 200, y: 50}, {x: 880, y: 50}, {x: 200, y: 1030}, {x: 880, y: 1030}
        ];
        
        stars.forEach(star => {
            drawStar(tempCtx, star.x, star.y, 5, 15, 8);
        });

        return tempCanvas.toDataURL();
    }

    /**
     * Menggambar bintang
     */
    function drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        const step = Math.PI / spikes;

        ctx.beginPath();
        ctx.moveTo(cx, cy - outerRadius);
        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y);
            rot += step;

            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y);
            rot += step;
        }
        ctx.lineTo(cx, cy - outerRadius);
        ctx.closePath();
        ctx.fill();
    }

    // === CORE FUNCTIONS ===

    /**
     * Menggambar ulang canvas dengan user image dan template
     */
    function redrawCanvas() {
        if (!ctx) {
            showAlert('error', 'Canvas tidak didukung oleh browser Anda');
            return;
        }

        // Clear canvas dengan background putih
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw user image first (background layer)
        if (userImage) {
            placeholderText.style.display = 'none';
            canvas.classList.add('has-image');

            const scaledWidth = userImage.width * scale;
            const scaledHeight = userImage.height * scale;

            // Enable high-quality image smoothing
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            // Clip gambar user ke area tengah (opsional, untuk foto yang pas di frame)
            ctx.save();
            
            // Gambar foto user
            ctx.drawImage(userImage, position.x, position.y, scaledWidth, scaledHeight);
            
            ctx.restore();
        } else {
            placeholderText.style.display = 'block';
            canvas.classList.remove('has-image');
        }

        // Draw template overlay (foreground layer) - ini yang penting!
        if (isTemplateLoaded) {
            // Template ditaruh di atas foto user
            ctx.drawImage(templateImage, 0, 0, canvas.width, canvas.height);
        }

        // Debug info - hapus baris ini setelah berhasil
        if (userImage) {
            console.log('🖼️ User image drawn at:', position, 'with scale:', scale);
            console.log('📐 Image size:', userImage.width, 'x', userImage.height);
            console.log('📏 Scaled size:', userImage.width * scale, 'x', userImage.height * scale);
        }
    }

    /**
     * Mengatur status kontrol (enabled/disabled)
     */
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

    /**
     * Mendapatkan posisi event (mouse/touch) relatif terhadap canvas
     */
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

    /**
     * Reset posisi gambar ke tengah
     */
    function resetImagePosition() {
        if (!userImage) return;

        const scaledWidth = userImage.width * scale;
        const scaledHeight = userImage.height * scale;
        position = {
            x: (canvas.width - scaledWidth) / 2,
            y: (canvas.height - scaledHeight) / 2,
        };
        redrawCanvas();
    }

    /**
     * Download hasil sebagai PNG
     */
    function downloadResult() {
        if (!userImage) {
            showAlert('warning', 'Silakan upload foto terlebih dahulu!');
            return;
        }

        try {
            showLoading();
            
            // Create final canvas with high quality
            const finalCanvas = document.createElement('canvas');
            finalCanvas.width = 1080;
            finalCanvas.height = 1080;
            const finalCtx = finalCanvas.getContext('2d');
            
            // Enable high-quality rendering
            finalCtx.imageSmoothingEnabled = true;
            finalCtx.imageSmoothingQuality = 'high';

            // Draw user image
            const scaledWidth = userImage.width * scale;
            const scaledHeight = userImage.height * scale;
            finalCtx.drawImage(userImage, position.x, position.y, scaledWidth, scaledHeight);

            // Draw template overlay
            if (isTemplateLoaded) {
                finalCtx.drawImage(templateImage, 0, 0, 1080, 1080);
            }

            // Download
            const link = document.createElement('a');
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            link.download = `twibbon-${timestamp}.png`;
            link.href = finalCanvas.toDataURL('image/png', 1.0);
            link.click();

            hideLoading();
            showAlert('success', '🎉 Twibbon berhasil didownload!');
        } catch (error) {
            hideLoading();
            showAlert('error', 'Gagal mendownload. Silakan coba lagi.');
            console.error('Download error:', error);
        }
    }

    /**
     * Reset semua state
     */
    function resetAll() {
        if (!userImage) return;

        if (confirm('🔄 Yakin ingin mereset? Foto dan pengaturan akan dihapus.')) {
            userImage = null;
            scale = 1.0;
            position = { x: 0, y: 0 };
            zoomSlider.value = 1;
            updateZoomValue();
            setControlsState(false);
            imageLoader.value = '';
            fileInfo.style.display = 'none';
            redrawCanvas();
            showAlert('success', 'Reset berhasil! Silakan upload foto baru.');
        }
    }

    // === EVENT LISTENERS ===

    /**
     * Template Image Loading
     */
    templateImage.onload = () => {
        isTemplateLoaded = true;
        redrawCanvas();
        showAlert('success', '🎨 Generator siap digunakan! Upload foto untuk memulai.');
        console.log('✅ Template berhasil dimuat');
    };

    templateImage.onerror = () => {
        showAlert('error', 'Template gagal dimuat. Silakan refresh halaman.');
        console.error('❌ Template gagal dimuat');
    };

    // Load template
    templateImage.src = templateBase64;

    /**
     * File Upload Handler
     */
    imageLoader.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            validateFile(file);
            showLoading();
            hideAllAlerts();
            
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
                    console.log('✅ Image loaded successfully:', {
                        width: userImage.width,
                        height: userImage.height,
                        naturalWidth: userImage.naturalWidth,
                        naturalHeight: userImage.naturalHeight
                    });

                    // Auto-scale to fit canvas nicely
                    const scaleX = canvas.width / userImage.width;
                    const scaleY = canvas.height / userImage.height;
                    scale = Math.min(scaleX, scaleY) * 1.2; // Lebih besar agar mengisi area
                    
                    // Batasi scale maksimal
                    if (scale > 2.5) scale = 2.5;
                    if (scale < 0.3) scale = 0.3;
                    
                    console.log('📏 Calculated scale:', scale);
                    
                    // Center the image
                    resetImagePosition();

                    zoomSlider.value = scale;
                    updateZoomValue();
                    setControlsState(true);
                    
                    // Redraw dengan delay untuk memastikan semua ready
                    setTimeout(() => {
                        redrawCanvas();
                        console.log('🎨 Canvas redrawn with user image');
                    }, 100);
                    
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

    /**
     * Zoom Control Handler
     */
    zoomSlider.addEventListener('input', (e) => {
        if (!userImage) return;

        const oldScale = scale;
        scale = parseFloat(e.target.value);
        updateZoomValue();

        // Zoom towards center point
        const oldWidth = userImage.width * oldScale;
        const newWidth = userImage.width * scale;
        position.x -= (newWidth - oldWidth) / 2;

        const oldHeight = userImage.height * oldScale;
        const newHeight = userImage.height * scale;
        position.y -= (newHeight - oldHeight) / 2;

        redrawCanvas();
    });

    // === DRAG & DROP FUNCTIONALITY ===

    /**
     * Mouse Events
     */
    canvas.addEventListener('mousedown', (e) => {
        if (!userImage || isImageProcessing) return;
        isDragging = true;
        canvas.style.cursor = 'grabbing';
        const pos = getEventPosition(e);
        startDrag = {
            x: pos.x - position.x,
            y: pos.y - position.y
        };
        e.preventDefault();
    });

    canvas.addEventListener('mousemove', (e) => {
        if (isDragging && userImage && !isImageProcessing) {
            const pos = getEventPosition(e);
            position = {
                x: pos.x - startDrag.x,
                y: pos.y - startDrag.y
            };
            redrawCanvas();
        }
    });

    canvas.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            canvas.style.cursor = userImage ? 'grab' : 'default';
        }
    });

    canvas.addEventListener('mouseleave', () => {
        if (isDragging) {
            isDragging = false;
            canvas.style.cursor = userImage ? 'grab' : 'default';
        }
    });

    /**
     * Touch Events for Mobile
     */
    canvas.addEventListener('touchstart', (e) => {
        if (!userImage || isImageProcessing) return;
        isDragging = true;
        const pos = getEventPosition(e);
        startDrag = {
            x: pos.x - position.x,
            y: pos.y - position.y
        };
        e.preventDefault();
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
        if (isDragging && userImage && !isImageProcessing) {
            const pos = getEventPosition(e);
            position = {
                x: pos.x - startDrag.x,
                y: pos.y - startDrag.y
            };
            redrawCanvas();
        }
        e.preventDefault();
    }, { passive: false });

    canvas.addEventListener('touchend', () => {
        isDragging = false;
    });

    /**
     * Double-click to reset position
     */
    canvas.addEventListener('dblclick', () => {
        if (userImage) {
            resetImagePosition();
            showAlert('success', '📍 Posisi gambar direset ke tengah');
        }
    });

    // === BUTTON EVENT LISTENERS ===

    downloadBtn.addEventListener('click', downloadResult);
    resetBtn.addEventListener('click', resetAll);

    // === KEYBOARD SHORTCUTS ===

    document.addEventListener('keydown', (e) => {
        if (!userImage || isImageProcessing) return;

        const moveStep = 10;
        const zoomStep = 0.05;

        switch (e.key) {
            case 'ArrowLeft':
                position.x -= moveStep;
                redrawCanvas();
                e.preventDefault();
                break;
            case 'ArrowRight':
                position.x += moveStep;
                redrawCanvas();
                e.preventDefault();
                break;
            case 'ArrowUp':
                position.y -= moveStep;
                redrawCanvas();
                e.preventDefault();
                break;
            case 'ArrowDown':
                position.y += moveStep;
                redrawCanvas();
                e.preventDefault();
                break;
            case '+':
            case '=':
                if (scale < 2.5) {
                    scale = Math.min(2.5, scale + zoomStep);
                    zoomSlider.value = scale;
                    updateZoomValue();
                    redrawCanvas();
                }
                e.preventDefault();
                break;
            case '-':
                if (scale > 0.3) {
                    scale = Math.max(0.3, scale - zoomStep);
                    zoomSlider.value = scale;
                    updateZoomValue();
                    redrawCanvas();
                }
                e.preventDefault();
                break;
            case 'r':
            case 'R':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    resetImagePosition();
                    showAlert('success', '📍 Posisi gambar direset ke tengah');
                }
                break;
            case 'd':
            case 'D':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    downloadResult();
                }
                break;
        }
    });

    // === RESPONSIVE HANDLING ===

    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            if (userImage) {
                redrawCanvas();
            }
        }, 100);
    });

    // === DRAG AND DROP FILE UPLOAD ===

    canvas.addEventListener('dragover', (e) => {
        e.preventDefault();
        canvas.style.borderColor = '#007bff';
        canvas.style.backgroundColor = 'rgba(0, 123, 255, 0.05)';
    });

    canvas.addEventListener('dragleave', (e) => {
        e.preventDefault();
        canvas.style.borderColor = '';
        canvas.style.backgroundColor = '';
    });

    canvas.addEventListener('drop', (e) => {
        e.preventDefault();
        canvas.style.borderColor = '';
        canvas.style.backgroundColor = '';

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            // Simulate file input change
            const dt = new DataTransfer();
            dt.items.add(file);
            imageLoader.files = dt.files;
            imageLoader.dispatchEvent(new Event('change'));
        }
    });

    // === INITIAL WELCOME MESSAGE ===
    setTimeout(() => {
        if (!userImage) {
            showAlert('success', '👋 Selamat datang! Upload foto untuk membuat twibbon keren.');
        }
    }, 1000);

    console.log('🎨 Twibbon Generator berhasil dimuat!');
    console.log('⌨️ Keyboard shortcuts:');
    console.log('   • Arrow keys: Geser gambar');
    console.log('   • +/- : Zoom in/out');
    console.log('   • Ctrl+R: Reset posisi');
    console.log('   • Ctrl+D: Download');
    console.log('   • Double-click: Reset posisi ke tengah');
});
