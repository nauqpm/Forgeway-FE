/**
 * Opens an image or media preview in a new browser tab with an integrated toolbar
 * containing the file name and a one-click Download ("Tải xuống") button.
 */
export function openMediaInNewTab(url: string, filename: string = 'image') {
  if (!url || typeof url !== 'string') return;

  const trimmedUrl = url.trim();
  const isAllowedScheme = /^(https?:|blob:)/i.test(trimmedUrl);

  if (!isAllowedScheme) {
    console.error('Refused to open media URL with unsafe scheme:', trimmedUrl);
    return;
  }

  const newTab = window.open('', '_blank');
  if (!newTab) {
    window.open(trimmedUrl, '_blank', 'noopener,noreferrer');
    return;
  }

  const safeFilenameStr = filename || 'image';

  const escapeHtmlAttr = (str: string) =>
    str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const safeHtmlFilename = escapeHtmlAttr(safeFilenameStr);
  const safeHtmlUrl = escapeHtmlAttr(trimmedUrl);

  const jsonUrl = JSON.stringify(trimmedUrl);
  const jsonFilename = JSON.stringify(safeFilenameStr);

  newTab.document.write(`
    <!DOCTYPE html>
    <html lang="vi">
      <head>
        <meta charset="utf-8" />
        <title>${safeHtmlFilename}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            background-color: #0f172a;
            color: #f8fafc;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            display: flex;
            flex-direction: column;
            min-height: 100vh;
            overflow-x: hidden;
          }
          .header {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            height: 56px;
            background: rgba(15, 23, 42, 0.85);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 20px;
            z-index: 50;
          }
          .title {
            font-size: 14px;
            font-weight: 500;
            color: #e2e8f0;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 60%;
          }
          .btn-download {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background-color: #2563eb;
            color: #ffffff;
            border: none;
            border-radius: 6px;
            padding: 8px 16px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            text-decoration: none;
            transition: background-color 0.2s, transform 0.1s;
          }
          .btn-download:hover {
            background-color: #1d4ed8;
          }
          .btn-download:active {
            transform: scale(0.97);
          }
          .content {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 72px 20px 24px;
          }
          .preview-img {
            max-width: 100%;
            max-height: calc(100vh - 100px);
            object-fit: contain;
            border-radius: 8px;
            box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.5);
          }
        </style>
      </head>
      <body>
        <header class="header">
          <div class="title">${safeHtmlFilename}</div>
          <button id="dl-btn" class="btn-download">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Tải xuống
          </button>
        </header>
        <main class="content">
          <img class="preview-img" src="${safeHtmlUrl}" alt="${safeHtmlFilename}" />
        </main>
        <script>
          (function() {
            const targetUrl = ${jsonUrl};
            const downloadFilename = ${jsonFilename};

            document.getElementById('dl-btn').addEventListener('click', async () => {
              const btn = document.getElementById('dl-btn');
              const originalText = btn.innerHTML;
              btn.innerText = 'Đang tải...';
              btn.disabled = true;
              try {
                const res = await fetch(targetUrl);
                const blob = await res.blob();
                const blobUrl = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = blobUrl;
                a.download = downloadFilename;
                document.body.appendChild(a);
                a.click();
                a.remove();
                setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
              } catch (err) {
                const a = document.createElement('a');
                a.href = targetUrl;
                a.download = downloadFilename;
                a.target = '_blank';
                document.body.appendChild(a);
                a.click();
                a.remove();
              } finally {
                btn.innerHTML = originalText;
                btn.disabled = false;
              }
            });
          })();
        </script>
      </body>
    </html>
  `);
  newTab.document.close();
}
