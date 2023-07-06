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

/** @const {!cloudflare.DurableObjectBinding} */
JoinEnv.prototype.Applicants;

/** @const {!cloudflare.KeyValue} */
JoinEnv.prototype.KV;

/**
 * @constructor
 * @extends {kimlikdao.ValidationRequest}
 */
function ApplyRequest() { }
