'use strict';

/**
 * @typedef cellEvent
 * @property {Cell} cell
 * @property {number} x
 * @property {number} y
 */

/**
 * Creates a grid with the given width and height. A Grid contains and manages a collection of Cells 
 * and provides methods for the A* Pathfinding Algorithm.
 * @class
 */
function Grid() {
    Object.makeEventManager(this, ['addcell',
        'removecell',
        'targetchange',
        'startchange',
        'widthchange',
        'heightchange',
        'canwalkdiagonalchange',
        'steppingcostchange',
        'resetpathfinding'
    ]);

    let target, start,
        canWalkDiagonal = true,
        steppingCost = 1,
        width = 0,
        height = 0,
        grid = [
            []
        ];

    const createCells = (area) => {
        area.iterator().forEach((point) => {
            let x = point.x,
                y = point.y;

            if (grid[x] == undefined)
                grid[x] = [];

            if (grid[x][y] === undefined)
                grid[x][y] = new Cell(x, y);

            let cell = grid[x][y];
            cell.hValue = this.calcHCell(cell);

            /**
             * added {@link Cell}
             * 
             * @event Grid#addcell
             * @type {cellEvent}
             */
            this.dispatchEvent('addcell', {
                cell: cell,
                x: x,
                y: y
            });
        });
    }

    const removeCells = (area) => {
        let containsTarget = target != undefined && area.contains(target.x, target.y);
        let containsStart = start != undefined && area.contains(start.x, start.y);

        if (containsStart)
            start = undefined;

        if (containsTarget)
            target = undefined;

        if (containsStart || containsTarget)
            this.resetPathfinding();

        area.iterator().forEach((point) => {
            let x = point.x,
                y = point.y;

            /**
             * removed {@link Cell}
             * 
             * @event Grid#removecell
             * @type {cellEvent}
             */
            this.dispatchEvent('removecell', {
                cell: grid[x][y],
                x: x,
                y: y
            });
        });
    }

    Object.defineProperties(this, {
        /**
         * The current target for the pathfinding algorithem.
         * @fires Grid#targetchange
         * @member {Cell?} Grid#target
         */
        target: {
            set: (newTarget) => {
                if (newTarget instanceof Cell || newTarget === undefined) {
                    if (target != newTarget) {
                        let old = target;

                        if (target instanceof Cell)
                            target.type = 'traversable'

                        if (newTarget instanceof Cell)
                            newTarget.type = 'target'

                        target = newTarget;

                        // also resetting the hValue
                        this.resetPathfinding(true);

                        /**
                         * {@link Grid#target} changed
                         * 
                         * @event Grid#targetchange
                         * @type {valueChangeEvent}
                         */
                        this.dispatchEvent('targetchange', {
                            old: old,
                            new: target
                        });
                    }
                } else {
                    throw 'the target needs to be an instance of Cell or undefined';
                }
            },
            get: () => target
        },
        /**
         * The current start for the pathfinding algorithem.
         * @fires Grid#startchange
         * @fires Grid#resetpathfinding
         * @member {Cell?} Grid#start
         */
        start: {
            set: (newStart) => {
                if (newStart instanceof Cell || newStart === undefined) {
                    if (start != newStart) {
                        let old = start;

                        if (start instanceof Cell)
                            start.type = 'traversable'

                        if (newStart instanceof Cell)
                            newStart.type = 'start'

                        start = newStart;

                        this.resetPathfinding();

                        /**
                         * {@link Grid#start} changed
                         * 
                         * @event Grid#startchange
                         * @type {valueChangeEvent}
                         */
                        this.dispatchEvent('startchange', {
                            old: old,
                            new: start
                        });
                    }
                } else {
                    throw 'the start needs to be an instance of Cell or undefined';
                }
            },
            get: () => start
        },
        /**
         * Width of the this grid
         * @fires Grid#widthchange
         * @fires Grid#addcell
         * @fires Grid#removecell
         * @member {number} Grid#width
         */
        width: {
            set: (value) => {
                let oldWidth = width;

                let newWidth = parseInt(value);

                if (newWidth !== value)
                    throw 'width needs to be assigned with an integer'

                if (!isFinite(newWidth) || newWidth < 0)
                    throw 'width needs to be an finite positive number but was ' + newWidth;

                // checking if the height is greater than zero, if not there is no need to do anything
                width = newWidth;
                if (oldWidth != newWidth && height > 0) {
                    if (oldWidth < newWidth) {
                        // width increased
                        let area = new Area(
                            oldWidth - 1 < 0 ? 0 : oldWidth - 1,
                            newWidth - 1 < 0 ? 0 : newWidth - 1,
                            0,
                            height - 1);

                        createCells(area);
                    } else {
                        // width decreased
                        let area = new Area(
                            newWidth - 1 < 0 ? 0 : newWidth - 1,
                            oldWidth - 1 < 0 ? 0 : oldWidth - 1,
                            0,
                            height - 1);

                        removeCells(area);
                    }
                }
                if (oldWidth != newWidth) {
                    /**
                     * {@link Grid#width} changed
                     * 
                     * @event Grid#widthchange
                     * @type {valueChangeEvent}
                     */
                    this.dispatchEvent('widthchange', {
                        old: oldWidth,
                        new: newWidth
                    });
                }
            },
            get: () => width
        },
        /**
         * Hight of the this grid
         * @fires Grid#heightchange
         * @fires Grid#addcell
         * @fires Grid#removecell
         * @member {number} Grid#height
         */
        height: {
            set: (value) => {
                let oldHeight = height;

                let newHeight = parseInt(value);

                if (newHeight !== value)
                    throw 'height needs to be assigned with an integer'

                if (!isFinite(newHeight) || newHeight < 0)
                    throw 'height needs to be an finite positive number but was ' + newHeight;

                // checking if the width is greater than zero, if not there is no need to do anything
                height = newHeight;
                if (oldHeight != newHeight && width > 0) {
                    if (oldHeight < newHeight) {
                        // height increased
                        let area = new Area(
                            0,
                            width - 1,
                            oldHeight - 1 < 0 ? 0 : oldHeight - 1,
                            newHeight - 1 < 0 ? 0 : newHeight - 1);

                        createCells(area);
                    } else {
                        // height decreased
                        let area = new Area(
                            0,
                            width - 1,
                            newHeight - 1 < 0 ? 0 : newHeight - 1,
                            oldHeight - 1 < 0 ? 0 : oldHeight - 1);

                        removeCells(area);
                    }
                }
                if (oldHeight != newHeight) {
                    /**
                     * {@link Grid#height} changed
                     * 
                     * @event Grid#heightchange
                     * @type {valueChangeEvent}
                     */
                    this.dispatchEvent('heightchange', {
                        old: oldHeight,
                        new: newHeight
                    });
                }
            },
            get: () => height
        },
        /**
         * if the pathfinding algorithem is allowed to move diagonal
         * @fires Grid#canwalkdiagonalchange
         * @fires Grid#resetpathfinding
         * @member {boolean} Grid#canWalkDiagonal
         */
        canWalkDiagonal: {
            set: function (v) {
                if (v == true || v == false) {
                    canWalkDiagonal = v;
                    this.resetPathfinding(true);
                    /**
                     * {@link Grid#canWalkDiagonal} changed
                     * 
                     * @event Grid#canwalkdiagonalchange
                     * @type {valueChangeEvent}
                     */
                    this.dispatchEvent('canwalkdiagonalchange', {
                        old: !v,
                        new: v
                    });
                } else {
                    throw 'canWalkDiagonal needs to be assigned with either true or false';
                }
            },
            get: () => canWalkDiagonal
        },
        /**
         * the cost to step straight (diagonally will be multiplied with `Math.SQRT2`)
         * @fires Grid#steppingcostchange
         * @fires Grid#resetpathfinding
         * @member {number} Grid#steppingCost
         */
        steppingCost: {
            set: function (v) {
                v = parseFloat(v);

                if (isFinite(v) && v > 0) {
                    let old = steppingCost;
                    steppingCost = v;
                    this.resetPathfinding(true);
                    /**
                     * {@link Grid#steppingCost} changed
                     * 
                     * @event Grid#steppingcostchange
                     * @type {valueChangeEvent}
                     */
                    this.dispatchEvent('steppingcostchange', {
                        old: old,
                        new: v
                    });
                } else {
                    throw 'steppingCost needs to be assigned with a number greater then zero';
                }
            },
            get: () => steppingCost
        },
        getCell: {
            value: function getCell(x, y) {
                return (x < 0 || y < 0 || y > this.height - 1 || x > this.width - 1) ? undefined : grid[x][y];
            }
        }
    })

    /**
     * The cells which are remaining to be considered.
     * @member {Cell[]} Grid#openList
     */
    this.openList = [];

    /**
     * A flag if the pathfinding has found the target (and the path to it).
     * @member {boolean} Grid#found
     */
    this.found = false;
}

/**
 * This function can be used to calculate the {@link Cell#hValue} of a cell
 * @param {Cell} cell 
 * @returns {number} hvalue for this cell
 */
Grid.prototype.calcHCell = function calcHCell(cell) {
    const target = this.target;
    if (target instanceof Cell) {
        let deltaX = cell.x < target.x ? target.x - cell.x : cell.x - target.x,
            deltaY = cell.y < target.y ? target.y - cell.y : cell.y - target.y;

        if (this.canWalkDiagonal) {
            if (deltaX < deltaY) {
                return this.steppingCost * (deltaX * Math.SQRT2 + (deltaY - deltaX));
            } else {
                return this.steppingCost * (deltaY * Math.SQRT2 + (deltaX - deltaY));
            }
        } else {
            return (deltaX + deltaY) * this.steppingCost;
        }
    }
}

/**
 * Resets all information belonging to the Pathfinding
 * @fires Grid#resetpathfinding
 * @param {boolean?} resetH 
 */
Grid.prototype.resetPathfinding = function resetPathfinding(resetH) {
    resetH = resetH === true;

    for (let x = 0; x < this.width; x++)
        for (let y = 0; y < this.height; y++) {
            let c = this.getCell(x, y);
            if (c instanceof Cell) {
                // resets the gValue
                c.gValue = undefined;

                if (resetH)
                    c.hValue = this.calcHCell(c);

                if (c.type == 'checked')
                    c.type = 'traversable';
            }
        }



    this.found = false;
    this.openList = [];

    if (this.start !== undefined) {
        this.openList[0] = this.start;
        this.start.gValue = 0;
        this.appendPossibleCells();
    }

    /**
     * {@link Grid#resetPathfinding} was called
     * 
     * @event Grid#resetpathfinding
     * @type {object}
     */
    this.dispatchEvent('resetpathfinding', {});
}

/**
 * Appends all possible (cells which are traversable) to the open list and sorts the open list.
 * @param {Cell} from
 */
Grid.prototype.appendPossibleCells = function appendPossibleCells(from) {
    if (!(from instanceof Cell))
        return;

    let usable = this.getSorrundingCells(from.x, from.y)
        // filter the surrounding cells so they are not alread in the openList and are traversable or the target     
        .filter(cell =>
            this.openList.indexOf(cell) == -1 && (cell.type == 'traversable' || cell.type == 'target')
        );

    usable.forEach(cell => {
        // boolean if this cell is diagonal to the 'from' cell
        let diagonal = !(from.x == cell.x || from.y == cell.y);

        let calcedG = from.gValue + this.steppingCost * (diagonal ? Math.SQRT2 : 1);

        if (!isFinite(cell.gValue) || calcedG < cell.gValue) {
            cell.gValue = calcedG;
            cell.comingFrom = from;
        }
    });

    this.openList = this.openList
        .concat(usable)
        // sort by the f value and then after the h value
        .sort((cellA, cellB) =>
            (cellA.fValue != cellB.fValue) ?
            cellA.fValue - cellB.fValue :
            cellA.hValue - cellB.hValue);
}

/**
 * Makes one step in the means of the A* Pathfinding Algorithm.
 * 
 * @returns {'found'|'undefined'|'checked'|'progressed'|'no cells'} returns the progression status
 */
Grid.prototype.step = function step() {
    if (this.found)
        return 'found';

    let cell = this.openList.shift();
    let ret = 'undefined';

    if (cell == this.target) {
        this.found = true;

        ret = 'found';
    } else if (cell != null) {
        if (cell != this.start)
            cell.type = 'checked';

        this.appendPossibleCells(cell);
        ret = 'progressed';
    } else {
        ret = 'no cells';
    }


    return ret;
}

/**
 * Gets all cells which are in reach of the defined cell, the return value depends on 'canWalkDiagonal'
 * 
 * @param {number} x x coordinate of the cell
 * @param {number} y y coordinate of the cell
 * @returns {Cell[]} the cells which are in reach
 */
Grid.prototype.getSorrundingCells = function getSorrundingCells(x, y) {
    let cells = [];

    for (let xS = -1; xS < 2; xS++) {
        for (let yS = -1; yS < 2; yS++) {
            if (xS == 0 && yS == 0) // is origin
                continue;

            let diagonal = xS != 0 && yS != 0;

            if (!this.canWalkDiagonal && diagonal)
                continue;

            let c = this.getCell(x + xS, y + yS)

            if (c != undefined)
                cells[cells.length] = c;
        }
    }

    return cells;
}