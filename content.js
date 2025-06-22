

function getPageContent() {
    // find the main article element
    const article = document.querySelector('article') || document.body;
    let textContent = '';

    if (article) {
        // Select common elements that usually contain main content
        const selectors = 'p, h1, h2, h3, h4, h5, h6, li, span, div:not([aria-hidden])';
        const elements = article.querySelectorAll(selectors);

        if (elements.length > 0) {
            elements.forEach(el => {
               
                if (!el.closest('footer') && !el.closest('nav') && !el.closest('header') &&
                    !el.closest('aside') && el.offsetWidth > 0 && el.offsetHeight > 0) {
                    const text = el.textContent.trim();
                    if (text.length > 0) {
                        textContent += text + '\n';
                    }
                }
            });
        }
    }

    // Fallback to body innerText if specific article extraction yields no text
    if (!textContent.trim() && document.body) {
        textContent = document.body.innerText;
    }


    textContent = textContent.replace(/\s+/g, ' ').trim();

    return {
        text: textContent,
        url: window.location.href,
        title: document.title    
    };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'GET_PAGE_CONTENT') {
        const content = getPageContent();
        sendResponse({ success: true, content: content });

        return true;
    }
});