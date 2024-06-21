const notification = {

    toast: (title: string, message: string) => [
        'toast_request',
        { title, message }
    ] as const,

    chat: (name: string, message: string) => [
        'text',
        {
            type: 'chat',
            needs_translation: false,
            source_name: name,
            xuid: '',
            platform_chat_id: '',
            message
        }
    ] as const,
    popup: (message: string) => [
        'text',
        {
            type: 'jukebox_popup',
            needs_translation: false,
            parameters: [],
            xuid: '',
            platform_chat_id: '',
            message
        }
    ] as const,
    jukebox: (message: string) => [
        'text',
        {
            type: 'jukebox_popup',
            needs_translation: false,
            parameters: [],
            xuid: '',
            platform_chat_id: '',
            message
        }
    ] as const,
    tip: (message: string) => [
        'text',
        {
            type: 'tip',
            needs_translation: false,
            parameters: [],
            xuid: '',
            platform_chat_id: '',
            message
        }
    ] as const,
    broadcast: (message: string) => [
        'text',
        {
            type: 'system',
            needs_translation: false,
            xuid: '',
            platform_chat_id: '',
            message
        }
    ] as const,

};
export default notification;
