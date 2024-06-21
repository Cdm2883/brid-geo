const globalId = {
    i: 114514 - 2883,
    get new() { return ++this.i; }
};
export default globalId;
