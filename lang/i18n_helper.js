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
})();
