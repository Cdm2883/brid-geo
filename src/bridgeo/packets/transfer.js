function build(server_address, port) {
    return [
        'transfer',
        { server_address, port }
    ];
}

export { build };
