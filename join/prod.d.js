/**
 * @fileoverview join.kimlikdao.org worker tanımları.
 *
 * @author KimlikDAO
 * @externs
 */

/**
 * @interface
 * @extends {cloudflare.Environment}
 */
const JoinEnv = function () { };

/** @const {!cloudflare.KeyValue} */
JoinEnv.prototype.KV;

/** @const {string} */
JoinEnv.prototype.DKIM_PRIVATE_KEY;

/** @const {string} */
JoinEnv.prototype.APPLICATION_RECIPIENTS;
