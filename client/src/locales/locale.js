import ar from "./ar.js";

const languages = {
    ar,
};

export const getLocale = (langCode = "ar") => {
    return languages[langCode] || ar;
};