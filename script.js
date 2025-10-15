// LỚP DỊCH VỤ CHÍNH - HOÀN TOÀN MIỄN PHÍ
class FreeTranslationService {
    constructor() {
        this.currentMethod = 'google-free';
        this.isTranslating = false;
    }

    // PHƯƠNG THỨC 1: Google Translate Free
    async googleFreeTranslate(text, targetLang) {
        try {
            const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=vi&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Lỗi kết nối: ${response.status}`);
            }
            
            const data = await response.json();
            let translatedText = '';
            data[0].forEach(item => {
                if (item[0]) {
                    translatedText += item[0];
                }
            });
            return translatedText;
        } catch (error) {
            throw new Error('Google Free: ' + error.message);
        }
    }

    // PHƯƠNG THỨC 2: LibreTranslate
    async libreTranslate(text, targetLang) {
        try {
            const response = await fetch('https://libretranslate.com', {
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
            return data.translatedText;
        } catch (error) {
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
            if (this.currentMethod === 'google-free') {
                this.currentMethod = 'libre';
                return await this.libreTranslate(text, targetLang);
            }
            throw error;
        }
    }

    setMethod(method) {
        this.currentMethod = method;
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
            translationMethod: document.getElementById('translationMethod'),
            translateBtn: document.getElementById('translateBtn'),
            charCount: document.getElementById('charCount'),
            status: document.getElementById('status')
        };

        this.bindEvents();
        this.updateStatus('🟢 Sẵn sàng dịch văn bản');
    }

    bindEvents() {
        this.elements.translateBtn.addEventListener('click', () => {
            this.handleTranslation();
        });

        this.elements.translationMethod.addEventListener('change', (e) => {
            this.translator.setMethod(e.target.value);
        });
    }

    async handleTranslation() {
        const text = this.elements.inputText.value.trim();
        const targetLang = this.elements.targetLanguage.value;

        if (!text) {
            this.elements.outputText.value = '';
            this.updateStatus('🟢 Nhập văn bản để dịch');
            return;
        }

        this.updateStatus('🔄 Đang dịch...');
        this.elements.outputText.value = '🔄 Đang xử lý...';

        try {
            const translatedText = await this.translator.translate(text, targetLang);
            this.elements.outputText.value = translatedText;
            this.updateStatus(`✅ Đã dịch thành công (${this.translator.currentMethod})`);
        } catch (error) {
            this.elements.outputText.value = '❌ Lỗi: ' + error.message;
            this.updateStatus('❌ Lỗi dịch thuật');
        }
    }

    updateStatus(message) {
        this.elements.status.textContent = message;
    }
}

// KHỞI CHẠY ỨNG DỤNG KHI TRANG ĐƯỢC TẢI
document.addEventListener('DOMContentLoaded', function() {
    window.translationApp = new TranslationApp();
});
