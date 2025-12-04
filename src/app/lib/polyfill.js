// src/app/lib/polyfill.js
if (typeof window !== 'undefined') {
    // Polyfill for MSAL crypto
    if (!window.crypto) {
        window.crypto = {
            getRandomValues: function(array) {
                for (let i = 0; i < array.length; i++) {
                    array[i] = Math.floor(Math.random() * 256);
                }
                return array;
            },
            subtle: {}
        };
    }

    // Ensure MSAL has what it needs
    if (!window.msCrypto) {
        window.msCrypto = window.crypto;
    }
}