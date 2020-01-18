[![Support room on Matrix](https://img.shields.io/matrix/mx-puppet-bridge:sorunome.de.svg?label=%23mx-puppet-bridge%3Asorunome.de&logo=matrix&server_fqdn=sorunome.de)](https://matrix.to/#/#mx-puppet-bridge:sorunome.de) [![donate](https://liberapay.com/assets/widgets/donate.svg)](https://liberapay.com/Sorunome/donate)

# mx-puppet-echo
This is a simple example implementation of [mx-puppet-bridge](https://github.com/Sorunome/mx-puppet-bridge).
It is meant to give those who want to write their own protocol implementation a starting point.

## Installation
```bash
git pull https://github.com/Sorunome/mx-puppet-echo
npm install
npm run build
```
Next copy the `sample.config.yaml` to `config.yaml`, edit it and then run `npm run start -- -r` to generate a registration file.
Register that one with synapse and start the bridge with `npm run start`.

## Usage
First you create a room with the bridge bot (`@_echopuppet_bot:YOURSERVER.COM`). Next you type `link <name>`, e.g. `link test`.
It will say that a puppet with a certain ID was created.

Now you can invite ghosts into a 1:1 room: Their ID are `@_echopuppet_$puppetId_$ghostname:YOURSERVER.COM`, e.g. `@_echopuppet_1_ghost:YOURSERVER.COM`.  
If set up correctly the ghost should auto-join and echo back everything you write to it.
