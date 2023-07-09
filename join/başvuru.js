import { Validator } from "/sdk/server-js/validator";

/** @const {!Object<string, string>} */
const İlanAdı = {
  "ge-ui1": "UI Geliştirici",
  "ge-protokol1": "Protokol Geliştirici",
  "sa-ambassador1": "Ambassador",
};

/**
 * Verilen bir sorgunun doğruluğunu şu şekilde onaylar:
 *   (1) Sorgu metni nonce'ı içermeli
 *   (2) Nonce çok eski olmamalı (veya gelecekten olmamalı)
 *
 * @param {!kimlikdao.Challenge} challenge
 * @return {boolean}
 */
const sorguyuOnayla = (challenge) => {
  /** @const {number} */
  const now = Date.now();
  /** @const {number} */
  const nonce = /** @type {number} */(challenge.nonce);
  /** @const {string} */
  const formatted = new Date(nonce).toISOString()
    .slice(0, 16).replaceAll('-', '.').replace('T', ' ');

  return nonce < now + 1000 && nonce + 6e8 > now &&
    challenge.text.endsWith(formatted);
}

/** @const {!Validator} */
const TCKTValidator = new Validator({
  "0xa86a": "https://api.avax-test.network/ext/bc/C/rpc",
  "0x1": "https://cloudflare-eth.com",
  "0x89": "https://polygon-rpc.com",
  "0xa4b1": "https://arb1.arbitrum.io/rpc",
  "0x38": "https://bsc.publicnode.com",
}, null, sorguyuOnayla);

/**
 * Başvuru yapana başvurusunun alındığına dair email yollar.
 *
 * @param {!Başvuru} başvuru
 * @param {!JoinEnv} env
 * @return {!Promise<!Response>|void}
 */
const alındıEmailiYolla = (başvuru, env) => {
  if (!başvuru.email) return;
  /** @const {!did.PersonInfo} */
  const personInfo = /** @type {!did.PersonInfo} */(
    /** @type {!kimlikdao.ValidationRequest} */(başvuru).decryptedSections["personInfo"]);
  /** @const {string} */
  const ilanAdı = İlanAdı[başvuru.ilan];

  return fetch("https://api.mailchannels.net/tx/v1/send", {
    method: "POST",
    headers: {
      "content-type": "application/json;charset=utf-8"
    },
    body: JSON.stringify({
      "personalizations": [{
        "to": [{
          "email": başvuru.email,
          "name": personInfo.first + " " + personInfo.last
        }],
        "dkim_domain": "kimlikdao.org",
        "dkim_selector": "mc",
        "dkim_private_key": env.DKIM_PRIVATE_KEY
      }],
      "from": {
        "email": "dao@kimlikdao.org",
        "name": "KimlikDAO"
      },
      "subject": `KimlikDAO ${ilanAdı} başvurunuz`,
      "content": [{
        "type": "text/html;charset=utf-8",
        "value": `Sevgili ${personInfo.first},<br>` +
          `KimlikDAO <a href="https://join.kimlikdao.org/#${başvuru.ilan}">${ilanAdı}</a> başvurunu aldık. ` +
          "En kısa zamanda iletişime geçeceğiz.<p>" +
          "Bu esnada KimlikDAO hakkında daha fazla bilgi edinmek için:<table>" +
          '<tr><td>GitHub:</td><td><a href="https://github.com/KimlikDAO">https://github.com/KimlikDAO</a></td></tr>' +
          '<tr><td>Twitter:</td><td><a href="https://twitter.com/KimlikDAO">https://twitter.com/KimlikDAO</a></td></tr>' +
          '<tr><td>Docs:</td><td><a href="https://docs.kimlikdao.org">https://docs.kimlikdao.org</a></td></tr>' +
          '</table></p>' +
          "Sevgiler,<br>KimlikDAO"
      }]
    })
  })
}

/**
 * Başvuru paketini DAO'ya email olarak ilet.
 *
 * @param {!Başvuru} başvuru
 * @param {!JoinEnv} env
 * @param {boolean} isValid
 * @return {!Promise<!Response>|!Promise<void>}
 */
const başvuruEmailiYolla = (başvuru, env, isValid) => {
  /** @const {!did.PersonInfo} */
  const personInfo = /** @type {!did.PersonInfo} */(
    /** @type {!kimlikdao.ValidationRequest} */(başvuru).decryptedSections["personInfo"]);
  /** @const {string} */
  const ilanAdı = İlanAdı[başvuru.ilan];

  return fetch("https://api.mailchannels.net/tx/v1/send", {
    method: "POST",
    headers: {
      "content-type": "application/json;charset=utf-8"
    },
    body: JSON.stringify({
      "personalizations": [{
        "to": JSON.parse(env.APPLICATION_RECIPIENTS),
        "dkim_domain": "kimlikdao.org",
        "dkim_selector": "mc",
        "dkim_private_key": env.DKIM_PRIVATE_KEY
      }],
      "from": {
        "email": "dao@kimlikdao.org",
        "name": "KimlikDAO"
      },
      "subject": `Yeni başvuru: ${ilanAdı}, ${personInfo.first} ${personInfo.last}`,
      "content": [{
        "type": "text/html;charset=utf-8",
        "value": `<table>` +
          `<tr><td>TCKT geçerli mi:</td><td>${isValid ? "Evet" : "Hayır"}</td></tr>` +
          `<tr><td>Konum:</td><td><a href="https://join.kimlikdao.org/#${başvuru.ilan}">${ilanAdı} (${başvuru.ilan})</a></td></tr>` +
          `<tr><td>Email:</td><td>${başvuru.email}</td></tr>` +
          `<tr><td>Ad:</td><td>${personInfo.first} ${personInfo.last}</td></tr>` +
          `<tr><td>TCKN:</td><td>${personInfo.localIdNumber.slice(2)}</td></tr>` +
          (başvuru.github
            ? `<tr><td>GitHub:</td><td><a href="https://github.com/${başvuru.github.slice(1)}">${başvuru.github}</a></td></tr>`
            : "") +
          (başvuru.twitter
            ? `<tr><td>Twitter:</td><td><a href="https://twitter.com/${başvuru.twitter.slice(1)}">${başvuru.twitter}</a></td></tr>`
            : "") +
          (başvuru.linkedin
            ? `<tr><td>LinkedIn:</td><td>${başvuru.linkedin}</td></tr>`
            : "") +
          (başvuru.notes
            ? `<tr><td>Notes:</td><td>${başvuru.notes}</td></tr>`
            : "") +
          '</table>'
      }, {
        "type": "application/json",
        "value": JSON.stringify(başvuru),
        "file": "application.json"
      }]
    })
  })
}

/**
 * @override
 *
 * @param {!Request} req
 * @param {!JoinEnv} env
 * @param {!cloudflare.Context} ctx
 * @return {!Promise<!Response>}
 */
const başvuruAl = (req, env, ctx) => req
  .json()
  .then((başvuru) =>
    TCKTValidator.validate(/** @type {!kimlikdao.ValidationRequest} */(başvuru))
      .then((/** @type {!kimlikdao.ValidationReport} */ report) => Promise.all([
        report.isValid && alındıEmailiYolla(/** @type {!Başvuru} */(başvuru), env),
        başvuruEmailiYolla(/** @type {!Başvuru} */(başvuru), env, report.isValid)
      ]).then(() => new Response(JSON.stringify(report), {
        status: report.isValid ? 200 : 400
      })))
  )

export { başvuruAl };
