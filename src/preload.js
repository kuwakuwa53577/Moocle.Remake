const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  navigate: (url) => ipcRenderer.invoke('navigate', url),
  goBack: () => ipcRenderer.invoke('goBack'),
  goForward: () => ipcRenderer.invoke('goForward'),
  reload: () => ipcRenderer.invoke('reload'),
  goHome: () => ipcRenderer.invoke('goHome'),
  newTab: () => ipcRenderer.invoke('newTab'),
  switchTab: (id) => ipcRenderer.invoke('switchTab', id),
  closeTab: (id) => ipcRenderer.invoke('closeTab', id),
  getTabs: () => ipcRenderer.invoke('getTabs'),
  reorderTabs: (ids) => ipcRenderer.invoke('reorder-tabs', ids),
  setSidebarStatus: (isOpen) => ipcRenderer.invoke('set-sidebar-status', isOpen),
  setBookmarkBarStatus: (isOpen) => ipcRenderer.invoke('set-bookmark-bar-status', isOpen),
  addBookmark: () => ipcRenderer.invoke('addBookmark'),
  getBookmarks: () => ipcRenderer.invoke('getBookmarks'),
  removeBookmark: (url) => ipcRenderer.invoke('removeBookmark', url),
  getHistory: () => ipcRenderer.invoke('getHistory'),
  clearHistory: () => ipcRenderer.invoke('clearHistory'),
  openTabContextMenu: (id) => ipcRenderer.send('open-tab-context-menu', id),
  openBrowserUiContextMenu: () => ipcRenderer.send('open-browser-ui-context-menu'),
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  onTabsUpdated: (callback) => ipcRenderer.on('tabs-updated', (event, tabs, activeId) => callback(tabs, activeId)),
  
  openBookmarkContextMenu: (bookmarkData) => ipcRenderer.send('open-bookmark-context-menu', bookmarkData),
  onBookmarkDeleted: (callback) => ipcRenderer.on('bookmark-deleted-success', () => callback()),

  togglePip: (url) => ipcRenderer.invoke('toggle-pip', url),
  closePip: () => ipcRenderer.invoke('close-pip'),
  movePip: (x, y) => ipcRenderer.invoke('move-pip', { x, y }),
  resizePip: (width, height) => ipcRenderer.invoke('resize-pip', { width, height })
});
