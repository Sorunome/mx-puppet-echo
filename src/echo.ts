// first we import a few needed things again
import {
	PuppetBridge,
	IRemoteUser,
	IReceiveParams,
	IRemoteRoom,
	IMessageEvent,
	IFileEvent,
	Log,
} from "mx-puppet-bridge";

// here we create our log instance
const log = new Log("EchoPuppet:echo");

// this interface is to hold all data on a single puppet
interface IEchoPuppet {
	// this is usually a client class that connects to the remote protocol
	// as we just echo back, unneeded in our case
	// client: Client;
	data: any; // and let's keep a copy of the data associated with a puppet
}

// we can hold multiple puppets at once...
interface IEchoPuppets {
	[puppetId: number]: IEchoPuppet;
}

export class Echo {
	private puppets: IEchoPuppets = {};
	constructor(
		private puppet: PuppetBridge,
	) { }

	public getSendParams(puppetId: number, ghostname: string): IReceiveParams {
		// we will use this function internally to create the send parameters
		// needed to send a message, a file, reactions, ... to matrix
		log.info(`Creating send params for ${ghostname}...`);
		return {
			room: {
				// this is usually the room ID of the remote protocol
				// we just have DMs with the ghosts and user their names as ID
				roomId: ghostname,
				puppetId, // need to pass this along
				isDirect: true, // all our rooms are DMs
			},
			user: {
				// this is usually the user ID of the remote protocol
				userId: ghostname,
				puppetId, // need to pass this along
				// this is the name of the user
				name: ghostname.toUpperCase(),
			},
		} as IReceiveParams;
	}

	public async newPuppet(puppetId: number, data: any) {
		// this is called when we need to create a new puppet
		// the puppetId is the ID associated with that puppet and the data its data
		if (this.puppets[puppetId]) {
			// the puppet somehow already exists, delete it first
			await this.deletePuppet(puppetId);
		}
		// usually we create a client class of some sorts to the remote protocol
		// and listen to incoming messages from it
		// const client = new Client(data);
		// client.on("message", this.handleRemoteMessage.bind(this));
		this.puppets[puppetId] = {
			// client,
			data,
		};
		// await client.start();
	}

	public async deletePuppet(puppetId: number) {
		// this is called when we need to delte a puppet
		const p = this.puppets[puppetId];
		if (!p) {
			// puppet doesn't exist, nothing to do
			return;
		}
		// usually we'd need to stop the client to the remote protocol here
		// await p.client.stop();
		delete this.puppets[puppetId]; // and finally delete our local copy
	}

	public async handleMatrixMessage(room: IRemoteRoom, data: IMessageEvent, event: any) {
		// this is called every time we receive a message from matrix and need to
		// forward it to the remote protocol.

		// first we check if the puppet exists
		const p = this.puppets[room.puppetId];
		if (!p) {
			return;
		}
		// usually you'd send it here to the remote protocol via the client object
		// p.client.sendMessage(room.roomId, data.body);
		// we will just echo this back - as we only have DMs and the roomIds are our userIds we can just re-use them as that
		const params = this.getSendParams(room.puppetId, room.roomId);
		await this.puppet.sendMessage(params, {
			body: data.body,
			formattedBody: data.formattedBody,
		});
	}

	public async handleMatrixFile(room: IRemoteRoom, data: IFileEvent, event: any) {
		// this is called every time we receive a file from matrix, as we enabled said feature

		// first we check if the puppet exists
		const p = this.puppets[room.puppetId];
		if (!p) {
			return;
		}
		// usually you'd send it here to the remote protocol via the client object
		// p.client.sendFile(room.roomId, data.url);
		// we just echo this back
		const params = this.getSendParams(room.puppetId, room.roomId);
		await this.puppet.sendFileDetect(params, data.url, data.filename);
	}

	public async createRoom(room: IRemoteRoom): Promise<IRemoteRoom | null> {
		// this is called when the puppet bridge wants to create a new room
		// we need to validate that the corresponding roomId exists and, if not return null

		// first we check if the puppet exists
		const p = this.puppets[room.puppetId];
		if (!p) {
			return null;
		}
		// what we need to return is the same filled out information as in getSendParams
		// as our userIds are the same as our roomIds, let's just do that
		return this.getSendParams(room.puppetId, room.roomId).room;
	}

	public async getDmRoomId(user: IRemoteUser): Promise<string | null> {
		// this is called whenever someone invites a ghost on the matrix side
		// from the user ID we need to return the room ID of the DM room, or null if none is present

		// first we check if the puppet exists
		const p = this.puppets[user.puppetId];
		if (!p) {
			return null;
		}

		// now we just return the userId of the ghost
		return user.userId;
	}
}
