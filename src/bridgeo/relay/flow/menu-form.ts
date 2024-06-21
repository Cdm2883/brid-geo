// noinspection JSUnusedGlobalSymbols

import EventEmitter from "node:events";

import { Player } from "bedrock-protocol";
import deasync from "deasync";
import _ from "lodash";

import form, {
    ButtonFormRequest,
    ButtonFormRequestComponent,
    ButtonFormRequestImage,
    CustomFormRequest,
    CustomFormRequestComponent,
    CustomFormRequestComponentType,
    DialogFormRequest
} from "@/bridgeo/relay/packets/form";
import { RelayContext } from "@/bridgeo/relay/starter";
import { ArrayIndexes } from "@/bridgeo/utils/js/type-utils";
import globalId from "@/bridgeo/utils/mc/global-id";

type RequireQueue = (name: string, params: object) => void;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RequireOnce = (listener: (packet: any) => void) => void;
abstract class MenuForm<R> {
    readonly #queue: RequireQueue;
    readonly #once: RequireOnce;
    constructor(queue: RequireQueue, once: RequireOnce);
    constructor(context: RelayContext);
    constructor(player: Player);
    constructor(arg0: RequireQueue | RelayContext | Player, arg1: RequireOnce | undefined = undefined) {
        if ((arg0 as RelayContext).relay) {
            const context = arg0 as RelayContext;
            this.#queue = context.client.queue.bind(context.client);
            this.#once = listener => context.packets.once('client.modal_form_response', listener);
        } else if ((arg0 as Player).version) {
            const player = arg0 as Player;
            this.#queue = player.queue.bind(player);
            this.#once = listener => player.once('modal_form_response', listener);
        } else {
            this.#queue = arg0 as RequireQueue;
            this.#once = arg1!;
        }
    }

    id = globalId.new;
    title!: string;
    setTitle(title: string): this {
        this.title = title;
        return this;
    }

    abstract build(): ReturnType<typeof form.request>
    async response() {
        const built = this.build();
        this.#queue(...built);
        return new Promise<string | undefined>(resolve => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const onResponse = (packet: any = null): any => {
                if (packet?.form_id !== built[1].form_id)
                    return this.#once(onResponse);
                if (!packet.has_response_data) return resolve(undefined);
                resolve(packet.data);
            };
            onResponse();
        });
    }
    abstract result(): Promise<R | undefined>
    send(onClose: () => void = _.noop) {
        this.result().then(result => {
            if (result === undefined) onClose();
        });
    }

    scope(runner: (menu: this) => void): this {
        runner(this);
        return this;
    }
}

export class MenuDialogForm extends MenuForm<boolean> {
    content = '';
    setContent(content: string): this {
        this.content = content;
        return this;
    }
    confirm = { text: '', callback: _.noop };
    setConfirm(text: string, callback: () => void = _.noop): this {
        this.confirm.text = text;
        this.confirm.callback = callback;
        return this;
    }
    cancel = { text: '', callback: _.noop };
    setCancel(text: string, callback: () => void = _.noop): this {
        this.cancel.text = text;
        this.cancel.callback = callback;
        return this;
    }

    build() {
        return form.request(this.id, {
            type: 'modal',
            title: this.title,
            content: this.content,
            button1: this.confirm.text,
            button2: this.cancel.text
        } as DialogFormRequest);
    }
    async result() {
        const response = await this.response();
        if (response === undefined) return response;

        const select = JSON.parse(response) as boolean;
        if (select) this.confirm.callback();
        else this.cancel.callback();

        return select;
    }
}

export class MenuButtonForm extends MenuForm<number> {
    content = '';
    setContent(content: string): this {
        this.content = content;
        return this;
    }

    buttons: ButtonFormRequestComponent[] = [];
    addButton(item: ButtonFormRequestComponent): this;
    addButton(item: ButtonFormRequestComponent, callback: () => void): this;
    addButton(text: string): this;
    addButton(text: string, image: ButtonFormRequestImage): this;
    addButton(text: string, image: ButtonFormRequestImage, callback: () => void): this;
    addButton(text: string, callback: () => void): this;
    addButton(
        arg0: ButtonFormRequestComponent | string,
        arg1: ButtonFormRequestImage | (() => void) | undefined = undefined,
        arg2: (() => void) | undefined = undefined,
    ): this {
        let image: ButtonFormRequestImage | undefined = undefined;
        if (arg1 && (arg1 as ButtonFormRequestImage).type) {
            image = arg1 as ButtonFormRequestImage;
        }
        if ((arg0 as ButtonFormRequestComponent).text) {
            this.buttons.push(arg0 as ButtonFormRequestComponent);
        } else {
            this.buttons.push(form.button(arg0 as string, image));
        }
        if(typeof arg1 === 'function') {
            this.onClick(arg1);
        }
        if (arg2) {
            this.onClick(arg2);
        }
        return this;
    }

    #callbacks = new Map<number, (() => void)[]>();
    onClick(listener: () => void): this {
        const index = this.buttons.length - 1;
        const callbacks = this.#callbacks.get(index) ?? [];
        callbacks.push(listener);
        this.#callbacks.set(index, callbacks);
        return this;
    }

    build() {
        return form.request(this.id, {
            type: 'form',
            title: this.title,
            content: this.content,
            buttons: this.buttons
        } as ButtonFormRequest);
    }
    async result() {
        const response = await this.response();
        if (response === undefined) return response;
        const index = Number(response);
        this.#callbacks.get(index)?.forEach(listener => listener());
        return index;
    }
}

const $form = form;
type CustomFormResponse = (null | string | boolean | number)[];
export class MenuCustomForm extends MenuForm<CustomFormResponse> {
    contents: CustomFormRequestComponent<CustomFormRequestComponentType>[] = [];
    addComponent(component: CustomFormRequestComponent<CustomFormRequestComponentType>): this {
        this.contents.push(component);
        return this;
    }

    addLabel(...args: Parameters<typeof form.label>) {
        return this.addComponent(form.label(...args));
    }
    addInput(...args: Parameters<typeof form.input>) {
        return this.addComponent(form.input(...args));
    }
    addToggle(...args: Parameters<typeof form.toggle>) {
        return this.addComponent(form.toggle(...args));
    }
    addDropdown(...args: Parameters<typeof form.dropdown>) {
        return this.addComponent(form.dropdown(...args));
    }
    addSlider(...args: Parameters<typeof form.slider>) {
        return this.addComponent(form.slider(...args));
    }
    addStepSlider(...args: Parameters<typeof form.step_slider>) {
        return this.addComponent(form.step_slider(...args));
    }

    callbacks: ((results: CustomFormResponse | undefined) => void)[] = [];
    addCallback(listener: typeof this.callbacks[number]): this {
        this.callbacks.push(listener);
        return this;
    }

    /**
     * 不稳定!!!
     * ```ts
     * new MenuCustomForm(this)
     *     .setTitle('你好')
     *     .describe(async form => {
     *         await form.label('请登录');
     *         const user = await form.input('用户名');
     *         const password = await form.input('密码');
     *         await form.response();
     *         console.log(user, password);
     *     })
     *     .send();
     * ```
     */
    describe(block: (form: {
        label(...args: Parameters<typeof $form.label>): Promise<null>;
        input(...args: Parameters<typeof $form.input>): Promise<string>;
        toggle(...args: Parameters<typeof $form.toggle>): Promise<boolean>;
        dropdown<T extends string[]>(text: string, options: T, defaulted?: ArrayIndexes<T> | undefined): Promise<ArrayIndexes<T>>;
        slider(...args: Parameters<typeof $form.slider>): Promise<number>;
        stepSlider<T extends string[]>(text: string, steps: T, defaulted?: ArrayIndexes<T> | undefined): Promise<ArrayIndexes<T>>;

        response(): Promise<CustomFormResponse | undefined>;
    }) => Promise<void>): this {
        const offset = this.contents.length;

        /* eslint-disable @typescript-eslint/ban-ts-comment */
        // noinspection TypeScriptValidateTypes
        block({
            // @ts-expect-error
            label: this.addLabel.bind(this),
            // @ts-expect-error
            input: this.addInput.bind(this),
            // @ts-expect-error
            toggle: this.addToggle.bind(this),
            // @ts-expect-error
            dropdown: this.addDropdown.bind(this),
            // @ts-expect-error
            slider: this.addSlider.bind(this),
            // @ts-expect-error
            stepSlider: this.addStepSlider.bind(this),
            response: () => Promise.reject()
        }).then().catch(_.noop);
        /* eslint-enable @typescript-eslint/ban-ts-comment */
        deasync.sleep(0);

        const emitter = new EventEmitter();
        let index = offset;
        let final: CustomFormResponse | undefined | null = null;
        const component = () => new Promise(resolve => {
            if (final === undefined) return resolve(undefined);
            if (final !== null) return resolve(final[++index]);
            emitter.on('ok', () => {
                if (final === undefined) return resolve(undefined);
                else resolve(final![index]);
            });
        });
        block({
            /* eslint-disable @typescript-eslint/ban-ts-comment */
            // @ts-expect-error
            label: component,
            // @ts-expect-error
            input: component,
            // @ts-expect-error
            toggle: component,
            // @ts-expect-error
            dropdown: component,
            // @ts-expect-error
            slider: component,
            // @ts-expect-error
            stepSlider: component,
            /* eslint-enable @typescript-eslint/ban-ts-comment */
            response: () => new Promise<CustomFormResponse | undefined>(resolve => {
                if (final === undefined) return resolve(undefined);
                if (final !== null) return resolve(final);
                emitter.on('ok', () => {
                    if (final === undefined) return resolve(undefined);
                    else resolve(final!);
                });
            }),
        }).then();

        this.addCallback(results => {
            final = results;
            emitter.emit('ok');
        });

        return this;
    }

    observe(block: (form: {
        label(...args: Parameters<typeof $form.label>): Readonly<{ value: null }>;
        input(...args: Parameters<typeof $form.input>): Readonly<{ value: string }>;
        toggle(...args: Parameters<typeof $form.toggle>): Readonly<{ value: boolean }>;
        dropdown<T extends string[]>(text: string, options: T, defaulted?: ArrayIndexes<T> | undefined): Readonly<{ value: ArrayIndexes<T> }>;
        slider(...args: Parameters<typeof $form.slider>): Readonly<{ value: number }>;
        stepSlider<T extends string[]>(text: string, steps: T, defaulted?: ArrayIndexes<T> | undefined): Readonly<{ value: ArrayIndexes<T> }>;

        response: { submit: () => void; cancel: () => void };
    }) => void): this {
        let final: CustomFormResponse | undefined | null = null;
        const response = { submit: _.noop, cancel: _.noop };

        /* eslint-disable @typescript-eslint/ban-ts-comment */
        // @ts-expect-error
        const wrap = func => (...args) => {
            func.call(this, ...args);
            const offset = this.contents.length - 1;
            return {
                get value() {
                    return final![offset];
                }
            };
        };
        block({
            // @ts-expect-error
            label: wrap(this.addLabel),
            // @ts-expect-error
            input: wrap(this.addInput),
            // @ts-expect-error
            toggle: wrap(this.addToggle),
            // @ts-expect-error
            dropdown: wrap(this.addDropdown),
            // @ts-expect-error
            slider: wrap(this.addSlider),
            // @ts-expect-error
            stepSlider: wrap(this.addStepSlider),
            response
        });
        /* eslint-enable @typescript-eslint/ban-ts-comment */

        this.addCallback(results => {
            final = results;
            results === undefined ? response.cancel() : response.submit();
        });

        return this;
    }

    build() {
        return form.request(this.id, {
            type: 'custom_form',
            title: this.title,
            content: this.contents
        } as CustomFormRequest);
    }
    async result() {
        const response = await this.response();
        if (response === undefined) return response;
        const json = JSON.parse(response) as CustomFormResponse;
        this.callbacks.forEach(callback => callback(json));
        return json;
    }
}
