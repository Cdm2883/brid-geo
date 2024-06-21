import notification from "@/bridgeo/relay/packets/notification";

const input = {

    chat: notification.chat,

    command: (command: string) => [
        'command_request',
        {
            command,
            origin: {
                type: 'player',
                uuid: '',
                request_id: '',
            },
            internal: false,
            version: 52,
        }
    ] as const,

    // TODO 交互, 如点击等等
};
export default input;
