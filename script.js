// LỚP DỊCH VỤ CHÍNH - HOÀN TOÀN MIỄN PHÍ
class FreeTranslationService {
    constructor() {
        this.currentMethod = 'google-free';
        this.isTranslating = false;
    }

    // PHƯƠNG THỨC 1: Google Translate Free (ổn định nhất)
    async googleFreeTranslate(text, sourceLang, targetLang) {
        try {
            console.log(`Đang dịch với Google Free: "${text}" từ ${sourceLang} sang ${targetLang}`);
            
            const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Lỗi kết nối: ${response.status}`);
            }
            
            const data = await response.json();
            
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

    // PHƯƠNG THỨC 2: MyMemory API
    async myMemoryTranslate(text, sourceLang, targetLang) {
        try {
            console.log(`Đang dịch với MyMemory: "${text}" từ ${sourceLang} sang ${targetLang}`);
            const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Lỗi server: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data && data.responseData && data.responseData.translatedText) {
                return data.responseData.translatedText; // Trả về bản dịch
            }
            
            throw new Error('Không nhận được bản dịch');
            
        } catch (error) {
            console.error('Lỗi MyMemory:', error);
            throw new Error('MyMemory: ' + error.message);
        }
    }

    // PHƯƠNG THỨC CHÍNH ĐỂ DỊCH
    async translate(text, sourceLang, targetLang) {
        if (this.isTranslating) return '';
        if (!text.trim()) return '';
        
        this.isTranslating = true;
        
        try {
            let result;
            
            if (this.currentMethod === 'google-free') {
                result = await this.googleFreeTranslate(text, sourceLang, targetLang);
            } else if (this.currentMethod === 'mymemory') {
                result = await this.myMemoryTranslate(text, sourceLang, targetLang);
            }
            
            this.isTranslating = false;
            return result;
            
        } catch (error) {
            this.isTranslating = false;
            
            // Tự động chuyển phương thức nếu có lỗi
            if (this.currentMethod === 'google-free') {
                console.log('Tự động chuyển sang MyMemory...');
                this.currentMethod = 'mymemory';
                return await this.myMemoryTranslate(text, sourceLang, targetLang);
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
        this.elements = {
            inputText: document.getElementById('inputText'),
            outputText: document.getElementById('outputText'),
            targetLanguage: document.getElementById('targetLanguage'),
            sourceLanguage: document.getElementById('sourceLanguage'),
            translationMethod: document.getElementById('translationMethod'),
            translateBtn: document.getElementById('translateBtn'),
            charCount: document.getElementById('charCount'),
            status: document.getElementById('status')
        };

        this.bindEvents();
        this.updateStatus('🟢 Sẵn sàng dịch văn bản');
        
        console.log('Ứng dụng dịch thuật đã khởi động!');
        this.updateTargetLanguageOptions(); // Gọi hàm khi khởi động
    }

    bindEvents() {
        this.elements.inputText.addEventListener('input', () => {
            this.updateCharCount();
            this.debouncedTranslate();
        });

        this.elements.translateBtn.addEventListener('click', () => {
            this.handleTranslation();
        });

        this.elements.targetLanguage.addEventListener('change', () => {
            //this.updateSourceLanguage(); // Gọi hàm khi thay đổi ngôn ngữ đích
            this.updateTargetLanguageOptions();
            if (this.elements.inputText.value.trim()) {
                this.handleTranslation();
            }
        });

        this.elements.sourceLanguage.addEventListener('change', () => {
            //this.updateTargetLanguage(); // Gọi hàm khi thay đổi ngôn ngữ gốc
            this.updateSourceLanguage();
          //  this.updateTargetLanguageOptions();
            if (this.elements.inputText.value.trim()) {
                this.handleTranslation();
            }
        });

        this.elements.translationMethod.addEventListener('change', (e) => {
            this.translator.setMethod(e.target.value);
            if (this.elements.inputText.value.trim()) {
                this.handleTranslation();
            }
        });
    }

     updateTargetLanguageOptions() {
        const sourceLang = this.elements.sourceLanguage.value;
        const targetLangSelect = this.elements.targetLanguage;

        const optionz_zero_sourceLang = this.elements.sourceLanguage;
        const TargetL = this.elements.targetLanguage.value;
         
        //Array.from(targetLangSelect.options).forEach(option => {
       //     if (option.value === sourceLang) {
       //         option.style.display = 'none'; // Ẩn ngôn ngữ giống với ngôn ngữ gốc
        //    } else {
       //         option.style.display = 'block'; // Hiện các ngôn ngữ khác
       //     }
      //  });

        // Đặt lại ngôn ngữ đích nếu nó trùng với ngôn ngữ gốc
        if (targetLangSelect.value === sourceLang) {
            targetLangSelect.value = targetLangSelect.options[0].value; // Chọn ngôn ngữ đầu tiên
                 this.updateStatus(`❌ Trùng ngôn ngữ (${this.translator.currentMethod})`);
        }
          if (optionz_zero_sourceLang.options[0].value === targetLang) {
            TargetL.value = TargetL.options[0].value;
             this.updateStatus(`❌ Trùng ngôn ngữ (${this.translator.currentMethod})`);
        }
    }

    updateSourceLanguage() {
        const targetLang = this.elements.targetLanguage.value;
        const sourceLangSelect = this.elements.sourceLanguage;

        const optionz_zero_sourceLang = this.elements.sourceLanguage;
        const TargetL = this.elements.targetLanguage.value;
            
        // Đặt lại ngôn ngữ gốc nếu nó trùng với ngôn ngữ đích
        if (sourceLangSelect.value === targetLang) {
            sourceLangSelect.value = sourceLangSelect.options[0].value; // Chọn ngôn ngữ đầu tiên
                this.updateStatus(`❌ Trùng ngôn ngữ (${this.translator.currentMethod})`);
        }
        if (optionz_zero_sourceLang.options[0].value === targetLang) {
            TargetL.value = TargetL.options[0].value;
             this.updateStatus(`❌ Trùng ngôn ngữ (${this.translator.currentMethod})`);
        }
    }

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

    debouncedTranslate() {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }
        
        this.timeoutId = setTimeout(() => {
            this.handleTranslation();
        }, 1000);
    }

    async handleTranslation() {
        const text = this.elements.inputText.value.trim();
        const sourceLang = this.elements.sourceLanguage.value;
        const targetLang = this.elements.targetLanguage.value;
        
        if (!text) {
            this.elements.outputText.value = '';
            this.updateStatus('🟢 Nhập văn bản để dịch');
            return;
        }

        this.updateStatus('🔄 Đang dịch...');
        this.elements.outputText.value = '🔄 Đang xử lý...';
        
        try {
            const translatedText = await this.translator.translate(text, sourceLang, targetLang);
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
    window.translationApp = new TranslationApp();
    
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








