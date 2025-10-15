class FreeTranslationService {
    constructor(apiKey) {
        this.apiKey = apiKey; // Thêm khóa API
        this.currentMethod = 'google-cloud';
        this.isTranslating = false;
    }

    // PHƯƠNG THỨC SỬ DỤNG Google Cloud Translation API
    async googleCloudTranslate(text, targetLang) {
        try {
            const url = `https://translation.googleapis.com/language/translate/v2?key=${this.apiKey}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    q: text,
                    target: targetLang,
                    source: 'vi'
                })
            });

            if (!response.ok) {
                throw new Error(`Lỗi kết nối: ${response.status}`);
            }

            const data = await response.json();
            return data.data.translations[0].translatedText;
        } catch (error) {
            throw new Error('Google Cloud: ' + error.message);
        }
    }

    // PHƯƠNG THỨC CHÍNH ĐỂ DỊCH
    async translate(text, targetLang) {
        if (this.isTranslating) return '';
        if (!text.trim()) return '';

        this.isTranslating = true;

        try {
            let result;
            if (this.currentMethod === 'google-cloud') {
                result = await this.googleCloudTranslate(text, targetLang);
            }
            this.isTranslating = false;
            return result;
        } catch (error) {
            this.isTranslating = false;
            throw error;
        }
    }

    setMethod(method) {
        this.currentMethod = method;
    }
}

// KHỞI TẠO ỨNG DỤNG
class TranslationApp {
    constructor(apiKey) {
        this.translator = new FreeTranslationService(apiKey); // Truyền khóa API vào lớp
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
    const apiKey = 'AIzaSyAztG6ad9J9F26B0gm8a3TjduHvpZcmzHo'; // Thay thế bằng khóa API của bạn
    window.translationApp = new TranslationApp(apiKey);
});
