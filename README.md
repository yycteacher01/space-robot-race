# 第一屆太空機械人競速賽 即時排名

可直接部署至 GitHub Pages，無須安裝套件或建置。三場賽事各有兩個項目，由 Google Sheet 經 Apps Script 唯讀端點同步。

## 排名方式

- 項目一420秒，項目二360秒。
- 每項兩次機會，選分數較高、同分時間較短的一次完整紀錄。
- 總排名合計兩項選定紀錄的分數及比較時間；分數高優先，同分時間短優先，同分同時間並列。
- 未完成的有效成績保留所得分，比較時間按該項限時計。未出賽、無效、分數空白及完成時間不合規不排名。
- 網頁、搜尋及CSV匯出均不顯示學校欄位。

## 上傳及啟用 Pages

1. 在 GitHub 建立儲存庫，例如 `space-robot-race`。
2. 將本資料夾的檔案上傳至儲存庫根目錄，確保 `index.html` 直接位於根目錄。
3. 選 **Settings → Pages → Build and deployment → Deploy from a branch**。
4. 分支選 **main**（或實際上傳分支），目錄選 **/(root)**，儲存。
5. 等待部署完成，使用 Pages 設定頁提供的實際網站網址。

GitHub Free 一般須用公開儲存庫才能啟用 Pages。私人儲存庫不等於私人 Pages 網站，實際存取權以帳戶方案及設定為準。建立前先決定原始碼及網站的公開範圍。

## 連接 Google Sheet

已建立的計分表：
https://docs.google.com/spreadsheets/d/1CsbL8KaRxxKcpNYNvPu61NqI5TOOxrXyl9O6uSXLTLI/edit

1. 本表的 **擴充功能 → Apps Script** 貼上 `Code.gs`，儲存。來源已填妥，不須執行 `setupCompetition`。
2. **部署 → 新增部署作業 → 網頁應用程式**，執行身分選 **我**，存取權選 **所有人**。
3. 複製 `/exec` 網址，在新網站的 **連接與設定** 貼上並連接。

若已有可用的端點，直接在新網站貼上同一 `/exec` 網址即可，不必重建試算表。舊網域的瀏覽器本機設定不會自動轉移至新網域。連接後可複製帶資料來源的看板連結供其他展示裝置使用。

計分員的試算表編輯權限另外管理。GitHub Pages 只提供網頁，Google Apps Script 仍提供即時資料；程式不含密碼或存取權杖。

## 檔案及檢查

網站由 `index.html`、`style.css`、`app.js`、`ranking.mjs` 組成，全部使用相對路徑，支援專案子目錄。`.nojekyll` 讓 Pages 直接提供靜態檔案。完整連接說明見 `setup-guide.txt`。

在具備 Node.js 的環境執行：

```sh
node test-ranking.mjs
node test-appsscript.mjs
node test-ui.mjs
```

發布前以測試隊伍驗證新增、修改分數、同分時間比較及不同場次切換。尚未設定端點時顯示等待連接；示範模式另行清楚標示。

官方部署參考：
https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
