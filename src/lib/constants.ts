export const ARTICLE_PER_PAGE = 6;

// const PRODUCTION_DOMAIN = "https://nextjs-tah.vercel.app";
// const PRODUCTION_DOMAIN = "http://192.168.58.63:3000";
const PRODUCTION_DOMAIN = "http://localhost:3000";

const DEVELOPMENT_DOMAIN = "http://localhost:3000";
// const DEVELOPMENT_DOMAIN = "http://192.168.58.63:3000"; // ← غيّر لـ IP جهاز السيرفر

export const DOMAIN = process.env.NODE_ENV === 'production' 
    ? PRODUCTION_DOMAIN
    : DEVELOPMENT_DOMAIN;