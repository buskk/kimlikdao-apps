/**
 * @implements {cloudflare.EmailWorker}
 */
const BultenEmail = {
  /**
   * @param {!cloudflare.EmailMessage} msg
   * @param {!BultenEnv} env
   * @return {!Promise<void>|void}
   */
  email(msg, env) {
    /** @const {string} */
    const anahtar = msg.to.split("@")[0];
    if (anahtar.length == 20)
      return env.KV.delete(anahtar);
  }
};

export default BultenEmail;
globalThis["BultenEmail"] = BultenEmail;
