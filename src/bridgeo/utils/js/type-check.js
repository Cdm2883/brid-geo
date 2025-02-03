const ERRORS = {
    get ConstructorInvokedWithoutNew() { return new TypeError('Function constructor cannot be invoked without "new"'); },
    IsNotDefined: name => new ReferenceError(name + ' is not defined'),
};

const CHECK = {
    ConstructorInvokedWithoutNew(new_target) { if (!new_target) throw ERRORS.ConstructorInvokedWithoutNew; },
    IsNotDefined(variables) {
        for (const key of Reflect.ownKeys(variables))
            if (Reflect.get(variables, key, variables) === void 0) throw ERRORS.IsNotDefined(key);
    },
};

export { ERRORS, CHECK };
