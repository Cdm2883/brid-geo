export type FormRequestType = 'modal' | 'form' | 'custom_form';
export interface FormRequest<T extends FormRequestType> {
    type: T;
    title: string;
}

export interface DialogFormRequest extends FormRequest<'modal'> {
    content: string;
    button1: string;
    button2: string;
}

export interface ButtonFormRequestImage {
    type: 'path' | 'url';
    data: string;
}
export interface ButtonFormRequestComponent {
    text: string;
    image?: ButtonFormRequestImage;
}
export interface ButtonFormRequest extends FormRequest<'form'> {
    content: string;
    buttons: ButtonFormRequestComponent[];
}

export type CustomFormRequestComponentType = 'label' | 'input' | 'toggle' | 'dropdown' | 'slider' | 'step_slider';
export interface CustomFormRequestComponent<T extends CustomFormRequestComponentType> {
    type: T;
    text: string;
}
export type CustomFormRequestLabel = CustomFormRequestComponent<'label'>;
export interface CustomFormRequestInput extends CustomFormRequestComponent<'input'> {
    placeholder?: string;
    default?: string;
}
export interface CustomFormRequestToggle extends CustomFormRequestComponent<'toggle'> {
    default?: boolean;
}
export interface CustomFormRequestDropdown extends CustomFormRequestComponent<'dropdown'> {
    options?: string[];
    default?: number;
}
export interface CustomFormRequestSlider extends CustomFormRequestComponent<'slider'> {
    min: number;
    max: number;
    step?: number;
    default?: number;
}
export interface CustomFormRequestStepSlider extends CustomFormRequestComponent<'step_slider'> {
    steps?: string[];
    default?: number;
}
export interface CustomFormRequest extends FormRequest<'custom_form'> {
    content: CustomFormRequestComponent<CustomFormRequestComponentType>[];
}

const form = {
    request: <T extends FormRequestType>(form_id: number, data: FormRequest<T> | string) => [
        'modal_form_request',
        {
            form_id,
            data: typeof data === 'string' ? data : JSON.stringify(data)
        }
    ] as const,

    modal: (title: string, content = '') => ({ type: 'modal', title, content }) as const,
    confirm: (text: string) => ({ button1: text }) as const,
    cancel: (text: string) => ({ button2: text }) as const,

    form: (title: string, content = '') => ({ type: 'form', title, content }) as const,
    button: (text: string, image: ButtonFormRequestImage | undefined = undefined) => {
        const button: ButtonFormRequestComponent = { text };
        if (image) button.image = image;
        return button;
    },
    textures: (path: string) => ({ type: 'path', data: path }) as ButtonFormRequestImage,
    url: (url: string) => ({ type: 'url', data: url }) as ButtonFormRequestImage,

    custom_form: (title: string) => ({ type: 'custom_form', title }) as const,
    label: (text: string) => ({ type: 'label', text }) as CustomFormRequestLabel,
    input: (text: string, placeholder: string | number | undefined = undefined, defaulted: string | number | undefined = undefined) => {
        const element: CustomFormRequestInput = { type: 'input', text };
        if (placeholder) element.placeholder = String(placeholder);
        if (defaulted) element.default = String(defaulted);
        return element;
    },
    toggle: (text: string, defaulted: boolean | undefined = undefined) => {
        const element: CustomFormRequestToggle = { type: 'toggle', text };
        if (defaulted) element.default = defaulted;
        return element;
    },
    dropdown: (text: string, options: string[], defaulted: number | undefined = undefined) => {
        const element: CustomFormRequestDropdown = { type: 'dropdown', text };
        if (options) element.options = options;
        if (defaulted) element.default = defaulted;
        return element;
    },
    slider: (text: string, min: number, max: number, step: number | undefined = undefined, defaulted: number | undefined = undefined) => {
        const element: CustomFormRequestSlider = { type: 'slider', text, min, max };
        if (step) element.step = step;
        if (defaulted) element.default = defaulted;
        return element;
    },
    step_slider: (text: string, steps: string[], defaulted: number | undefined = undefined) => {
        const element: CustomFormRequestStepSlider = { type: 'step_slider', text };
        if (steps) element.steps = steps;
        if (defaulted) element.default = defaulted;
        return element;
    }

};
export default form;
