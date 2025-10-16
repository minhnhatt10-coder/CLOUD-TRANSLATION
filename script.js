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
      if (!response.ok) throw new Error(`Lỗi kết nối: ${response.status}`);
      const data = await response.json();
      if (data && data[0]) {
        let translatedText = '';
        data[0].forEach(item => {
          if (item[0]) translatedText += item[0];
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
      if (!response.ok) throw new Error(`Lỗi server: ${response.status}`);
      const data = await response.json();
      if (data && data.responseData && data.responseData.translatedText) {
        return data.responseData.translatedText;
      }
      throw new Error('Không nhận được bản dịch');
    } catch (error) {
      console.error('Lỗi MyMemory:', error);
      throw new Error('MyMemory: ' + error.message);
    }
  }

  // PHƯƠNG THỨC PHÁT HIỆN NGÔN NGỮ
  async detectLanguage(text) {
    try {
      const response = await fetch('https://ws.detectlanguage.com/v3/detect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'a1fec154397f915a5fd9acbc0dc166c6' // Replace with your actual API key
        },
        body: JSON.stringify({ q: text })
      });

      if (!response.ok) {
        throw new Error('Không thể phát hiện ngôn ngữ');
      }

      const data = await response.json();
      const detection = data.data.detections[0]; // Get the first detection
      return {
        language: detection.language, // Detected language
        score: detection.score // Detection score
      };
    } catch (error) {
      console.error('Lỗi phát hiện ngôn ngữ:', error);
      throw new Error('Phát hiện ngôn ngữ: ' + error.message);
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
    this.MAX_CHARS = 5000; // <-- Giới hạn ký tự ở đây
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

    // Thiết lập maxlength trên input/textarea (nếu trình duyệt hỗ trợ)
    if (this.elements.inputText) {
      this.elements.inputText.setAttribute('maxlength', this.MAX_CHARS);
    }

    // Nếu textarea đã có sẵn nội dung > MAX_CHARS (ví dụ load từ server),
    // auto cắt ngay khi khởi tạo để tránh dịch vượt giới hạn
    if (this.elements.inputText && this.elements.inputText.value.length > this.MAX_CHARS) {
      this.elements.inputText.value = this.elements.inputText.value.slice(0, this.MAX_CHARS);
    }

    this.bindEvents();
    this.updateStatus('🟢 Sẵn sàng dịch văn bản');

    console.log('Ứng dụng dịch thuật đã khởi động!');
    this.updateTargetLanguageOptions(); // Gọi hàm khi khởi động
    this.updateCharCount(); // cập nhật hiển thị ban đầu
  }

  bindEvents() {
    this.elements.inputText.addEventListener('input', () => {
      this.updateCharCount();

      // Nếu vượt giới hạn (trường hợp trình duyệt không honor maxlength), tự cắt
      if (this.elements.inputText.value.length > this.MAX_CHARS) {
        this.elements.inputText.value = this.elements.inputText.value.slice(0, this.MAX_CHARS);
        this.updateStatus(`❌ Đã đạt giới hạn ${this.MAX_CHARS} ký tự`);
        this.updateCharCount();
        return; // không auto dịch nếu vừa bị cắt
      }

      this.debouncedTranslate();
    });

    this.elements.inputText.addEventListener('paste', (e) => {
      const paste = (e.clipboardData || window.clipboardData).getData('text') || '';
      const current = this.elements.inputText.value || '';
      const selectionStart = this.elements.inputText.selectionStart || current.length;
      const selectionEnd = this.elements.inputText.selectionEnd || selectionStart;
      const allowed = this.MAX_CHARS - (current.length - (selectionEnd - selectionStart));
      if (paste.length > allowed) {
        e.preventDefault();
        const toInsert = paste.slice(0, Math.max(0, allowed));
        const newValue = current.slice(0, selectionStart) + toInsert + current.slice(selectionEnd);
        this.elements.inputText.value = newValue;
        this.updateCharCount();
        this.updateStatus(`❌ Nội dung đã cắt để phù hợp giới hạn ${this.MAX_CHARS} ký tự`);
        this.debouncedTranslate();
      }
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
    const detectCheckbox = document.getElementById('detectLang');
    if (detectCheckbox) {
      detectCheckbox.addEventListener('change', (e) => {
        this.toggleSourceLanguageVisibility(e.target.checked);
      });
    }
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
    this.elements.charCount.textContent = `${count}/${this.MAX_CHARS} kí tự`;

    // Màu sắc cảnh báo theo tỷ lệ
    if (count >= this.MAX_CHARS) {
      this.elements.charCount.style.color = '#e74c3c';
    } else if (count > this.MAX_CHARS * 0.8) {
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
    // Lấy text và TRIM vượt quá ngay trước khi dịch để đảm bảo không gửi > MAX_CHARS
    let text = (this.elements.inputText.value || '').trim();
    const detectLangCheckbox = document.getElementById('detectLang');
    const detectedLangText = document.getElementById('detectedLangText');
    const detectedLanguageDiv = document.getElementById('detectedLanguage');

    if (!text) {
      this.elements.outputText.value = '';
      this.updateStatus('🟢 Nhập văn bản để dịch');
      return;
    }

    // Nếu vẫn có text > MAX_CHARS, auto-trim xuống MAX_CHARS để an toàn, và cập nhật UI.
    if (text.length > this.MAX_CHARS) {
      const before = text.length;
      text = text.slice(0, this.MAX_CHARS);
      this.elements.inputText.value = text; // cập nhật lại textarea
      this.updateCharCount();
      this.updateStatus(`❌ Văn bản vượt quá giới hạn, đã tự cắt từ ${before} xuống ${this.MAX_CHARS} ký tự`);
      // không return; tiếp tục thực hiện dịch với text đã cắt
    }

    let sourceLang = this.elements.sourceLanguage.value;

    if (detectLangCheckbox && detectLangCheckbox.checked) {
      this.updateStatus('🔄 Đang phát hiện ngôn ngữ...');

      try {
        const detected = await this.translator.detectLanguage(text); // có thể trả về object hoặc string
        const detectedCode = (typeof detected === 'string') ? detected : (detected && detected.language) ? detected.language : null;

        if (detectedCode) {
          const sourceSelect = this.elements.sourceLanguage;
          const optionExists = Array.from(sourceSelect.options).some(opt => opt.value === detectedCode);
          if (optionExists) {
            this.elements.sourceLanguage.value = detectedCode; // Cập nhật ngôn ngữ gốc
          } else {
            console.warn(`Detected language "${detectedCode}" not in source-language options`);
          }

          detectedLangText.textContent = detectedCode; // Hiển thị ngôn ngữ được phát hiện
          detectedLanguageDiv.style.display = 'block'; // Hiện phần ngôn ngữ được phát hiện
          this.updateStatus(`🔄 Đã phát hiện ngôn ngữ: ${detectedCode}`);
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
      if (detectedLanguageDiv) detectedLanguageDiv.style.display = 'none';
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
