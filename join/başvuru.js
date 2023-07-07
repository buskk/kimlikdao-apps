import { Validator } from "/sdk/server-js/validator";

/** @const {!Object<string, string>} */
const İlanAdı = {
  "ge-ui1": "UI Geliştirici",
  "ge-protokol1": "Protokol Geliştirici",
  "ta-ambassador1": "Ambassador",
};

/**
 * @param {!kimlikdao.Challenge} challenge
 * @return {boolean}
 */
const validateChallenge = (challenge) => {
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
}, null, validateChallenge);

/**
 * @param {!Başvuru} application
 * @param {!JoinEnv} env
 * @return {!Promise<!Response>|!Promise<void>}
 */
const sendReceiptEmail = (application, env) => {
  if (!application.email)
    return Promise.resolve();
  /** @const {!did.PersonInfo} */
  const personInfo = /** @type {!did.PersonInfo} */(
    /** @type {!kimlikdao.ValidationRequest} */(application).decryptedSections["personInfo"]);
  /** @const {string} */
  const ilanAdı = İlanAdı[application.ilan];

  return fetch("https://api.mailchannels.net/tx/v1/send", {
    method: "POST",
    headers: {
      "content-type": "application/json;charset=utf-8"
    },
    body: JSON.stringify({
      "personalizations": [{
        "to": [{
          "email": application.email,
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
          `KimlikDAO <a href="https://join.kimlikdao.org/#${application.ilan}">${ilanAdı}</a> başvurunu aldık. ` +
          "En kısa zamanda iletişime geçeceğiz.<p>" +
          "Bu esnada KimlikDAO hakkında daha fazla bilgi edinmek için:<table>" +
          '<tr><td>GitHub:</td><td><a href="https://github.com/KimlikDAO">https://github.com/KimlikDAO</a></td></tr>' +
          '<tr><td>Twitter:</td><td><a href="https://twitter.com/KimlikDAO">https://twitter.com/KimlikDAO</a></td></tr>\n' +
          '<tr><td>Docs:</td><td><a href="https://docs.kimlikdao.org">https://docs.kimlikdao.org</a></td></tr>' +
          '</table></p>' +
          "Sevgiler,<br>KimlikDAO"
      }]
    })
  })
}

/**
 * @param {!Başvuru} application
 * @param {!JoinEnv} env
 * @param {boolean} isValid
 * @return {!Promise<!Response>|!Promise<void>}
 */
const sendApplicationEmail = (application, env, isValid) => {
  /** @const {!did.PersonInfo} */
  const personInfo = /** @type {!did.PersonInfo} */(
    /** @type {!kimlikdao.ValidationRequest} */(application).decryptedSections["personInfo"]);
  /** @const {string} */
  const ilanAdı = İlanAdı[application.ilan];

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
          `<tr><td>Konum:</td><td><a href="https://join.kimlikdao.org/#${application.ilan}">${ilanAdı} (${application.ilan})</a></td></tr>` +
          `<tr><td>Email:</td><td>${application.email}</td></tr>` +
          `<tr><td>Ad:</td><td>${personInfo.first} ${personInfo.last}</td></tr>` +
          `<tr><td>TCKN:</td><td>${personInfo.localIdNumber.slice(2)}</td></tr>` +
          (application.github
            ? `<tr><td>Github:</td><td>${application.github}</td></tr>`
            : "") +
          (application.twitter
            ? `<tr><td>Twitter:</td><td>${application.twitter}</td></tr>`
            : "") +
          (application.linkedin
            ? `<tr><td>LinkedIn:</td><td>${application.linkedin}</td></tr>`
            : "") +
          (application.notes
            ? `<tr><td>Notes:</td><td>${application.notes}</td></tr>`
            : "") +
          '</table>'
      }, {
        "type": "application/json",
        "value": JSON.stringify(application),
        "file": "application.json"
      }]
    })
  })
}

/**
 * @override
 *
 * @param {!cloudflare.Request} req
 * @param {!JoinEnv} env
 * @param {!cloudflare.Context} ctx
 * @return {!Promise<!Response>}
 */
const processApplication = (req, env, ctx) => req
  .json()
  .then((application) =>
    TCKTValidator.validate(/** @type {!kimlikdao.ValidationRequest} */(application))
      .then((/** @type {!kimlikdao.ValidationReport} */ report) => Promise.all([
        report.isValid
          ? sendReceiptEmail(/** @type {!Başvuru} */(application), env)
          : Promise.resolve(),
        sendApplicationEmail(/** @type {!Başvuru} */(application), env, report.isValid)
      ]).then(() => new Response(JSON.stringify(report), {
        status: report.isValid ? 200 : 400
      })))
  )

export { processApplication };
