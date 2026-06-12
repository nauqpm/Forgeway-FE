import { test, expect } from '@playwright/test';

test.describe('Editor Memory Leak Tests', () => {
  test('should not leak memory when toggling edit/read mode repeatedly', async ({ page }) => {
    // Go to documents page
    await page.goto('/workspaces/documents');

    // Wait for editor to render
    await page.waitForSelector('.tiptap-content');

    // Enable JS Heap tracking (Chrome-only, requires --enable-precision-memory flag)
    const getHeapSize = async () => {
      return await page.evaluate(() => {
        // @ts-ignore
        return window.performance && window.performance.memory 
          ? (window.performance.memory as any).usedJSHeapSize 
          : null;
      });
    };

    const initialHeap = await getHeapSize();
    if (initialHeap) {
      console.log(`Initial Heap Size: ${(initialHeap / 1024 / 1024).toFixed(2)} MB`);
    } else {
      console.log("Memory API not supported in this browser. Skipping heap measurement.");
      return;
    }

    // Toggle Read/Edit mode 50 times (100 total state changes)
    for (let i = 0; i < 50; i++) {
      const toggleBtn = page.locator('button:has-text("Chỉnh sửa"), button:has-text("Xem")');
      if (await toggleBtn.first().isVisible()) {
        await toggleBtn.first().click();
        await page.waitForTimeout(150); // small delay to allow react to update
      }
    }

    // Cooldown and wait for garbage collection
    await page.waitForTimeout(3000);

    const finalHeap = await getHeapSize();
    if (finalHeap) {
      console.log(`Final Heap Size after 50 toggles: ${(finalHeap / 1024 / 1024).toFixed(2)} MB`);
      
      const diffMB = (finalHeap - initialHeap) / 1024 / 1024;
      console.log(`Memory Difference: ${diffMB.toFixed(2)} MB`);
      
      // Threshold: Memory growth should not exceed 15MB after 50 cycles
      expect(diffMB).toBeLessThan(15);
    }
  });

  test('should not leak memory when switching documents repeatedly', async ({ page }) => {
    await page.goto('/workspaces/documents');
    await page.waitForSelector('.tiptap-content');

    const getHeapSize = async () => {
      return await page.evaluate(() => {
        // @ts-ignore
        return window.performance && window.performance.memory 
          ? (window.performance.memory as any).usedJSHeapSize 
          : null;
      });
    };

    const initialHeap = await getHeapSize();
    if (!initialHeap) return;

    console.log(`Initial Heap Size: ${(initialHeap / 1024 / 1024).toFixed(2)} MB`);

    // Switch documents 20 times (between first and second document in the list)
    for (let i = 0; i < 20; i++) {
      // Find list items in Sidebar tree
      const docItems = page.locator('span[class*="truncate"]');
      const count = await docItems.count();
      if (count > 1) {
        await docItems.nth(1).click();
        await page.waitForTimeout(400);
        await docItems.first().click();
        await page.waitForTimeout(400);
      }
    }

    await page.waitForTimeout(3000);

    const finalHeap = await getHeapSize();
    if (finalHeap) {
      console.log(`Final Heap Size after document switching: ${(finalHeap / 1024 / 1024).toFixed(2)} MB`);
      
      const diffMB = (finalHeap - initialHeap) / 1024 / 1024;
      console.log(`Memory Difference: ${diffMB.toFixed(2)} MB`);
      
      // Threshold: Memory growth should not exceed 20MB after 20 cycles
      expect(diffMB).toBeLessThan(20);
    }
  });
});
