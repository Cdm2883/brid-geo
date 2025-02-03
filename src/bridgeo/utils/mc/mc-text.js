import { defaultTag, tagGenerators } from "../js/template-literals.js";

const SS = '§';
const splitJoinSS = string => SS + string.split('').join(SS);

/**
 * @example
 * ss`TEST`  // §T§E§S§T
 *
 * ss._1`TEST`  // §1TEST
 * ss._123ab`TEST`  // §1§2§3§a§bTEST
 *
 * ss.$`$1TEST`  // §1TEST
 * ss.$`$1TES$2T`  // §1TES§2T
 *
 * ss[1]`TEST`  // §1TEST
 * ss.a`TEST`  // §aTEST
 * ss.ab`TEST`  // §abTEST
 */
const ss = new Proxy(
    (strings, ...values) => splitJoinSS(defaultTag(strings, ...values)),
    {
        get(target, format) {
            if (format.at(0) === '_') return (strings, ...values) => splitJoinSS(format.substring(1)) + defaultTag(strings, ...values);
            if (format === '$') return (strings, ...values) => defaultTag(strings, ...values).replaceAll('$', SS);
            return tagGenerators.prefix(SS + format);
        }
    }
);

export { SS, ss };
