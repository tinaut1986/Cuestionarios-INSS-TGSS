(function () {
    window.currentLang = localStorage.getItem('lang') || 'es';

    window.t = function (key, variables = {}) {
        const i18n = {
            es: window.i18n_es || {},
            ca: window.i18n_ca || {}
        };
        let text = (i18n[window.currentLang] && i18n[window.currentLang][key]) || key;
        for (const [v, val] of Object.entries(variables)) {
            text = text.replace(`{${v}}`, val);
        }
        return text;
    };

    /**
     * Devuelve el texto traducido si es un objeto {es: "...", ca: "..."}
     * o el propio string si ya es una cadena.
     * @param {string|object} textObj 
     * @returns {string}
     */
    window.getTranslatedText = function (textObj) {
        if (!textObj) return '';
        if (typeof textObj === 'string') return textObj;

        const lang = window.currentLang || 'es';
        if (textObj[lang]) return textObj[lang];

        // Fallback: Español, si no el primer idioma disponible, si no cadena vacía
        if (textObj['es']) return textObj['es'];
        const firstKey = Object.keys(textObj)[0];
        return firstKey ? textObj[firstKey] : '';
    };
})();
