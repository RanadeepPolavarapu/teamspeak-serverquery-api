export default class ModuleUtils {
    constructor() {

    }

    static arrayHasIntersects(array1, array2) {
        let intersectedArray = array1.filter(n => array2.indexOf(n) != -1);
        return intersectedArray.length > 0;
    }
}
