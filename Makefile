MAKEFLAGS := -j 8

include tools/Makefile
include birim/cüzdan/Makefile
include birim/dil/Makefile
include bulten/Makefile
include join/Makefile

clean:
	rm -rf build

.PHONY: clean
