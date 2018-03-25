'use strict';

/**
 * @typedef valueChangeEvent
 * @property {any} old
 * @property {any} new
 */

/**
 * Cell is one entitiy of the Grid.
 * 
 * @class
 * @param {number} xPos x position in the grid
 * @param {number} yPos y position in the grid
 */
function Cell(xPos, yPos) {
    Object.makeEventManager(this, ['typechange', 'xchange', 'ychange', 'hchange', 'gchange', 'displaychange', 'comingfromchanged']);

    let type, x, y, hValue, gValue, display, comingFrom;
    const types = ['checked', 'traversable', 'blocked', 'start', 'target'];
    const typeAsString = '[' + types.map((v) => '\'' + v + '\'').join(',') + ']';

    Object.defineProperties(this, {
        /**
         * The type of the cell is one of ['checked', 'traversable', 'blocked', 'start', 'target'], defaults to 'traversable'
         * @fires Cell#typechange
         * @member {'checked'|'traversable'|'blocked'|'start'|'target'} Cell#type
         */
        type: {
            set: (v) => {
                if (types.indexOf(v) == -1)
                    throw 'type needs to be on of ' + typeAsString + ' was: ' + v;

                if (type != v) {
                    let old = type;
                    type = v;

                    /**
                     * {@link Cell#type} changed
                     * 
                     * @event Cell#typechange
                     * @type {valueChangeEvent}
                     */
                    this.dispatchEvent('typechange', {
                        old: old,
                        new: type
                    });
                }
            },
            get: () => type
        },
        /**
         * The type x coordinate of the cell
         * @fires Cell#xchange
         * @member {number} Cell#x
         */
        x: {
            set: (v) => {
                let val = parseInt(v);
                if (val != x) {
                    let old = x;
                    x = val;

                    /**
                     * {@link Cell#x} changed
                     * 
                     * @event Cell#xchange
                     * @type {valueChangeEvent}
                     */
                    this.dispatchEvent('xchange', {
                        old: old,
                        new: x
                    });
                }
            },
            get: () => x
        },
        /**
         * The type y coordinate of the cell
         * @fires Cell#ychange
         * @member {number} Cell#y
         */
        y: {
            set: (v) => {
                let val = parseInt(v);
                if (val != y) {
                    let old = y;
                    y = val;

                    /**
                     * {@link Cell#y} changed
                     * 
                     * @event Cell#ychange
                     * @type {valueChangeEvent}
                     */
                    this.dispatchEvent('ychange', {
                        old: old,
                        new: y
                    });
                }
            },
            get: () => y
        },
        /**
         * The heuristic value for this cell
         * @fires Cell#hchange
         * @member {number?} Cell#hValue
         */
        hValue: {
            set: (v) => {
                let val = parseFloat(v);
                if (val != hValue) {
                    let old = hValue;
                    hValue = val;

                    /**
                     * {@link Cell#hValue} changed
                     * 
                     * @event Cell#hchange
                     * @type {valueChangeEvent}
                     */
                    this.dispatchEvent('hchange', {
                        old: old,
                        new: hValue
                    });
                }
            },
            get: () => hValue
        },
        /**
         * The gross value for this cell (travelling cost to this cell from the start)
         * @fires Cell#gchange
         * @fires Cell#displaychange
         * @member {number?} Cell#gValue
         */
        gValue: {
            set: (v) => {
                let val = parseFloat(v);
                if (val != gValue) {
                    let old = gValue;
                    gValue = val;
                    this.display = isFinite(gValue);

                    /**
                     * {@link Cell#gValue} changed
                     * 
                     * @event Cell#gchange
                     * @type {valueChangeEvent}
                     */
                    this.dispatchEvent('gchange', {
                        old: old,
                        new: gValue
                    });
                }
            },
            get: () => gValue
        },
        /**
         * Cell#hValue + Cell#gValue
         * @member {number?} Cell#fValue
         */
        fValue: {
            get: () => this.gValue + this.hValue
        },
        /**
         * if this cell / the values should be displayed, is only used as a flag
         * @fires Cell#displaychange
         * @member {boolean} Cell#display
         */
        display: {
            set: (v) => {
                if ((v == true || v == false) && v != display) {
                    let old = display;
                    display = v;
                    /**
                     * {@link Cell#display} changed
                     * 
                     * @event Cell#displaychange
                     * @type {valueChangeEvent}
                     */
                    this.dispatchEvent('displaychange', {
                        old: old,
                        new: display
                    });
                }
            },
            get: () => display
        },
        /**
         * Contains the cell which was used to reach this cell with the a star algorythem
         * @fires Cell#comingfromchanged
         * @member {Cell?} Cell#comingFrom
         */
        comingFrom: {
            set: (v) => {
                if (v === undefined || !(v instanceof Cell))
                    throw 'can only come from Cell'

                // TODO maybe erase g value if coming from is removed
                let old = comingFrom;
                comingFrom = v;

                /**
                 * {@link Cell#comingFrom} changed
                 * 
                 * @event Cell#comingfromchanged
                 * @type {valueChangeEvent}
                 */
                this.dispatchEvent('gchange', {
                    old: old,
                    new: v
                });
            },
            get: () => comingFrom
        }
    })


    this.type = 'traversable';
    this.display = false;
    this.x = xPos;
    this.y = yPos;
}

/**
 * Gets the path, the cells which were used to reach this cell, of this checked cell.
 * @returns {Cell[]?} the cells which were used starting with this cell, returns undefined if this cell is not of type 'checked'
 */
Cell.prototype.getPathOfCell = function getPathOfCell() {
    if (this.type != 'checked')
        return undefined;

    let ret = [];
    ret[0] = this;

    let c = this;
    while (c.comingFrom != undefined) {
        if (c.comingFrom.type != 'checked')
            throw 'the comingFrom cell ' + c.comingFrom + ' of ' + c + ' was not of type \'checked\'';

        ret[ret.length] = c = c.comingFrom;
    }
}

/**
 * This methode is useful if you want to bind the events emited by the Cell to a HTMLElement which can be used to display it.
 * @param {HTMLElement} element 
 */
Cell.prototype.registerDisplayElementForCell = function registerDisplayElementForCell(element) {
    element.className = 'cell ' + this.type;
    this.addEventListener('typechange', ev => {
        element.className = 'cell ' + this.type;
    });

    element.setAttribute('data-display', '' + this.display);
    this.addEventListener('displaychange', ev => {
        element.setAttribute('data-display', '' + this.display);
    });

    const textContentChange = (event) => {
        element.textContent = `h: ${Math.round10(this.hValue,-1)}\ng: ${isFinite(this.gValue)? +Math.round10(this.gValue,-1) : '-'}\nf: ${isFinite(this.fValue)? Math.round10(this.fValue,-1) : '-'}`;
    }
    textContentChange();

    // this.addEventListener('xchange', textContentChange);
    // this.addEventListener('ychange', textContentChange);

    this.addEventListener('hchange', textContentChange);
    this.addEventListener('gchange', textContentChange);

}


// generates toString for Cell
{
    let names = Object.getOwnPropertyNames(new Cell(0, 0)).filter((v) => ['addEventListener', 'dispatchEvent', 'removeEventListener', 'events'].indexOf(v) == -1);
    let complStr = ''

    for (let i = 0; i < names.length; i++) {
        complStr += names[i] + ": '+this." + names[i] + (i != names.length - 1 ? "+', " : "+'");
    }

    complStr = "Cell.prototype.toString = function toString() { return 'Cell{" + complStr + "}'; }";
    eval(complStr);
}