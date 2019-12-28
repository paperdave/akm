# action keyboard manager
This is a tool to use `actkbd` (Action Keyboard) to create dedicated macro keyboards. It handles selecting the right input device for actkbd to use and disabling the input inside of X. **It is only tested & maintained on Ubuntu 19.10**, but probably works on other versions of linux.

## install
```sh
npm i -g akm
akm install
```

you will also need actkbd, install that with
```sh
git clone https://github.com/thkala/actkbd.git
cd actkbd
sudo make install
# cleaning
cd ..
rm -rf ./actkbd
```

## usage
```
akm add
```
You can select a keyboard and then a glob match for where the macro files are.

If you choose more than one file (by using wildcards, etc), akm will merge these files together.

For format of the "akm files", see [actkbd's readme](https://github.com/thkala/actkbd).

You can use `akm debug` to open actkbd in the `-s` mode to get info on different keys.

## FAQ
Yes, you can use the Power Button with akm. :)
