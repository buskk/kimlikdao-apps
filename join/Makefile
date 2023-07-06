build/join/sayfa-%.js: join/sayfa.js \
    birim/cüzdan/birim.js \
    birim/dil/birim.js \
    lib/crypto/*.js \
    lib/did/*.js \
    lib/ethereum/*.js \
    lib/node/*.js \
    lib/util/dom.js lib/util/çevir.js \
    sdk/api/*.js \
    sdk/client/index.js
	mkdir -p $(dir $@)
	yarn google-closure-compiler -W VERBOSE -O ADVANCED --charset UTF-8 \
                             --define "TR\$$\$$module\$$lib\$$util\$$dom=$(Lang-$*)" \
                             --emit_use_strict \
                             --module_resolution NODE \
                             --assume_function_wrapper \
                             --dependency_mode PRUNE \
                             --entry_point $< \
                             --js $^ \
                             --js_output_file $@
	yarn uglifyjs $@ -m -c toplevel,unsafe -o $@
	wc $@

build/join/sayfa.css: join/sayfa.css
	mkdir -p $(dir $@)
	cat $^ | yarn csso --output $@

build/join/sayfa.keymap: $(call compressions, build/join/sayfa.css)
	mkdir -p $(dir $@) && >$@
	tools/keyhasher.py $@ build/join/sayfa.css

build/join/sayfa-%.keymap: $(call compressions, build/join/sayfa-%.js)
	mkdir -p $(dir $@) && > $@
	tools/keyhasher.py $@ build/join/sayfa-$*.js

build/join-%.html: join/sayfa.html \
    birim/cüzdan.birim \
    birim/dil/birim.html \
    build/ana/sayfa-%.keymap \
    build/birim/cüzdan/birim.keymap \
    build/birim/dil/birim.keymap \
    build/font/fonts-%.keymap \
    build/join/sayfa.keymap \
    build/join/sayfa-%.keymap
	mkdir -p $(dir $@)
	node tools/htmlProcessor $< $*
	tools/keymapper.py $@ $(filter %.keymap,$^)
	yarn html-minifier -c tools/html-minifier.conf $@ -o $@

.PHONY: build/join.sayfa
build/join.sayfa: $(call compressions,build/join-en.html build/join-tr.html)

build/join/prod.js: join/prod.js join/prod.d.js \
    lib/api/jsonrpc.d.js lib/api/jsonrpc.js \
    lib/cloudflare/types.d.js \
    lib/cloudflare/moduleWorker.d.js \
    lib/cloudflare/durableObject.d.js \
    lib/crypto/modular.js lib/crypto/secp256k1.js lib/crypto/sha3.js \
    lib/did/*.d.js lib/did/section.js \
    lib/ethereum/*.d.js lib/ethereum/evm.js \
    lib/node/nvi.d.js \
    lib/util/çevir.js \
    sdk/api/*.js \
    sdk/server-js/TCKT.js sdk/server-js/TCKTSigners.js sdk/server-js/validator.js
	yarn google-closure-compiler -W VERBOSE -O ADVANCED --charset UTF-8 \
                             --jscomp_error=checkTypes \
                             --jscomp_error=strictCheckTypes \
                             --emit_use_strict \
                             --module_resolution NODE \
                             --assume_function_wrapper \
                             --dependency_mode PRUNE \
                             --entry_point $< \
                             --js $^ \
                             --js_output_file $@
	yarn uglifyjs $@ -m -c toplevel,unsafe,drop_console -o $@
	sed -i.bak 's/globalThis.JoinWorker=/export default/g' $@
	wc $@

.PHONY: join.cf-deployment
join.cf-deployment: build/join.sayfa build/join/prod.js
	tools/cfuploader.py join/prod.toml join/uploader.config
	wrangler deploy \
        --config join/prod.toml \
        --compatibility-date $(shell date -v -1d +%Y-%m-%d)
