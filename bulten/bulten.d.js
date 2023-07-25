/**
 * @author KimlikDAO
 * @externs
 */

/**
 * @typedef {{
 *   ad: string,
 *   email: string,
 *   kaynak: (string|undefined)
 * }}
 */
let Kayıt;

/**
 * @interface
 * @struct
 * @extends {cloudflare.Environment}
 */
const BultenEnv = function () { }

/** @const {!cloudflare.KeyValue} */
BultenEnv.prototype.KV;

/** @const {string} */
BultenEnv.prototype.DKIM_PRIVATE_KEY;

/** @const {string} */
BultenEnv.prototype.HASH_SALT;

/** @const {string} */
BultenEnv.prototype.BEARER_TOKEN;
