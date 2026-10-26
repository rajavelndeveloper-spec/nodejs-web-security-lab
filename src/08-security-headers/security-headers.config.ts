import helmet from "helmet";

export const securityHeadersMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      objectSrc: ["'none'"],
      imgSrc: ["*", "data:", "blob:"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },

  frameguard: {
    action: "deny",
  },

  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
  },

  noSniff: true,

  referrerPolicy: {
    policy: "no-referrer",
  },

  crossOriginOpenerPolicy: {
    policy: "same-origin",
  },

  crossOriginResourcePolicy: {
    policy: "same-origin",
  },

  crossOriginEmbedderPolicy: {
    policy: "credentialless",
  },

  xDnsPrefetchControl: {
    allow: true,
  },

});
