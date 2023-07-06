/**
 * @implements {cloudflare.DurableObject}
 */
class Applicants {
  /**
   * @param {!cloudflare.DurableObject.State} state
   */
  constructor(state, env) {
    /** @const {!cloudflare.DurableObject.Storage} */
    this.storage = state.storage;
  }

  /**
   * @param {!Request} req
   * @return {!Promise<!Response>}
   */
  fetch(req) {
    return Promise.all([
      req.json(),
      this.storage.get(["applications", "emails"]),
    ]).then(([
        /** @type {!kimlikdao.ValidationRequest} */ validationRequest,
        /** @type {!Map<string, Array<string>>} */ applicantData]
    ) => {
      /** @const {!Array<string>} */
      const emails = humanData.get("emails") || [];
      /** @const {!Array<string>} */
      const phones = humanData.get("phones") || [];

      /** @const {!did.DecryptedSections} */
      const decryptedSections = validationRequest.decryptedSections;
      if (decryptedSections["contactInfo"]) {
        /** @const {!did.ContactInfo} */
        const contactInfo = /** @type {!did.ContactInfo} */(decryptedSections["contactInfo"]);
        if (contactInfo.email && !emails.includes(contactInfo.email)) {
          emails.push(contactInfo.email);
          this.storage.put("emails", emails);
        }
        if (contactInfo.phone && !phones.includes(contactInfo.phone)) {
          phones.push(contactInfo.phone);
          this.storage.put("phones", phones);
        }
      }

      if (!humanData.has("rewards")) {
        return this.wallet.fetch(
          `http://localhost:8787?to=${validationRequest.ownerAddress}&currency=USDC&amount=5000000`
        ).then((res) => {
          const txHash = res.headers.get("txHash");
          this.storage.put("rewards", [txHash]);
          return Response.json({ txHash });
        });
      }
      return new Response("already sent");
    });
  }
}

export { Applicants };
