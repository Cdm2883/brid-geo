import * as fs from "fs";

// TODO patcher

// TODO ResourcePackDecryptor
class ResourcePackDecryptor {
    constructor() {
    }

    #buffer;
    buffer(buffer) {
        if (!buffer) return this.#buffer;
        return this.#buffer ?
            this.#buffer = Buffer.concat(
                [ this.#buffer, buffer ],
                this.#buffer.length + buffer.length
            )
            : this.#buffer = buffer;
    }

    export(path, zip = true) {
        fs.writeFileSync(path, this.#buffer);
    }

    decrypt(key) {}
}

export { ResourcePackDecryptor };

function p() {
    // server -> resource_packs_info
    let resource_packs_info = {
        must_accept: false,
        has_addons: true,
        has_scripts: false,
        force_server_packs: false,
        behaviour_packs: [],
        texture_packs: [
            {
                uuid: '27695eb5-7cf3-6dba-b815-5bbb64687539',
                version: '1.0.0',
                size: 2290378n,
                content_key: '',
                sub_pack_name: '',
                content_identity: '27695eb5-7cf3-6dba-b815-5bbb64687539',
                has_scripts: false,
                rtx_enabled: false
            }, // ...
        ],
        resource_pack_links: []
    };

    // client -> resource_pack_client_response
    let resource_pack_client_response = {
        response_status: 'send_packs',
        resourcepackids: [
            '27695eb5-7cf3-6dba-b815-5bbb64687539_1.0.0', // ...
        ]
    };

    // server -> resource_pack_data_info
    let resource_pack_data_info = {
        pack_id: '27695eb5-7cf3-6dba-b815-5bbb64687539_1.0.0',
        max_chunk_size: 102400,
        chunk_count: 15,
        size: 1506171n,
        hash: `<Buffer 11 45 14>`,
        is_premium: false,
        pack_type: 'resources'
    };

    // client -> resource_pack_chunk_request x15
    let resource_pack_chunk_request = {
        pack_id: '27695eb5-7cf3-6dba-b815-5bbb64687539_1.0.0',
        chunk_index: 0 // ... (0~14)
    };

    // server -> resource_pack_chunk_data x 15
    let resource_pack_chunk_data = {
        pack_id: '27695eb5-7cf3-6dba-b815-5bbb64687539_1.0.0',
        chunk_index: 0, // ... (0~14)
        progress: 0n,  // ... (0n~1506171n)
        payload: `<Buffer 11 45 14 ... 191981 more bytes>`
    };



}
