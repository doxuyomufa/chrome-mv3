// Offscreen document — принимает команды от background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'stealth_capture') {
        captureFullPage(message.url, message.fullPage)
            .then(dataUrl => sendResponse({ dataUrl }))
            .catch(err => sendResponse({ error: err.message }));
        return true;
    }
});

async function captureFullPage(url, fullPage) {
    // Загружаем страницу в iframe (в offscreen контексте)
    const iframe = document.createElement('iframe');
    iframe.src = url;
    iframe.style.width = fullPage ? '1920px' : '100%';
    iframe.style.height = fullPage ? '10000px' : '100%';
    iframe.style.opacity = '0';
    iframe.style.position = 'fixed';
    iframe.style.top = '-9999px';
    document.body.appendChild(iframe);

    await new Promise((resolve) => {
        iframe.onload = () => setTimeout(resolve, 2000); // ждём рендер
    });

    // Захват через Canvas
    const canvas = new OffscreenCanvas(1920, fullPage ? 10000 : 1080);
    const ctx = canvas.getContext('2d');

    // Рендерим iframe content в canvas
    const bitmap = await createImageBitmap(iframe);
    ctx.drawImage(bitmap, 0, 0);

    iframe.remove();

    const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.8 });
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
    });
}