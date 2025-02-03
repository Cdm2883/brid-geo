function build(form_id, data) {
    return [
        'modal_form_request',
        {
            form_id,
            data: typeof data === 'string' ? data : JSON.stringify(data)
        }
    ];
}



const modal = (title, content = '') => ({ type: 'modal', title, content });
const confirm = text => ({ button1: text });
const cancel = text => ({ button2: text });



const form = (title, content = '') => ({ type: 'form', title, content });
const button = (text, image) => {
    let button = { text };
    if (image) button.image = image;
    return button;
};
const textures = path => ({ type: 'path', data: path });
const url = url => ({ type: 'url', data: url });



const custom_form = title => ({ type: 'custom_form', title });
const label = text => ({ type: 'label', text });
const input = (text, placeholder, defaulted) => {
    let element = { type: 'input', text };
    if (placeholder) element.placeholder = placeholder;
    if (defaulted) element.default = defaulted;
    return element;
};
const inputDefaulted = (text, defaulted) => input(text, String(defaulted), String(defaulted));
const toggle = (text, defaulted) => {
    let element = { type: 'toggle', text };
    if (defaulted) element.default = defaulted;
    return element;
};
const dropdown = (text, options, defaulted) => {
    let element = { type: 'dropdown', text };
    if (options) element.options = options;
    if (defaulted) element.default = defaulted;
    return element;
};
const slider = (text, min, max, step, defaulted) => {
    let element = { type: 'slider', text, min, max };
    if (step) element.step = step;
    if (defaulted) element.default = defaulted;
    return element;
};
const step_slider = (text, steps, defaulted) => {
    let element = { type: 'step_slider', text };
    if (steps) element.steps = steps;
    if (defaulted) element.default = defaulted;
    return element;
};



export {
    build,
    modal, confirm, cancel,
    form, button, textures, url,
    custom_form, label, input, inputDefaulted, toggle, dropdown, slider, step_slider
};
