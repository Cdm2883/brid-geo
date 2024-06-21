import EventBus from "@/bridgeo/utils/js/event-bus";

export class Lifecycle extends EventBus {
    static INSTANCE = new Lifecycle();
    private constructor() {
        super();
    }
}
export const lifecycle = Lifecycle.INSTANCE;
