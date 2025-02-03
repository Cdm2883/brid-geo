const build = {};

build.chat = (name, message) => [
    'text',
    {
        type: 'chat',
        needs_translation: false,
        source_name: name,
        xuid: '',
        platform_chat_id: '',
        message
    }
];

export { build };
