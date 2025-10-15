// LỚP DỊCH VỤ CHÍNH - HOÀN TOÀN MIỄN PHÍ
class FreeTranslationService {
    constructor() {
        this.currentMethod = 'google-free';
        this.isTranslating = false;
    }

    // PHƯƠNG THỨC 1: Google Translate Free (ổn định nhất)
    async googleFreeTranslate(text, targetLang) {
        try {
            console.log(`Đang dịch với Google Free: "${text}" sang ${targetLang}`);
            
            const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=vi&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Lỗi kết nối: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Xử lý kết quả từ Google Translate
            if (data && data[0]) {
                let translatedText = '';
                data[0].forEach(item => {
                    if (item[0]) {
                        translatedText += item[0];
                    }
                });
                return translatedText;
            }
            
            throw new Error('Không nhận được dữ liệu dịch');
            
        } catch (error) {
            console.error('Lỗi Google Free:', error);
            throw new Error('Google Free: ' + error.message);
        }
    }

    // PHƯƠNG THỨC 2: LibreTranslate (dự phòng)
    async libreTranslate(text, targetLang) {
        try {
            console.log(`Đang dịch với LibreTranslate: "${text}" sang ${targetLang}`);
            
            const response = await fetch('https://libretranslate.com/translate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    q: text,
                    source: 'vi',
                    target: targetLang,
                    format: 'text'
                })
            });
            
            if (!response.ok) {
                throw new Error(`Lỗi server: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data && data.translatedText) {
                return data.translatedText;
            }
            
            throw new Error('Không nhận được bản dịch');
            
        } catch (error) {
            console.error('Lỗi LibreTranslate:', error);
            throw new Error('LibreTranslate: ' + error.message);
        }
    }

    // PHƯƠNG THỨC CHÍNH ĐỂ DỊCH
    async translate(text, targetLang) {
        if (this.isTranslating) return '';
        if (!text.trim()) return '';
        
        this.isTranslating = true;
        
        try {
            let result;
            
            if (this.currentMethod === 'google-free') {
                result = await this.googleFreeTranslate(text, targetLang);
            } else if (this.currentMethod === 'libre') {
                result = await this.libreTranslate(text, targetLang);
            }
            
            this.isTranslating = false;
            return result;
            
        } catch (error) {
            this.isTranslating = false;
            
            // Tự động chuyển phương thức nếu có lỗi
            if (this.currentMethod === 'google-free') {
                console.log('Tự động chuyển sang LibreTranslate...');
                this.currentMethod = 'libre';
                return await this.libreTranslate(text, targetLang);
            }
            
            throw error;
        }
    }

    setMethod(method) {
        this.currentMethod = method;
        console.log(`Đã chuyển sang phương thức: ${method}`);
    }
}

// KHỞI TẠO ỨNG DỤNG
class TranslationApp {
    constructor() {
        this.translator = new FreeTranslationService();
        this.timeoutId = null;
        this.init();
    }

    init() {
        // LẤY CÁC PHẦN TỬ HTML
        this.elements = {
            inputText: document.getElementById('inputText'),
            outputText: document.getElementById('outputText'),
            targetLanguage: document.getElementById('targetLanguage'),
            translationMethod: document.getElementById('translationMethod'),
            translateBtn: document.getElementById('translateBtn'),
            charCount: document.getElementById('charCount'),
            status: document.getElementById('status')
        };

        // GÁN SỰ KIỆN
        this.bindEvents();
        this.updateStatus('🟢 Sẵn sàng dịch văn bản');
        
        console.log('Ứng dụng dịch thuật đã khởi động!');
    }

    bindEvents() {
        // Sự kiện nhập liệu - dịch tự động sau 1 giây
        this.elements.inputText.addEventListener('input', () => {
            this.updateCharCount();
            this.debouncedTranslate();
        });

        // Sự kiện click nút dịch
        this.elements.translateBtn.addEventListener('click', () => {
            this.handleTranslation();
        });

        // Sự kiện thay đổi ngôn ngữ
        this.elements.targetLanguage.addEventListener('change', () => {
            if (this.elements.inputText.value.trim()) {
                this.handleTranslation();
            }
        });

        // Sự kiện thay đổi phương thức
        this.elements.translationMethod.addEventListener('change', (e) => {
            this.translator.setMethod(e.target.value);
            if (this.elements.inputText.value.trim()) {
                this.handleTranslation();
            }
        });
    }

    // CẬP NHẬT SỐ KÝ TỰ
    updateCharCount() {
        const count = this.elements.inputText.value.length;
        this.elements.charCount.textContent = count;
        
        if (count > 1000) {
            this.elements.charCount.style.color = '#e74c3c';
        } else if (count > 500) {
            this.elements.charCount.style.color = '#f39c12';
        } else {
            this.elements.charCount.style.color = '#666';
        }
    }

    // CẬP NHẬT TRẠNG THÁI
    updateStatus(message) {
        this.elements.status.textContent = message;
        
        if (message.includes('✅')) {
            this.elements.status.style.color = '#27ae60';
        } else if (message.includes('🔄')) {
            this.elements.status.style.color = '#3498db';
        } else if (message.includes('❌')) {
            this.elements.status.style.color = '#e74c3c';
        } else {
            this.elements.status.style.color = '#666';
        }
    }

    // HÀM DEBOUNCE - CHỜ NGƯỜI DÙNG NGỪNG GÕ
    debouncedTranslate() {
        // Xóa timeout cũ
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }
        
        // Tạo timeout mới - chờ 1 giây sau khi ngừng gõ
        this.timeoutId = setTimeout(() => {
            this.handleTranslation();
        }, 1000);
    }

    // HÀM DỊCH CHÍNH
    async handleTranslation() {
        const text = this.elements.inputText.value.trim();
        const targetLang = this.elements.targetLanguage.value;
        
        if (!text) {
            this.elements.outputText.value = '';
            this.updateStatus('🟢 Nhập văn bản để dịch');
            return;
        }

        // Hiển thị trạng thái đang dịch
        this.updateStatus('🔄 Đang dịch...');
        this.elements.outputText.value = '🔄 Đang xử lý...';
        
        try {
            // Gọi dịch vụ dịch
            const translatedText = await this.translator.translate(text, targetLang);
            
            // Hiển thị kết quả
            this.elements.outputText.value = translatedText;
            this.updateStatus(`✅ Đã dịch thành công (${this.translator.currentMethod})`);
            
            console.log('Dịch thành công:', {
                original: text,
                translated: translatedText,
                method: this.translator.currentMethod
            });
            
        } catch (error) {
            console.error('Lỗi dịch thuật:', error);
            
            this.elements.outputText.value = '❌ Lỗi: ' + error.message + '\n\n💡 Mẹo:\n• Kiểm tra kết nối internet\n• Thử phương thức dịch khác\n• Thử lại với văn bản ngắn hơn';
            this.updateStatus('❌ Lỗi dịch thuật');
        }
    }
}

// KHỞI CHẠY ỨNG DỤNG KHI TRANG ĐƯỢC TẢI
document.addEventListener('DOMContentLoaded', function() {
    // Tạo ứng dụng
    window.translationApp = new TranslationApp();
    
    // Hiển thị thông báo chào mừng
    console.log(`
    🌐 ỨNG DỤNG DỊCH THUẬT MIỄN PHÍ
    ===============================
    ✅ Hoạt động: Có
    ✅ Miễn phí: 100%
    ✅ Đăng ký: Không cần
    ✅ Thẻ tín dụng: Không cần
    ===============================
    `);
});

// XỬ LÝ LỖI TOÀN CỤC
window.addEventListener('error', function(e) {
    console.error('Lỗi toàn cục:', e.error);
});

// THÔNG BÁO OFFLINE/ONLINE
window.addEventListener('online', function() {
    if (window.translationApp) {
        window.translationApp.updateStatus('🟢 Đã kết nối lại internet');
    }
});

window.addEventListener('offline', function() {
    if (window.translationApp) {
        window.translationApp.updateStatus('❌ Mất kết nối internet');
    }
});

