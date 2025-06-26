// Dark Mode Functionality - Tambahkan ini ke bagian atas script.js

// === DARK MODE SETUP ===
function initTheme() {
    const themeToggle = document.getElementById('themeToggle');
    const savedTheme = localStorage.getItem('theme') || 'light';
    
    // Set initial theme
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
    
    // Theme toggle event
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
        
        // Show theme change notification
        showAlert('success', `Mode ${newTheme === 'dark' ? 'gelap' : 'terang'} diaktifkan! 🎨`);
    });
}

function updateThemeIcon(theme) {
    const themeToggle = document.getElementById('themeToggle');
    themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
    themeToggle.title = theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';
}

// Call initTheme when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize theme first
    initTheme();
    
    // ... rest of your existing code ...

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
    const templateUrl = 'https://raw.githubusercontent.com/masean24/tes-aja/main/template.png';

    // === UTILITY FUNCTIONS ===
    
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
        isImageProcessing = true;
    }

    function hideLoading() {
        loadingOverlay.style.display = 'none';
        isImageProcessing = false;
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

    function createSampleTemplate() {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 1080;
        tempCanvas.height = 1080;
        const tempCtx = tempCanvas.getContext('2d');

        // Background transparan untuk area foto
        tempCtx.clearRect(0, 0, 1080, 1080);

        // Border frame dengan area tengah transparan untuk foto user
        const gradient = tempCtx.createLinearGradient(0, 0, 1080, 1080);
        gradient.addColorStop(0, '#007bff');
        gradient.addColorStop(0.5, '#0056b3');
        gradient.addColorStop(1, '#004085');
        
        // Top border
        tempCtx.fillStyle = gradient;
        tempCtx.fillRect(0, 0, 1080, 150);
        
        // Bottom border
        tempCtx.fillRect(0, 930, 1080, 150);
        
        // Left border
        tempCtx.fillRect(0, 150, 150, 780);
        
        // Right border
        tempCtx.fillRect(930, 150, 150, 780);

        // Corner decorations
        const cornerSize = 150;
        tempCtx.fillStyle = '#FFD700';
        
        // Top-left corner
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

        // Inner decorative border
        tempCtx.strokeStyle = '#FFD700';
        tempCtx.lineWidth = 8;
        tempCtx.setLineDash([20, 10]);
        tempCtx.strokeRect(160, 160, 760, 760);
        tempCtx.setLineDash([]);

        // Text overlay di bagian bawah
        tempCtx.fillStyle = 'rgba(0, 123, 255, 0.9)';
        tempCtx.fillRect(150, 930, 780, 150);
        
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
     * FUNGSI UTAMA: Menggambar ulang canvas
     * PERBAIKAN: Urutan drawing yang benar dan debugging
     */
    function redrawCanvas() {
        if (!ctx) {
            showAlert('error', 'Canvas tidak didukung oleh browser Anda');
            return;
        }

        console.log('🎨 Redrawing canvas...');
        console.log('   - User image:', !!userImage);
        console.log('   - Template loaded:', isTemplateLoaded);
        console.log('   - Position:', position);
        console.log('   - Scale:', scale);

        // 1. Clear canvas dengan background putih
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 2. Draw user image FIRST (sebagai background)
        if (userImage) {
            placeholderText.style.display = 'none';
            canvas.classList.add('has-image');

            const scaledWidth = userImage.width * scale;
            const scaledHeight = userImage.height * scale;

            // Enable high-quality rendering
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            console.log('   - Drawing user image:', {
                x: position.x,
                y: position.y,
                width: scaledWidth,
                height: scaledHeight
            });

            // Draw user photo
            ctx.drawImage(userImage, position.x, position.y, scaledWidth, scaledHeight);
        } else {
            placeholderText.style.display = 'block';
            canvas.classList.remove('has-image');
        }

        // 3. Draw template OVER the user image
        if (isTemplateLoaded && templateImage.complete) {
            console.log('   - Drawing template overlay');
            ctx.drawImage(templateImage, 0, 0, canvas.width, canvas.height);
        } else {
            console.log('   - Template not ready for drawing');
        }

        console.log('✅ Canvas redraw complete');
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

    function downloadResult() {
        if (!userImage) {
            showAlert('warning', 'Silakan upload foto terlebih dahulu!');
            return;
        }

        try {
            showLoading();
            
            const finalCanvas = document.createElement('canvas');
            finalCanvas.width = 1080;
            finalCanvas.height = 1080;
            const finalCtx = finalCanvas.getContext('2d');
            
            finalCtx.imageSmoothingEnabled = true;
            finalCtx.imageSmoothingQuality = 'high';

            // White background
            finalCtx.fillStyle = '#FFFFFF';
            finalCtx.fillRect(0, 0, 1080, 1080);

            // Draw user image first
            const scaledWidth = userImage.width * scale;
            const scaledHeight = userImage.height * scale;
            finalCtx.drawImage(userImage, position.x, position.y, scaledWidth, scaledHeight);

            // Draw template overlay
            if (isTemplateLoaded && templateImage.complete) {
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
     * PERBAIKAN: Template loading dengan error handling yang lebih baik
     */
    templateImage.onload = () => {
        console.log('✅ Template berhasil dimuat dari:', templateUrl);
        isTemplateLoaded = true;
        
        // Force redraw setelah template dimuat
        setTimeout(() => {
            redrawCanvas();
            showAlert('success', '🎨 Generator siap digunakan! Upload foto untuk memulai.');
        }, 100);
    };

    templateImage.onerror = (error) => {
        console.warn('⚠️ Template dari GitHub gagal dimuat:', error);
        showAlert('warning', 'Template utama tidak tersedia, menggunakan template alternatif.');
        
        // Fallback ke template sample
        const sampleTemplate = new Image();
        sampleTemplate.onload = () => {
            console.log('✅ Template sample berhasil dimuat');
            templateImage = sampleTemplate;
            isTemplateLoaded = true;
            
            setTimeout(() => {
                redrawCanvas();
            }, 100);
        };
        sampleTemplate.src = createSampleTemplate();
    };

    // Load template dengan CORS handling
    console.log('🔄 Memuat template dari:', templateUrl);
    templateImage.crossOrigin = 'anonymous';
    templateImage.src = templateUrl;

    /**
     * PERBAIKAN: File upload handler yang lebih robust
     */
    imageLoader.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            validateFile(file);
            showLoading();
            hideAllAlerts();
            
            fileInfo.innerHTML = `
                <strong>📄 File:</strong> ${file.name}<br>
                <strong>📏 Ukuran:</strong> ${formatFileSize(file.size)}
            `;
            fileInfo.style.display = 'block';

            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    console.log('✅ User image loaded:', {
                        width: img.width,
                        height: img.height,
                        src: img.src.substring(0, 50) + '...'
                    });

                    // Set user image
                    userImage = img;

                    // Calculate optimal scale
                    const maxSize = Math.min(canvas.width, canvas.height) * 0.8; // 80% of canvas
                    const imgMaxSize = Math.max(img.width, img.height);
                    scale = Math.min(maxSize / imgMaxSize, 2.5); // Max scale 2.5x
                    scale = Math.max(scale, 0.3); // Min scale 0.3x
                    
                    console.log('📏 Calculated scale:', scale);
                    
                    // Center the image
                    resetImagePosition();

                    // Update controls
                    zoomSlider.value = scale;
                    updateZoomValue();
                    setControlsState(true);
                    
                    hideLoading();
                    
                    // Force redraw after everything is set
                    setTimeout(() => {
                        redrawCanvas();
                    }, 100);
                };

                img.onerror = (error) => {
                    console.error('❌ Failed to load user image:', error);
                    hideLoading();
                    showAlert('error', 'Gagal memuat gambar. Pastikan file tidak rusak.');
                };

                img.src = event.target.result;
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

    // === DRAG FUNCTIONALITY ===

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

    // Touch events
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

    // Double-click to reset position
    canvas.addEventListener('dblclick', () => {
        if (userImage) {
            resetImagePosition();
            showAlert('success', '📍 Posisi gambar direset ke tengah');
        }
    });

    // Button events
    downloadBtn.addEventListener('click', downloadResult);
    resetBtn.addEventListener('click', resetAll);

    // Keyboard shortcuts
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

    // Responsive handling
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            if (userImage) {
                redrawCanvas();
            }
        }, 100);
    });

    // Drag and drop
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
            const dt = new DataTransfer();
            dt.items.add(file);
            imageLoader.files = dt.files;
            imageLoader.dispatchEvent(new Event('change'));
        }
    });

    // Initial welcome
    setTimeout(() => {
        if (!userImage) {
            showAlert('success', '👋 Selamat datang! Upload foto untuk membuat twibbon keren.');
        }
    }, 1000);

    console.log('🎨 Twibbon Generator berhasil dimuat!');
    console.log('⌨️ Keyboard shortcuts tersedia');
});
