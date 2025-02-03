function build(title, message) {
    return [
        'toast_request',
        { title, message }
    ];
}

export { build };
