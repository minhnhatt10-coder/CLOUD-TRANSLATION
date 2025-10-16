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

  // PHƯƠNG THỨC PHÁT HIỆN NGÔN NGỮ
  async detectLanguage(text) {
    // IMPORTANT: Do NOT keep API keys hard-coded in public repos or client-side code.
    // Move the key to a backend or use a secure method. Replace the placeholder below if you insist on running client-side.
    const DETECTLANG_API_KEY = 'a1fec154397f915a5fd9acbc0dc166c6';

    // Try the DetectLanguage API first
    if (DETECTLANG_API_KEY && DETECTLANG_API_KEY !== 'a1fec154397f915a5fd9acbc0dc166c6') {
      try {
        const response = await fetch('https://ws.detectlanguage.com/v3/detect', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // DetectLanguage expects "Bearer <key>"
            'Authorization': `Bearer ${DETECTLANG_API_KEY}`
          },
          body: JSON.stringify({ q: text })
        });

        if (!response.ok) {
          throw new Error(`DetectLanguage API error: ${response.status}`);
        }

        const data = await response.json();
        // According to DetectLanguage v3 response: data.data.detections is an array of arrays
        // e.g., { data: { detections: [ [ { language: "en", confidence: 0.9 } ] ] } }
        if (data && data.data && Array.isArray(data.data.detections) && data.data.detections[0] && data.data.detections[0][0]) {
          const detection = data.data.detections[0][0];
          return detection.language; // return language code string like "en"
        }

        throw new Error('Không nhận được dữ liệu phát hiện ngôn ngữ từ DetectLanguage');

      } catch (error) {
        console.warn('DetectLanguage API failed, falling back to Google-free detection. Error:', error);
        // fall through to google-free fallback
      }
    } else {
      console.warn('DetectLanguage API key missing or left as placeholder. Falling back to Google-free detection.');
    }

    // Fallback: use Google Free translate endpoint with sl=auto to infer source language
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(text)}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Google detect fallback error: ${response.status}`);
      }

      const data = await response.json();
      // Many google-free responses include detected source language in data[2] (string),
      // but formats vary, so we try a few possibilities.
      if (data && typeof data[2] === 'string') {
        return data[2];
      }

      // Some responses include detection in data[0] meta or other places; attempt to parse common shapes:
      if (Array.isArray(data) && data.length >= 3 && typeof data[2] === 'string') {
        return data[2];
      }

      // If unable to detect, default to 'auto' so your translate method can handle it
      return 'auto';

    } catch (error) {
      console.error('Fallback detectLanguage failed:', error);
      // As last resort, return 'auto' so translator can try to detect server-side or fail gracefully
      return 'auto';
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
        // If sourceLang is 'auto', Google endpoint supports sl=auto
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
      this.updateTargetLanguageOptions();
      if (this.elements.inputText.value.trim()) {
        this.handleTranslation();
      }
    });

    this.elements.sourceLanguage.addEventListener('change', () => {
      this.updateSourceLanguage();
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

    // Thêm sự kiện cho checkbox phát hiện ngôn ngữ
    document.getElementById('detectLang').addEventListener('change', (e) => {
      this.toggleSourceLanguageVisibility(e.target.checked);
    });
  }

  toggleSourceLanguageVisibility(isChecked) {
    const sourceLangSelect = document.getElementById('sourceLanguage');

    if (isChecked) {
      sourceLangSelect.style.display = 'none'; // Ẩn ngôn ngữ gốc
      sourceLangSelect.disabled = true; // Vô hiệu hóa ngôn ngữ gốc
    } else {
      sourceLangSelect.style.display = 'block'; // Hiện lại ngôn ngữ gốc
      sourceLangSelect.disabled = false; // Kích hoạt lại ngôn ngữ gốc
    }
  }

  updateTargetLanguageOptions() {
    const sourceLang = this.elements.sourceLanguage.value;
    const targetLangSelect = this.elements.targetLanguage;

    // Đặt lại ngôn ngữ đích nếu nó trùng với ngôn ngữ gốc
    if (targetLangSelect.value === sourceLang) {
      targetLangSelect.value = targetLangSelect.options[0].value; // Chọn ngôn ngữ đầu tiên
      this.updateStatus(`❌ Trùng ngôn ngữ (${this.translator.currentMethod})`);
    }
  }

  updateSourceLanguage() {
    const targetLang = this.elements.targetLanguage.value;
    const sourceLangSelect = this.elements.sourceLanguage;

    // Đặt lại ngôn ngữ gốc nếu nó trùng với ngôn ngữ đích
    if (sourceLangSelect.value === targetLang) {
      sourceLangSelect.value = sourceLangSelect.options[0].value; // Chọn ngôn ngữ đầu tiên
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
    const detectLangCheckbox = document.getElementById('detectLang');
    const detectedLangText = document.getElementById('detectedLangText');
    const detectedLanguageDiv = document.getElementById('detectedLanguage');

    if (!text) {
      this.elements.outputText.value = '';
      this.updateStatus('🟢 Nhập văn bản để dịch');
      return;
    }

    let sourceLang = this.elements.sourceLanguage.value;

    if (detectLangCheckbox.checked) {
      this.updateStatus('🔄 Đang phát hiện ngôn ngữ...');

      try {
        const detected = await this.translator.detectLanguage(text); // now returns a string like 'en' or 'auto'

        // If detectLanguage returns an object in future, ensure compatibility:
        const detectedCode = (typeof detected === 'string') ? detected : (detected && detected.language) ? detected.language : null;

        if (detectedCode) {
          // Only set the source language select if the detected code exists in options
          const sourceSelect = this.elements.sourceLanguage;
          const optionExists = Array.from(sourceSelect.options).some(opt => opt.value === detectedCode);
          if (optionExists) {
            this.elements.sourceLanguage.value = detectedCode; // Cập nhật ngôn ngữ gốc
          } else {
            // If the detected language is not in the select list, keep current select and show detected code
            console.warn(`Detected language "${detectedCode}" not in source-language options`);
          }

          detectedLangText.textContent = detectedCode; // Hiển thị ngôn ngữ được phát hiện
          detectedLanguageDiv.style.display = 'block'; // Hiện phần ngôn ngữ được phát hiện
          this.updateStatus(`🔄 Đã phát hiện ngôn ngữ: ${detectedCode}`);
          // use detectedCode as sourceLang for translation
          sourceLang = detectedCode;
        } else {
          throw new Error('Không xác định được mã ngôn ngữ');
        }
      } catch (error) {
        console.error('Lỗi phát hiện ngôn ngữ:', error);
        this.elements.outputText.value = '❌ Lỗi phát hiện ngôn ngữ: ' + error.message;
        this.updateStatus('❌ Lỗi phát hiện ngôn ngữ');
        return;
      }
    } else {
      detectedLanguageDiv.style.display = 'none'; // Ẩn phần ngôn ngữ được phát hiện nếu không chọn
    }

    const targetLang = this.elements.targetLanguage.value;

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

      this.elements.outputText.value = '❌ Lỗi: ' + error.message;
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
