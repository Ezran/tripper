class Terminal {
    constructor() {
        this.value = false;
    }
    isActive () {
        return this.value ? true : false;
    }
    getOrigin () {
        if (this.value)
            return this.originId;
        else
            return null;
    }
    setOrigin (o) {
        this.originId = o;
    }
    setActive (a) {
        this.value = a;
    }
}
export const terminal = new Terminal();
