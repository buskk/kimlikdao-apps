MAKEFLAGS := -j 8

include tools/Makefile
include ana/Makefile
include birim/cüzdan/Makefile
include birim/dil/Makefile
include font/Makefile
include join/Makefile

clean:
	rm -rf build

.PHONY: clean
