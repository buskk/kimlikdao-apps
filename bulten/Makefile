include bulten/.gizli

build/bulten/bulten.js: bulten/bulten.js bulten/bulten.d.js bulten/Makefile \
    lib/cloudflare/types.d.js \
    lib/cloudflare/moduleWorker.d.js \
    lib/crypto/sha3.js \
    lib/util/çevir.js
	yarn google-closure-compiler -W VERBOSE -O ADVANCED --charset UTF-8 \
                             --define "BEARER_TOKEN\$$\$$module\$$bulten\$$bulten=$(BEARER_TOKEN)" \
                             --define "HASH_SALT\$$\$$module\$$bulten\$$bulten=$(HASH_SALT)" \
                             --jscomp_error=checkTypes \
                             --jscomp_error=strictCheckTypes \
                             --jscomp_error=unusedLocalVariables \
                             --emit_use_strict \
                             --module_resolution NODE \
                             --assume_function_wrapper \
                             --dependency_mode PRUNE \
                             --entry_point $< \
                             --js $^ \
                             --js_output_file $@
	yarn uglifyjs $@ -m -c toplevel,unsafe,drop_console -o $@
	sed -i.bak 's/globalThis.Bulten=/export default/g' $@
	wc $@


build/bulten/bultenEmail.js: bulten/bultenEmail.js bulten/bulten.d.js \
    lib/cloudflare/types.d.js lib/cloudflare/moduleWorker.d.js \
	lib/cloudflare/emailWorker.d.js
	yarn google-closure-compiler -W VERBOSE -O ADVANCED --charset UTF-8 \
                             --jscomp_error=checkTypes \
                             --jscomp_error=strictCheckTypes \
                             --jscomp_error=unusedLocalVariables \
                             --jscomp_error=reportUnknownTypes \
                             --emit_use_strict \
                             --language_in ECMASCRIPT_NEXT \
                             --assume_function_wrapper \
                             --js $^ \
                             --js_output_file $@
	yarn uglifyjs $@ -m -c toplevel,unsafe -o $@
	sed -i.bak 's/globalThis.BultenEmail=/export default/g' $@
	wc $@

.PHONY: bulten.cf-deployment
bulten.cf-deployment: build/bulten/bulten.js build/bulten/bultenEmail.js
	wrangler deploy \
        --config bulten/bulten.toml \
        --compatibility-date $(shell date -v -1d +%Y-%m-%d)
	wrangler deploy \
        --config bulten/bultenEmail.toml \
        --compatibility-date $(shell date -v -1d +%Y-%m-%d)
