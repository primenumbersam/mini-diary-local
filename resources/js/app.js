/**
 * MINI LOCAL DIARY - Core Application Logic
 * Swiss International Typographic Style Desktop Diary
 */

(function () {
  'use strict';

  // State Management
  const state = {
    diaries: [],          // List of loaded diary entries { filename, date, title, category, snippet, raw }
    currentDate: null,    // Currently opened diary date (YYYY-MM-DD)
    originalDate: null,   // Initial date when entry was opened (to handle renaming)
    selectedCategory: 'ALL',
    searchQuery: '',
    isUnsaved: false,
    viewMode: 'split'     // 'split' | 'editor' | 'preview'
  };

  // DOM Elements
  const el = {
    diaryList: document.getElementById('diaryList'),
    categoryFilterContainer: document.getElementById('categoryFilterContainer'),
    diarySearchInput: document.getElementById('diarySearchInput'),
    btnNewDiary: document.getElementById('btnNewDiary'),
    
    // View mode buttons
    btnViewSplit: document.getElementById('btnViewSplit'),
    btnViewEditor: document.getElementById('btnViewEditor'),
    btnViewPreview: document.getElementById('btnViewPreview'),

    // Editor fields
    entryDate: document.getElementById('entryDate'),
    entryTitle: document.getElementById('entryTitle'),
    entryCategory: document.getElementById('entryCategory'),
    markdownEditor: document.getElementById('markdownEditor'),
    editorDropZone: document.getElementById('editorDropZone'),
    dropOverlay: document.getElementById('dropOverlay'),

    // Status bar & actions
    statusDot: document.getElementById('statusDot'),
    statusText: document.getElementById('statusText'),
    charCount: document.getElementById('charCount'),
    btnSaveDiary: document.getElementById('btnSaveDiary'),
    btnDeleteDiary: document.getElementById('btnDeleteDiary'),
    btnAttachImage: document.getElementById('btnAttachImage'),
    imageFileInput: document.getElementById('imageFileInput'),

    // Preview
    previewContent: document.getElementById('previewContent'),
    previewCategoryBadge: document.getElementById('previewCategoryBadge')
  };

  // --------------------------------------------------------------------------
  // Initialization
  // --------------------------------------------------------------------------
  async function initApp() {
    initNeutralino();
    setupEventListeners();
    await ensureDirectories();
    await loadDiaryList();

    if (state.diaries.length > 0) {
      loadDiary(state.diaries[0].date);
    } else {
      createNewEntry();
    }
  }

  function initNeutralino() {
    if (typeof Neutralino !== 'undefined') {
      try {
        Neutralino.init();
        Neutralino.events.on('windowClose', () => {
          Neutralino.app.exit();
        });
      } catch (err) {
        console.warn('Neutralino.init error:', err);
      }
    }
  }

  async function ensureDirectories() {
    if (typeof Neutralino === 'undefined') return;
    try {
      await Neutralino.filesystem.createDirectory('storage');
    } catch (e) { /* ignore if exists */ }
    try {
      await Neutralino.filesystem.createDirectory('storage/diaries');
    } catch (e) { /* ignore if exists */ }
    try {
      await Neutralino.filesystem.createDirectory('storage/assets');
    } catch (e) { /* ignore if exists */ }
  }

  // --------------------------------------------------------------------------
  // Frontmatter Parser & Serializer
  // --------------------------------------------------------------------------
  function parseFrontmatter(rawContent) {
    const match = rawContent.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
    if (!match) {
      return {
        meta: {},
        body: rawContent
      };
    }

    const metaBlock = match[1];
    const body = match[2];
    const meta = {};

    metaBlock.split(/\r?\n/).forEach(line => {
      const idx = line.indexOf(':');
      if (idx > -1) {
        const key = line.slice(0, idx).trim();
        const val = line.slice(idx + 1).trim();
        meta[key] = val;
      }
    });

    return { meta, body };
  }

  function serializeFrontmatter(meta, body) {
    const lines = [
      '---',
      `title: ${meta.title || ''}`,
      `category: ${meta.category || 'personal'}`,
      `date: ${meta.date || ''}`,
      '---',
      '',
      body
    ];
    return lines.join('\n');
  }

  // --------------------------------------------------------------------------
  // Data Loading & Storage Operations
  // --------------------------------------------------------------------------
  async function loadDiaryList() {
    if (typeof Neutralino === 'undefined') {
      console.warn('Neutralino filesystem not available.');
      return;
    }

    try {
      const entries = await Neutralino.filesystem.readDirectory('storage/diaries');
      const mdFiles = entries.filter(e => e.type === 'FILE' && e.entry.endsWith('.md'));

      const loaded = [];
      for (const f of mdFiles) {
        const dateMatch = f.entry.match(/^(\d{4}-\d{2}-\d{2})\.md$/);
        const date = dateMatch ? dateMatch[1] : f.entry.replace('.md', '');
        
        try {
          const raw = await Neutralino.filesystem.readFile(`storage/diaries/${f.entry}`);
          const { meta, body } = parseFrontmatter(raw);
          
          const cleanBodySnippet = body
            .replace(/[#*`_~>[\]]/g, '')
            .replace(/!\[.*?\]\(.*?\)/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 100);

          loaded.push({
            filename: f.entry,
            date: meta.date || date,
            title: meta.title || '제목 없음',
            category: (meta.category || 'personal').toLowerCase(),
            snippet: cleanBodySnippet || '(내용 없음)',
            raw: raw,
            body: body
          });
        } catch (readErr) {
          console.error(`Failed to read diary file: ${f.entry}`, readErr);
        }
      }

      // Sort descending by date
      loaded.sort((a, b) => b.date.localeCompare(a.date));
      state.diaries = loaded;
      renderDiaryList();
    } catch (err) {
      console.error('Failed to list diaries:', err);
    }
  }

  function renderDiaryList() {
    el.diaryList.innerHTML = '';

    const filtered = state.diaries.filter(item => {
      const matchCategory = state.selectedCategory === 'ALL' || item.category === state.selectedCategory.toLowerCase();
      const query = state.searchQuery.trim().toLowerCase();
      const matchQuery = !query || 
        item.title.toLowerCase().includes(query) || 
        item.date.toLowerCase().includes(query) ||
        item.snippet.toLowerCase().includes(query);
      return matchCategory && matchQuery;
    });

    if (filtered.length === 0) {
      const emptyLi = document.createElement('li');
      emptyLi.className = 'empty-list-notice';
      emptyLi.textContent = '작성된 일기가 없습니다.';
      el.diaryList.appendChild(emptyLi);
      return;
    }

    filtered.forEach(item => {
      const li = document.createElement('li');
      li.className = `diary-item ${item.date === state.currentDate ? 'active' : ''}`;
      li.dataset.date = item.date;

      const dateDiv = document.createElement('div');
      dateDiv.className = 'diary-item-date';
      dateDiv.innerHTML = `
        <span>${item.date}</span>
        <span class="diary-item-category ${item.category}">${item.category.toUpperCase()}</span>
      `;

      const titleDiv = document.createElement('div');
      titleDiv.className = 'diary-item-title';
      titleDiv.textContent = item.title;

      const snippetDiv = document.createElement('div');
      snippetDiv.className = 'diary-item-snippet';
      snippetDiv.textContent = item.snippet;

      li.appendChild(dateDiv);
      li.appendChild(titleDiv);
      li.appendChild(snippetDiv);

      li.addEventListener('click', () => {
        if (state.isUnsaved) {
          if (!confirm('저장되지 않은 변경사항이 있습니다. 이동하시겠습니까?')) {
            return;
          }
        }
        loadDiary(item.date);
      });

      el.diaryList.appendChild(li);
    });
  }

  function loadDiary(date) {
    const entry = state.diaries.find(d => d.date === date);
    if (!entry) return;

    state.currentDate = entry.date;
    state.originalDate = entry.date;

    el.entryDate.value = entry.date;
    el.entryTitle.value = entry.title === '제목 없음' ? '' : entry.title;
    el.entryCategory.value = entry.category || 'personal';
    el.markdownEditor.value = entry.body || '';

    setUnsaved(false);
    updatePreview();
    renderDiaryList();
  }

  function createNewEntry() {
    if (state.isUnsaved) {
      if (!confirm('저장되지 않은 변경사항이 있습니다. 새 일기를 작성하시겠습니까?')) {
        return;
      }
    }

    const today = new Date().toISOString().slice(0, 10);
    state.currentDate = today;
    state.originalDate = null;

    el.entryDate.value = today;
    el.entryTitle.value = '';
    el.entryCategory.value = 'personal';
    el.markdownEditor.value = '';

    setUnsaved(false);
    updatePreview();
    renderDiaryList();
    el.entryTitle.focus();
  }

  async function saveCurrentDiary() {
    const date = el.entryDate.value.trim();
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      alert('올바른 날짜 형식(YYYY-MM-DD)을 입력하세요.');
      el.entryDate.focus();
      return;
    }

    const title = el.entryTitle.value.trim() || '제목 없음';
    const category = el.entryCategory.value;
    const body = el.markdownEditor.value;

    const fullContent = serializeFrontmatter({
      title,
      category,
      date
    }, body);

    const targetFilename = `${date}.md`;
    const targetPath = `storage/diaries/${targetFilename}`;

    if (typeof Neutralino !== 'undefined') {
      try {
        await Neutralino.filesystem.writeFile(targetPath, fullContent);

        // If date was changed, delete old file
        if (state.originalDate && state.originalDate !== date) {
          const oldPath = `storage/diaries/${state.originalDate}.md`;
          try {
            await Neutralino.filesystem.removeFile(oldPath);
          } catch (delErr) {
            console.warn('Old file cleanup error:', delErr);
          }
        }

        state.currentDate = date;
        state.originalDate = date;
        setUnsaved(false);
        await loadDiaryList();
        renderDiaryList();
        showNotification('저장되었습니다.');
      } catch (err) {
        console.error('Save failed:', err);
        alert('저장에 실패했습니다: ' + err.message);
      }
    } else {
      console.log('Simulated Save:', targetPath, fullContent);
      state.currentDate = date;
      state.originalDate = date;
      setUnsaved(false);
    }
  }

  async function deleteCurrentDiary() {
    if (!state.currentDate && !state.originalDate) {
      alert('삭제할 일기가 없습니다.');
      return;
    }

    const targetDate = state.originalDate || state.currentDate;
    const confirmDelete = confirm(`${targetDate} 일기를 정말 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`);
    if (!confirmDelete) return;

    if (typeof Neutralino !== 'undefined') {
      try {
        const filePath = `storage/diaries/${targetDate}.md`;
        await Neutralino.filesystem.removeFile(filePath);
        await loadDiaryList();

        if (state.diaries.length > 0) {
          loadDiary(state.diaries[0].date);
        } else {
          createNewEntry();
        }
        showNotification('삭제되었습니다.');
      } catch (err) {
        console.error('Delete failed:', err);
        alert('삭제에 실패했습니다: ' + err.message);
      }
    }
  }

  // --------------------------------------------------------------------------
  // Media Asset Management (Image Drop & Upload)
  // --------------------------------------------------------------------------
  async function handleImageFile(file) {
    if (!file || !file.type.startsWith('image/')) {
      alert('이미지 파일만 첨부할 수 있습니다.');
      return;
    }

    const timestamp = Date.now();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const targetFileName = `${timestamp}_${cleanFileName}`;
    const assetPath = `storage/assets/${targetFileName}`;

    try {
      const buffer = await file.arrayBuffer();
      if (typeof Neutralino !== 'undefined') {
        await Neutralino.filesystem.writeBinaryFile(assetPath, buffer);
      }

      // Pre-cache Blob URL for instantaneous preview
      const blob = new Blob([buffer], { type: file.type });
      imageBlobCache.set(assetPath, URL.createObjectURL(blob));

      // Insert markdown image syntax at cursor position
      const mdInsert = `\n![${file.name}](../storage/assets/${targetFileName})\n`;
      insertTextAtCursor(el.markdownEditor, mdInsert);
      setUnsaved(true);
      await updatePreview();
      showNotification('이미지가 첨부되었습니다.');
    } catch (err) {
      console.error('Image upload failed:', err);
      alert('이미지 저장 실패: ' + err.message);
    }
  }

  function insertTextAtCursor(textarea, text) {
    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    const currentVal = textarea.value;

    textarea.value = currentVal.substring(0, startPos) + text + currentVal.substring(endPos);
    textarea.selectionStart = textarea.selectionEnd = startPos + text.length;
    textarea.focus();
  }

  // Image Blob URL Cache for seamless local preview
  const imageBlobCache = new Map();

  async function resolveLocalImage(rawSrc) {
    // rawSrc can be "../storage/assets/xxx.jpg", "./storage/assets/xxx.jpg", or "storage/assets/xxx.jpg"
    const cleanPath = rawSrc.replace(/^(\.\.\/|\.\/|\/)/, '');
    
    if (imageBlobCache.has(cleanPath)) {
      return imageBlobCache.get(cleanPath);
    }

    if (typeof Neutralino !== 'undefined') {
      try {
        const buffer = await Neutralino.filesystem.readBinaryFile(cleanPath);
        const ext = cleanPath.split('.').pop().toLowerCase();
        let mimeType = 'image/jpeg';
        if (ext === 'png') mimeType = 'image/png';
        else if (ext === 'gif') mimeType = 'image/gif';
        else if (ext === 'webp') mimeType = 'image/webp';
        else if (ext === 'svg') mimeType = 'image/svg+xml';

        const blob = new Blob([buffer], { type: mimeType });
        const blobUrl = URL.createObjectURL(blob);
        imageBlobCache.set(cleanPath, blobUrl);
        return blobUrl;
      } catch (err) {
        console.warn('Could not load local image:', cleanPath, err);
        return rawSrc;
      }
    }
    return rawSrc;
  }

  // --------------------------------------------------------------------------
  // Live Preview Rendering & Utilities
  // --------------------------------------------------------------------------
  async function updatePreview() {
    const rawMarkdown = el.markdownEditor.value;
    const title = el.entryTitle.value.trim() || 'Untitled';
    const category = el.entryCategory.value || 'personal';

    // Update preview category badge
    el.previewCategoryBadge.textContent = category.toUpperCase();
    el.previewCategoryBadge.className = `diary-item-category ${category}`;

    if (typeof marked !== 'undefined') {
      const html = marked.parse(rawMarkdown);
      const fullHtml = `
        <h1 style="margin-top:0;">${escapeHtml(title)}</h1>
        ${html}
      `;
      el.previewContent.innerHTML = fullHtml;

      // Resolve and replace local file image sources with Blob URLs
      const imgElements = el.previewContent.querySelectorAll('img');
      for (const img of imgElements) {
        const originalSrc = img.getAttribute('src');
        if (originalSrc && (originalSrc.includes('storage/assets/') || originalSrc.includes('storage/'))) {
          const resolvedSrc = await resolveLocalImage(originalSrc);
          img.src = resolvedSrc;
        }
      }
    } else {
      el.previewContent.textContent = rawMarkdown;
    }

    // Update character count
    el.charCount.textContent = `${rawMarkdown.length.toLocaleString()}자`;
  }

  function setUnsaved(status) {
    state.isUnsaved = status;
    if (status) {
      el.statusDot.classList.add('unsaved');
      el.statusText.textContent = 'UNSAVED';
    } else {
      el.statusDot.classList.remove('unsaved');
      el.statusText.textContent = 'SAVED';
    }
  }

  function setViewMode(mode) {
    state.viewMode = mode;
    document.body.className = `mode-${mode}`;

    el.btnViewSplit.classList.toggle('active', mode === 'split');
    el.btnViewEditor.classList.toggle('active', mode === 'editor');
    el.btnViewPreview.classList.toggle('active', mode === 'preview');
  }

  function showNotification(msg) {
    el.statusText.textContent = msg.toUpperCase();
    setTimeout(() => {
      if (!state.isUnsaved) {
        el.statusText.textContent = 'SAVED';
      }
    }, 2000);
  }

  function escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  // --------------------------------------------------------------------------
  // Event Listeners Setup
  // --------------------------------------------------------------------------
  function setupEventListeners() {
    // New Entry Button
    el.btnNewDiary.addEventListener('click', createNewEntry);

    // Save Button
    el.btnSaveDiary.addEventListener('click', saveCurrentDiary);

    // Delete Button
    el.btnDeleteDiary.addEventListener('click', deleteCurrentDiary);

    // Category Filter Buttons
    el.categoryFilterContainer.addEventListener('click', e => {
      if (e.target.classList.contains('filter-chip')) {
        el.categoryFilterContainer.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        e.target.classList.add('active');
        state.selectedCategory = e.target.dataset.category;
        renderDiaryList();
      }
    });

    // Search Input
    el.diarySearchInput.addEventListener('input', e => {
      state.searchQuery = e.target.value;
      renderDiaryList();
    });

    // Editor inputs change
    const triggerChange = () => {
      setUnsaved(true);
      updatePreview();
    };

    el.entryDate.addEventListener('input', triggerChange);
    el.entryTitle.addEventListener('input', triggerChange);
    el.entryCategory.addEventListener('change', triggerChange);
    el.markdownEditor.addEventListener('input', triggerChange);

    // Keyboard Shortcuts (Ctrl+S / Cmd+S, Tab support)
    window.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveCurrentDiary();
      }
    });

    el.markdownEditor.addEventListener('keydown', e => {
      if (e.key === 'Tab') {
        e.preventDefault();
        insertTextAtCursor(el.markdownEditor, '  ');
        setUnsaved(true);
      }
    });

    // View Mode Toggle
    el.btnViewSplit.addEventListener('click', () => setViewMode('split'));
    el.btnViewEditor.addEventListener('click', () => setViewMode('editor'));
    el.btnViewPreview.addEventListener('click', () => setViewMode('preview'));

    // Image Attach Button & File Input
    el.btnAttachImage.addEventListener('click', () => el.imageFileInput.click());
    el.imageFileInput.addEventListener('change', e => {
      if (e.target.files && e.target.files[0]) {
        handleImageFile(e.target.files[0]);
      }
    });

    // Drag & Drop Image Handling
    const dropZone = el.editorDropZone;
    const overlay = el.dropOverlay;

    ['dragenter', 'dragover'].forEach(eventName => {
      dropZone.addEventListener(eventName, e => {
        e.preventDefault();
        e.stopPropagation();
        overlay.classList.add('active');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, e => {
        e.preventDefault();
        e.stopPropagation();
        overlay.classList.remove('active');
      });
    });

    dropZone.addEventListener('drop', e => {
      const dt = e.dataTransfer;
      if (dt.files && dt.files.length > 0) {
        for (let i = 0; i < dt.files.length; i++) {
          if (dt.files[i].type.startsWith('image/')) {
            handleImageFile(dt.files[i]);
            break;
          }
        }
      }
    });
  }

  // Run app on DOMContentLoaded
  window.addEventListener('DOMContentLoaded', initApp);

})();
