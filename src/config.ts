/**
 * Site-wide configuration the founder edits by hand.
 *
 * The guestbook and donation forms are hosted on a third-party service
 * (金数据 / jinshuju is recommended — reliable inside mainland China, free
 * tier, iframe embed). Paste the form's embed/share URL here once created;
 * until then the pages fall back to a plain email link. No backend involved.
 */
export const site = {
  /** Public contact address. Change to a mailbox you actually watch. */
  email: "hello@zhimaishu.com",
  domain: "zhimaishu.com",
};

export const forms = {
  /** 赠书登记表 — book-donation offer form URL. Empty ⇒ email fallback only. */
  donate: "",
  /** 留言 — guestbook submission form URL. Empty ⇒ email fallback only. */
  guestbook: "",
};
