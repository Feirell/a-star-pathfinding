'use strict';

/**
 * Table is the visualizing class which constructs a grid internally and displays the grid as HTML table
 * @class
 * @param {Number} pw the width on cell should occupy, this result in creating some other css rules
 */
function Table(cw) {
    const cellWidth = parseInt(cw);
    const highlighterWidth = parseFloat(cellWidth * 1.15);

    {
        let style = document.createElement('style');
        style.innerHTML = '';
        style.innerHTML += '.cell{width: ' + cellWidth + 'px; height:' + cellWidth + 'px;font-size: ' + parseInt(cellWidth * 0.2) + 'px;padding: ' + parseInt(cellWidth * 0.05) + 'px;}';
        style.innerHTML += '.highlighter{width: ' + highlighterWidth + 'px; height:' + highlighterWidth + 'px;}';
        document.head.appendChild(style);
    }

    let width = 0;
    let height = 0;

    let elementTable = [];

    Object.defineProperties(this, {
        /**
         * The with of one cell in px
         * 
         * @member {Number} Table#cellWidth
         */
        cellWidth: {
            value: cellWidth
        },
        /**
         * The with of the highlighter in px
         * 
         * @member {Number} Table#highlighterWidth
         */
        highlighterWidth: {
            value: highlighterWidth
        },
        /**
         * This member contains the table, you should not modify the amount / arrangement of the children yourself, but rather use the provided functions
         * @member {HTMLDivElement} Table#wrapper
         */
        wrapper: {
            value: document.createElement('div')
        },
        /**
         * The grid this table is representing
         * 
         * <span style='font-weight:bolder;font-size:2em;color:red;'>You should not modify the properties of the grid, especially not the .width and .height!</span>
         * 
         * @member {Cell} Table#grid
         */
        grid: {
            value: new Grid(0, 0)
        },
        /**
         * This number represents the amount of columns present in each row of the {@link Table#table}
         * 
         * @member {number} Table#width
         */
        width: {
            set: (newWidth) => {
                newWidth = parseInt(newWidth);

                // if (newWidth > this.width) {
                //     width = newWidth;
                //     for (let row = 0; row < this.height; row++) {
                //         let rowElement = this.table.children[row];

                //         // rowElement.children.length should be equal to this.width
                //         for (let column = rowElement.children.length; column < newWidth; column++) {
                //             let cell = Table.createTableCell();
                //             let container = Table.createContainer();

                //             cell.appendChild(container);
                //             rowElement.appendChild(cell);
                //         }
                //     }
                // } else if (newWidth < this.width) {
                //     width = newWidth;
                //     for (let row = 0; row < this.height; row++) {
                //         let rowElement = this.table.children[row];
                //         // rowElement.children.length should be equal to this.width
                //         // this for loop has to go from the last to the first because otherwise the ids will mismatch, because the dom structure is changing
                //         for (let column = rowElement.children.length; column >= newWidth; column--) {
                //             let cell = undefined;
                //             if (this.table.children.length > y && this.table.children[y].children.length > x)
                //                 cell = this.table.children[y].children[x];

                //             if (cell instanceof HTMLTableCellElement)
                //                 rowElement.removeChild(cell);
                //         }
                //     }
                // }
                this.wrapper.style.setProperty('width', newWidth * cellWidth + 'px');
                this.grid.width = width = newWidth;
            },

            //get: () => this.table.children.length == 0 ? 0 : this.table.children[0].children.length
            get: () => width
        },
        /**
         * This number represents how many rows are present in the {@link Table#table}
         * 
         * @member {number} Table#height
         */
        height: {
            set: (newHeight) => {
                newHeight = parseInt(newHeight);

                // if (newHeight > this.height) {
                //     height = newHeight;
                //     for (let row = this.table.children.length; row < newHeight; row++) {
                //         let rowElement = Table.createTableRow();

                //         for (let column = 0; column < this.width; column++) {
                //             let cell = Table.createTableCell();
                //             let container = Table.createContainer();

                //             cell.appendChild(container);
                //             rowElement.appendChild(cell);
                //         }

                //         this.table.appendChild(rowElement);
                //     }
                // } else if (newHeight < this.height) {
                //     height = newHeight;
                //     // the foor loop has to go from the last to the first, because the dom will reapportion the children 
                //     for (let row = this.table.children.length; row >= newHeight; row--) {
                //         let rowElement = this.table.children.length > row ? this.table.children[row] : undefined;
                //         if (rowElement instanceof HTMLTableRowElement)
                //             this.table.removeChild(rowElement);
                //     }
                // }
                this.wrapper.style.setProperty('height', newHeight * cellWidth + 'px');
                this.grid.height = height = newHeight;
            },
            //get: () => this.table.children.length
            get: () => height
        },
        /**
         * Returns a container which represents a cell in this table
         * @method Table#getContainer
         * @returns {HTMLDivElement} the new container
         */
        getContainer: {
            value: (x, y) => {
                if (x >= width || y >= height)
                    return undefined;

                if (elementTable[x] == undefined)
                    elementTable[x] = [];

                if (elementTable[x][y] == undefined) {
                    elementTable[x][y] = document.createElement('div');
                }

                return elementTable[x][y];
            }
        }
    });

    this.wrapper.className = "table-wrapper";

    this.grid.addEventListener('addcell', ev => {
        let container = this.getContainer(ev.x, ev.y);

        container.style.setProperty('left', ev.x * cellWidth + 'px');
        container.style.setProperty('top', ev.y * cellWidth + 'px');

        ev.cell.registerDisplayElementForCell(container);
        this.wrapper.appendChild(container);
    });

    this.grid.addEventListener('removecell', ev => {
        let container = this.getContainer(ev.x, ev.y);
        this.wrapper.removeChild(container);
    });
}

/**
 * Zero index based coordinate system which is applyied on the {@link Table#table} to retrive the container of a given cell
 * @param {number} x the x of the cell
 * @param {number} y the y of the cell
 * @returns {HTMLDivElement?} the container
 */
Table.prototype.getContainer = function getContainer(x, y) {
    if (this.table.children.length > y && this.table.children[y].children.length > x)
        return this.table.children[y].children[x].children[0];
}

/**
 * Randomizes the blocked cells
 */
Table.prototype.randomizeBlocked = function randomize() {
    const g = this.grid,
        calc = (perc) => 0.15 + 0.65 * Math.sqrt(perc);

    // resetting blocked status
    for (let x = 0; x < g.width; x++)
        for (let y = 0; y < g.height; y++) {
            let cell = g.getCell(x, y);
            if (cell.type == 'blocked')
                cell.type = 'traversable';
        }


    for (let x = 0; x < g.width; x++)
        for (let y = 0; y < g.height; y++) {
            let cells = g.getSorrundingCells(x, y),
                blocked = 0;

            for (let cell of cells)
                if (cell.type == 'blocked')
                    blocked++;

            if (Math.random() < calc(blocked / cells.length)) {
                g.getCell(x, y).type = 'blocked';
            }
        }
}

/**
 * Randomizes the position of the start and the target cell
 */
Table.prototype.randomizeStartTarget = function randomizeStartTarget() {
    let g = this.grid;

    let targetX = Math.floor(Math.random() * g.width),
        targetY = Math.floor(Math.random() * g.height),
        startX = Math.floor(Math.random() * g.width),
        startY = Math.floor(Math.random() * g.height);

    while (startX == targetX)
        startX = Math.floor(Math.random() * g.width);

    while (startY == targetY)
        startY = Math.floor(Math.random() * g.width);

    g.target = g.getCell(targetX, targetY);
    g.start = g.getCell(startX, startY);

    return {
        start: g.start,
        target: g.target
    }
}