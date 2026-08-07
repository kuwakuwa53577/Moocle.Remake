// UI要素の取得
const urlbar = document.getElementById("urlbar");
const backBtn = document.getElementById("backBtn");
const forwardBtn = document.getElementById("forwardBtn");
const reloadBtn = document.getElementById("reloadBtn");
const homeBtn = document.getElementById("homeBtn");
const newTabBtn = document.getElementById("newTabBtn");
const tabsContainer = document.getElementById("tabs");

const backHistoryBtn = document.getElementById("backHistoryBtn");
const historyPopup = document.getElementById("historyPopup");
const bookmarkBtn = document.getElementById("bookmarkBtn");
const bookmarkBar = document.getElementById("bookmarkBar");
const settingsBtn = document.getElementById("settingsBtn");
const closeSettingsBtn = document.getElementById("closeSettingsBtn");
const settingsSidebar = document.getElementById("settingsSidebar");

const toggleBookmarkBar = document.getElementById("toggleBookmarkBar");
const toggleTabScroll = document.getElementById("toggleTabScroll");
const themeSelect = document.getElementById("themeSelect");
const tabShapeSelect = document.getElementById("tabShapeSelect");
const fontSizeSelect = document.getElementById("fontSizeSelect");
const searchEngineSelect = document.getElementById("searchEngine");
const resetSettingsBtn = document.getElementById("resetSettingsBtn");

const winMinimizeBtn = document.getElementById("win-minimize-btn");
const winMaximizeBtn = document.getElementById("win-maximize-btn");
const winCloseBtn = document.getElementById("win-close-btn");

function executeEngineSearch(engine, queryToken) {
    switch (engine) {
        case "startpage":  return `https://www.startpage.com/sp/search?query=${queryToken}`;
        case "brave":      return `https://search.brave.com/search?q=${queryToken}`;
        case "vivaldi":    return `https://bing.com/search?q=${queryToken}`;
        case "coccoc":     return `https://coccoc.com/search?query=${queryToken}`;
        case "konqueror":  return `https://search.yahoo.com/search?p=${queryToken}`;
        case "tor":
        case "srware":     return `https://duckduckgo.com/?q=${queryToken}`;
        case "firefox":
        case "chromium":
        case "floorp":
        case "opera":
        case "google":
        default:           return `https://www.google.com/search?q=${queryToken}`;
    }
}

function normalizeInput(input) {
    input = input.trim();
    if (!input) return "";
    
    if (input.startsWith("http://") || input.startsWith("https://")) {
        return input;
    }
    
    if (input.includes(".") && !input.includes(" ")) {
        return "https://" + input;
    }
    
    const currentEngine = localStorage.getItem("searchEngine") || "google";
    return executeEngineSearch(currentEngine, encodeURIComponent(input));
}

// 1. タブ機能
window.electronAPI.onTabsUpdated((tabsList, activeTabId) => {
    if (!tabsContainer) return;
    tabsContainer.innerHTML = ""; 

    tabsList.forEach((tabData) => {
        const tabEl = document.createElement("div");
        tabEl.className = `tab ${tabData.id === activeTabId ? "active" : ""}`;
        tabEl.setAttribute("draggable", "true");
        tabEl.dataset.id = tabData.id;
        
        tabEl.style.display = "flex";
        tabEl.style.alignItems = "center";
        tabEl.style.gap = "6px";
        
        if (tabData.id === activeTabId && urlbar && !urlbar.matches(':focus')) {
            if (tabData.url.startsWith("file://") && tabData.url.includes("newtab.html")) {
                urlbar.value = "";
            } else {
                urlbar.value = tabData.url;
            }
        }

        const favIconImg = document.createElement("img");
        favIconImg.className = "tab-favicon";
        favIconImg.style.width = "16px";
        favIconImg.style.height = "16px";
        favIconImg.style.flexShrink = "0";
        favIconImg.style.borderRadius = "2px";
        
        if (tabData.favicon) {
            favIconImg.src = tabData.favicon;
        } else {
            favIconImg.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.5)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='12' r='10'></circle><line x1='2' y1='12' x2='22' y2='12'></line><path d='M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z'></path></svg>";
        }
        tabEl.appendChild(favIconImg);

        const titleSpan = document.createElement("span");
        titleSpan.className = "tab-title";
        titleSpan.textContent = tabData.title || "新しいタブ";
        titleSpan.style.flexGrow = "1";
        titleSpan.style.overflow = "hidden";
        titleSpan.style.textOverflow = "ellipsis";
        titleSpan.style.whiteSpace = "nowrap";
        
        titleSpan.addEventListener("click", () => {
            window.electronAPI.switchTab(tabData.id); 
        });

        const closeBtn = document.createElement("button");
        closeBtn.className = "close-tab-btn";
        closeBtn.textContent = "✕";
        closeBtn.addEventListener("click", (e) => {
            e.stopPropagation(); 
            window.electronAPI.closeTab(tabData.id); 
        });

        tabEl.appendChild(titleSpan);
        tabEl.appendChild(closeBtn);

        tabEl.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            e.stopPropagation();
            window.electronAPI.openTabContextMenu(tabData.id);
        });

        tabEl.addEventListener('dragstart', (e) => {
            tabEl.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });

        tabEl.addEventListener('dragend', () => {
            tabEl.classList.remove('dragging');
            const currentOrderIds = Array.from(tabsContainer.children).map(el => parseInt(el.dataset.id));
            window.electronAPI.reorderTabs(currentOrderIds);
        });

        tabsContainer.appendChild(tabEl);
    });
});

tabsContainer?.addEventListener('dragover', (e) => {
    e.preventDefault();
    const draggingEl = document.querySelector('.dragging');
    if (!draggingEl) return;

    const siblings = [...tabsContainer.querySelectorAll('.tab:not(.dragging)')];
    
    const nextSibling = siblings.find(sibling => {
        const box = sibling.getBoundingClientRect();
        return e.clientX < box.left + box.width / 2;
    });
    
    tabsContainer.insertBefore(draggingEl, nextSibling);
});

// 2. ブックマーク機能
async function updateBookmarkBar() {
    if (!bookmarkBar) return;
    bookmarkBar.innerHTML = "";
    const bookmarks = await window.electronAPI.getBookmarks();
    
    const seenUrls = new Set();
    
    bookmarks.forEach(b => {
        if (!b.url || seenUrls.has(b.url)) return;
        seenUrls.add(b.url);

        const btn = document.createElement("button");
        btn.className = "bookmark-item";
        btn.textContent = b.title || b.url;
        btn.title = b.url;
        
        btn.addEventListener("click", () => {
            window.electronAPI.navigate(b.url);
        });
        
        btn.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            e.stopPropagation();
            window.electronAPI.openBookmarkContextMenu({ title: b.title, url: b.url });
        });
        
        bookmarkBar.appendChild(btn);
    });
}

if (!window.bookmarkListenerLoaded) {
    window.electronAPI.onBookmarkDeleted(() => {
        updateBookmarkBar();
    });
    
    bookmarkBtn?.addEventListener("click", async () => {
        const success = await window.electronAPI.addBookmark();
        if (success) {
            updateBookmarkBar();
        }
    });

    window.bookmarkListenerLoaded = true;
}

// 3. 履歴機能
backHistoryBtn?.addEventListener("click", async (e) => {
    e.stopPropagation(); 
    if (!historyPopup) return;

    if (!historyPopup.classList.contains("hidden")) {
        historyPopup.classList.add("hidden");
        return;
    }

    const historyItems = await window.electronAPI.getHistory();
    historyPopup.innerHTML = "";
    
    if (!historyItems || historyItems.length === 0) {
        historyPopup.innerHTML = "<div class='history-item empty'>履歴はありません</div>";
    } else {
        historyItems.forEach(item => {
            const itemEl = document.createElement("div");
            itemEl.className = "history-item";
            itemEl.textContent = item.title || item.url;
            itemEl.title = item.url; 
            
            itemEl.addEventListener("click", () => {
                window.electronAPI.navigate(item.url);
                historyPopup.classList.add("hidden");
            });
            historyPopup.appendChild(itemEl);
        });
    }
    historyPopup.classList.remove("hidden");
});

document.addEventListener("click", () => {
    historyPopup?.classList.add("hidden");
});

// 4. ナビゲーション基本イベント
const pipBtn = document.getElementById("pipBtn");

pipBtn?.addEventListener("click", async () => {
  const isOpen = await window.electronAPI.togglePip("https://www.youtube.com");
  pipBtn.classList.toggle("active", isOpen);
});

urlbar?.addEventListener("keydown", e => {
    if (e.key !== "Enter") return;
    const normalizedUrl = normalizeInput(urlbar.value);
    if (normalizedUrl) {
        window.electronAPI.navigate(normalizedUrl);
    }
    urlbar.blur();
});

backBtn?.addEventListener("click", () => { window.electronAPI.goBack(); });
forwardBtn?.addEventListener("click", () => { window.electronAPI.goForward(); });
reloadBtn?.addEventListener("click", () => { window.electronAPI.reload(); });
homeBtn?.addEventListener("click", () => { window.electronAPI.goHome(); });
newTabBtn?.addEventListener("click", () => { window.electronAPI.newTab(); });

// PIP 操作イベント
const pipCloseBtn = document.getElementById("pipCloseBtn");
const pipSmallBtn = document.getElementById("pipSmallBtn");
const pipMediumBtn = document.getElementById("pipMediumBtn");
const pipLargeBtn = document.getElementById("pipLargeBtn");
const pipHeader = document.getElementById("pip-header");

pipCloseBtn?.addEventListener("click", () => {
  window.electronAPI.closePip();
});

pipSmallBtn?.addEventListener("click", () => {
  window.electronAPI.resizePip(360, 202);
});
pipMediumBtn?.addEventListener("click", () => {
  window.electronAPI.resizePip(540, 304);
});
pipLargeBtn?.addEventListener("click", () => {
  window.electronAPI.resizePip(720, 405);
});

let isDraggingPip = false;
let startX, startY;

pipHeader?.addEventListener("mousedown", (e) => {
  isDraggingPip = true;
  startX = e.clientX;
  startY = e.clientY;
});

window.addEventListener("mousemove", (e) => {
  if (!isDraggingPip) return;
  window.electronAPI.movePip(e.screenX - 100, e.screenY - 100);
});

window.addEventListener("mouseup", () => {
  isDraggingPip = false;
});

// 5. 設定サイドバー・各種変更イベント
settingsBtn?.addEventListener("click", () => {
    settingsSidebar?.classList.add("open");
    window.electronAPI.setSidebarStatus(true);
});

closeSettingsBtn?.addEventListener("click", () => {
    settingsSidebar?.classList.remove("open");
    window.electronAPI.setSidebarStatus(false);
});

toggleBookmarkBar?.addEventListener("change", (e) => {
    const isOpen = e.target.checked;
    if (bookmarkBar) bookmarkBar.style.display = isOpen ? "flex" : "none";
    window.electronAPI.setBookmarkBarStatus(isOpen);
});

toggleTabScroll?.addEventListener("change", (e) => {
    if (e.target.checked) {
        document.body.classList.remove("no-tab-scroll");
    } else {
        document.body.classList.add("no-tab-scroll");
    }
});

themeSelect?.addEventListener('change', (e) => {
  if (e.target.value === 'light') {
    document.body.classList.remove('theme-dark');
    document.body.classList.add('theme-light');
  } else {
    document.body.classList.remove('theme-light');
    document.body.classList.add('theme-dark');
  }
});

fontSizeSelect?.addEventListener('change', (e) => {
  document.body.classList.remove('font-small', 'font-medium', 'font-large');
  document.body.classList.add(`font-${e.target.value}`);
});

tabShapeSelect?.addEventListener("change", (e) => {
    const selectedShape = e.target.value;
    document.body.classList.remove("chrome-tabs", "square-tabs");
    document.body.classList.add(`${selectedShape}-tabs`);
});

searchEngineSelect?.addEventListener('change', (e) => {
    localStorage.setItem('searchEngine', e.target.value);
});

resetSettingsBtn?.addEventListener("click", () => {
    if (confirm("履歴などのデータを初期化しますか？")) {
        window.electronAPI.clearHistory(); 
        if (historyPopup) historyPopup.innerHTML = "";
    }
});

document.getElementById('bgUpload')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const base64Data = event.target.result;
            localStorage.setItem('set_bg', base64Data);
            const bgEl = document.getElementById('browser-bg');
            if (bgEl) bgEl.style.backgroundImage = `url(${base64Data})`;
        };
        reader.readAsDataURL(file);
    }
});

window.addEventListener("contextmenu", (e) => {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.classList.contains("bookmark-item")) return;
    e.preventDefault();
    window.electronAPI.openBrowserUiContextMenu();
});

winMinimizeBtn?.addEventListener("click", () => { window.electronAPI.minimize(); });
winMaximizeBtn?.addEventListener("click", () => { window.electronAPI.maximize(); });
winCloseBtn?.addEventListener("click", () => { window.electronAPI.close(); });

// 6. 起動時初期化
window.addEventListener("DOMContentLoaded", () => {
    updateBookmarkBar();
    
    if (searchEngineSelect) {
        searchEngineSelect.value = localStorage.getItem("searchEngine") || "google";
    }

    let parentBg = localStorage.getItem('set_bg');
    if (!parentBg) {
        parentBg = "https://cdn.pakutaso.com/shared/img/thumb/YAT20314032_TP_V.jpg";
        localStorage.setItem('set_bg', parentBg);
    }

    const bgEl = document.getElementById('browser-bg');
    if (parentBg && bgEl) {
        bgEl.style.backgroundImage = `url(${parentBg})`;
    }
});
