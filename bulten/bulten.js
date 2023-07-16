import { keccak256 } from "../lib/crypto/sha3";

/** @define {string} */
const BEARER_TOKEN = "BEARER_TOKEN_PLACEHOLDER";

/** @define {string} */
const HASH_SALT = "HASH_SALT_PLACEHOLDER";

/** @define {string} */
const URL = "https://bulten.kimlikdao.org/";

/** @const {!Array<string>} */
const AyAdları = [
  "Ocak", "Şubat", "Mart", "Nisan",
  "Mayıs", "Haziran", "Temmuz", "Ağustos",
  "Eylül", "Ekim", "Kasım", "Aralık"
];

/**
 * @param {string} email
 * @return {string} email saklama anahtarı
 */
const emailAnahtarı = (email) => {
  /** @const {Array<string>} */
  const bölümler = email.split("@");
  /** @const {string} */
  const emailKökü = bölümler[0].split("+")[0];

  return keccak256(HASH_SALT
    + (bölümler[1] == "gmail.com" ? emailKökü.replaceAll(".", "") : emailKökü)
    + "@" + bölümler[1]).slice(0, 20);
}

/**
 * @return {!Response}
 */
const tamam = () => new Response("👍", {
  headers: { "content-type": "text/html;charset=utf-8" }
});

/**
 * @param {string} anahtar
 * @return {!Response}
 */
const çıkSayfası = (anahtar) => new Response(
  '<!doctypehtml><html lang=tr><meta charset=utf-8>' +
  `<form id=f method="post" action="${anahtar}">` +
  '<button type="submit" name="List-Unsubscribe" value="One-Click" alt="Unsubscribe">Abonelikten çık</button>' +
  "</form>" /* + "<script>setTimeout(()=>document.getElementById('f').submit(),5000)</script>" */, {
  headers: { "content-type": "text/html;charset=utf-8" }
});

/**
 * @implements {cloudflare.ModuleWorker}
 */
const Bulten = {
  /**
   * @param {!Request} req
   * @param {!BultenEnv} env
   * @param {!cloudflare.Context} ctx
   * @return {!Promise<!Response>|!Response}
   */
  fetch(req, env, ctx) {
    /** @const {string} */
    const path = req.url.slice(URL.length);

    if (path.startsWith("cik"))
      return çıkSayfası(path.slice(4));

    if (req.method == "GET")
      return Response.redirect("https://blog.kimlikdao.org/?bulten");

    if (path.length == 20)
      return req.text().then((text) => {
        if (text.toLowerCase().replaceAll(" ", "") == "list-unsubscribe=one-click")
          ctx.waitUntil(env.KV.delete(path))
        return tamam();
      });

    /** @const {boolean} */
    const yetkili = req.headers.get("authorization")?.slice(7) == BEARER_TOKEN;
    if (path == "ekle")
      return req.json().then((kayıt) => {
        /** @const {string} */
        const anahtar = emailAnahtarı(/** @type {Kayıt} */(kayıt).email);
        if (yetkili || !/** @type {Kayıt} */(kayıt).ad)
          ctx.waitUntil(env.KV.put(anahtar, "", { metadata: kayıt }))
        return tamam();
      })

    if (!yetkili) return tamam();
    if (path == "list")
      return env.KV.list()
        .then((/** @type {!cloudflare.KeyValueList} */ res) => Response.json(res.keys));

    if (path == "yolla")
      return this.yolla(env);

    return tamam();
  },

  /**
   * @param {!BultenEnv} env
   * @return {!Promise<!Response>}
   */
  async yolla(env) {
    /** @const {string} */
    const dkimPrivateKey = env.DKIM_PRIVATE_KEY;
    /** @const {!Date} */
    const tarih = new Date();
    /** @const {string} */
    const ay = AyAdları[tarih.getMonth()] + " " + tarih.getFullYear();
    /** @const {!cloudflare.KeyValueList} */
    const kayıtlar = await env.KV.list();
    /** @const {!Object<string, !Object>} */
    const sonuç = {};

    for (const { name: anahtar, metadata } of kayıtlar.keys) {
      /** @const {Kayıt} */
      const kayıt = /** @type {Kayıt} */(metadata);
      /** @const {string} */
      const body = JSON.stringify({
        "personalizations": [{
          "to": [{
            "name": kayıt.ad,
            "email": kayıt.email
          }],
          "dkim_domain": "kimlikdao.org",
          "dkim_selector": "bulten",
          "dkim_private_key": dkimPrivateKey
        }],
        "from": {
          "email": "dao@kimlikdao.org",
          "name": "KimlikDAO"
        },
        "headers": {
          "Precedence": "bulk",
          "List-Unsubscribe": `<mailto:${anahtar}@kimlikdao.net>, <https://bulten.kimlikdao.org/${anahtar}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
        "subject": `🗞️ KimlikDAO gelişmeler | ${ay}`,
        "content": [{
          "type": "text/html;charset=utf-8",
          "value": "KimlikDAO aylık bülten " +
            `<a href="https://bulten.kimlikdao.org/cik/${anahtar}" target=_blank rel=noopener>Abonelikten çık</a>`
        }]
      });
      sonuç[anahtar] = await fetch("https://api.mailchannels.net/tx/v1/send", {
        method: "POST",
        headers: { "content-type": "application/json;charset=utf-8" },
        body
      }).then((res) => res.json());
    }
    return Response.json(sonuç);
  }
}

export default Bulten;
globalThis["Bulten"] = Bulten;
