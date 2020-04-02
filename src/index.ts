// first we import needed stuffs
import {
	PuppetBridge,
	IPuppetBridgeRegOpts,
	Log,
	IRetData,
	Util,
	IProtocolInformation,
} from "mx-puppet-bridge";
import * as commandLineArgs from "command-line-args";
import * as commandLineUsage from "command-line-usage";
import { Echo } from "./echo";

// here we create the log instance using the bridges logging
const log = new Log("EchoPuppet:index");

// we want to handle command line options for registration etc.
const commandOptions = [
	{ name: "register", alias: "r", type: Boolean },
	{ name: "registration-file", alias: "f", type: String },
	{ name: "config", alias: "c", type: String },
	{ name: "help", alias: "h", type: Boolean },
];
const options = Object.assign({
	"register": false,
	"registration-file": "echo-registration.yaml",
	"config": "config.yaml",
	"help": false,
}, commandLineArgs(commandOptions));

// if we asked for help, just display the help and exit
if (options.help) {
	// tslint:disable-next-line:no-console
	console.log(commandLineUsage([
		{
			header: "Matrix My Protocl Puppet Bridge",
			content: "A matrix puppet bridge for my protocol",
		},
		{
			header: "Options",
			optionList: commandOptions,
		},
	]));
	process.exit(0);
}

// here we define some information about our protocol, what features it supports etc.
const protocol: IProtocolInformation = {
	features: {
		file: true, // we support receiving files
		presence: true, // we support presence
	},
	id: "echo", // an internal ID for the protocol, all lowercase
	displayname: "Echo", // a human-readable name of the protocol
	externalUrl: "https://github.com/Sorunome/mx-puppet-echo", // A URL about your protocol
};

// next we create the puppet class.
const puppet = new PuppetBridge(options["registration-file"], options.config, protocol);

// check if the options were to register
if (options.register) {
	// okay, all we have to do is generate a registration file
	puppet.readConfig(false);
	try {
		puppet.generateRegistration({
			prefix: "_echopuppet_",
			id: "echo-puppet",
			url: `http://${puppet.Config.bridge.bindAddress}:${puppet.Config.bridge.port}`,
		});
	} catch (err) {
		// tslint:disable-next-line:no-console
		console.log("Couldn't generate registration file:", err);
	}
	process.exit(0);
}

// this is where we initialize and start the puppet
async function run() {
	await puppet.init(); // always needed, initialize the puppet

	// create our own protocol class
	const echo = new Echo(puppet);

	// required: listen to when a new puppet is created
	puppet.on("puppetNew", echo.newPuppet.bind(echo));
	// required: listen to when a puppet is deleted
	puppet.on("puppetDelete", echo.deletePuppet.bind(echo));
	// required: listen to when a message is received from matrix
	puppet.on("message", echo.handleMatrixMessage.bind(echo));
	// optional (since we enabled it in features): listen to files received from matrix
	puppet.on("file", echo.handleMatrixFile.bind(echo));
	// optional: create room hook (needed for initiating DMs on matrix)
	puppet.setCreateRoomHook(echo.createRoom.bind(echo));
	// optional: get DM room ID hook (needed for initiating DMs on matrix)
	puppet.setGetDmRoomIdHook(echo.getDmRoomId.bind(echo));
	// required: get description hook
	puppet.setGetDescHook(async (puppetId: number, data: any): Promise<string> => {
		// here we receive the puppet ID and the data associated with that puppet
		// we are expected to return a displayable name for that particular puppet
		return `Echo puppet ${data.name}`;
	});
	// required: get data from string hook
	puppet.setGetDataFromStrHook(async (str: string): Promise<IRetData> => {
		// this is called when someone tires to link a new puppet
		// for us the str is our own name and if it is "invalid" it fails
		const retData: IRetData = {
			success: false,
		};
		if (!str || str === "invalid") {
			retData.error = "Invalid name!";
			return retData;
		}
		retData.success = true;
		// this is the data that will be associated with that new puppet
		// usually this contains e.g. a login token to the remote protocol
		retData.data = {
			name: str,
		};
		return retData;
	});
	// required: default display name of the bridge bot. TODO: change/remove
	puppet.setBotHeaderMsgHook((): string => {
		return "Echo Puppet Bridge";
	});

	// and finally, we start the puppet
	await puppet.start();
}

// tslint:disable-next-line:no-floating-promises
run();
