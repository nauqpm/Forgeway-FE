import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("chat lightbox download saves media directly without opening a preview tab", () => {
  const attachmentPreview = read("src/modules/client/chat/hooks/useAttachmentPreview.ts");
  const messageItem = read("src/modules/client/chat/components/MessageItem.tsx");

  assert.match(attachmentPreview, /if \(!forceDownload && isPreviewable\)/);
  assert.match(
    messageItem,
    /onDownload=\{\(file\) => handleDownloadFile\(file, true\)\}/,
  );
  assert.doesNotMatch(
    attachmentPreview,
    /catch \(err\) \{[\s\S]*?window\.open\(file\.url, '_blank'\)/,
  );
});
