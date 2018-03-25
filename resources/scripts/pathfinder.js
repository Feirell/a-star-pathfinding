window.addEventListener('DOMContentLoaded', function (e) {
    const pv = new PathfinderVisualization();
    document.body.appendChild(pv.wrapper);
});


{
    const template = `
    <div class="container"></div>
    <div class="meta">
        <div class="cell-detail-column">
            <div class="cell-detail">
                <div class="head">
                    Cell (<span class="cell-attr-x"></span>,<span class="cell-attr-y"></span>)
                </div>
                <div class="hr"></div>
                <div class="body">
                    <div>Typ:</div>
                    <div class="cell-attr-type"></div>
                    <div>H Wert:</div>
                    <div class="cell-attr-hValue"></div>
                    <div>G Wert:</div>
                    <div class="cell-attr-gValue"></div>
                    <div>F Wert:</div>
                    <div class="cell-attr-fValue"></div>
                    <div>Sichtbar:</div>
                    <div class="cell-attr-display"></div>
                    <div>Von:</div>
                    <div class="cell-attr-comingFrom"></div>
                </div>
            </div>
        </div>
        <div>
            <div class="head">
                Steuerung
            </div>
            <div class="hr"></div>
            <div class="body">
                <button class="step-button">Step</button>
                <button class="reset-button">Reset</button>
                <input type="checkbox" name="walk-diagonal" class="walk-diagonal">
                <label for="walk-diagonal">Diagonal</label>
            </div>
        </div>
    </div>`

    const attr = ["type", "x", "y", "hValue", "gValue", "fValue", "display", "comingFrom"];

    /**
     * PathfinderVisualization combines {@link Table}, controls and interactivity.
     * @class
     */
    function PathfinderVisualization() {
        const wrapper = document.createElement('div');
        wrapper.className = 'wrapper';

        wrapper.innerHTML = template;

        const attrElemMap = {};
        const cellDetail = wrapper.getElementsByClassName('cell-detail-column')[0];

        Object.defineProperties(this, {
            /**
             *  
             * @member {Table} PathfinderVisualization#table
             */
            table: {
                value: new Table(60)
            },
            /**
             *  
             * @member {HTMLDivElement} PathfinderVisualization#wrapper
             */
            wrapper: {
                value: wrapper
            },
            /**
             *  
             * @member {HTMLDivElement} PathfinderVisualization#cellDetail
             */
            cellDetail: {
                value: cellDetail
            },
            /**
             *  
             * @member {Object} PathfinderVisualization#attrElemMap
             */
            attrElemMap: {
                value: attrElemMap
            },
            /**
             *  
             * @member {HTMLDivElement} PathfinderVisualization#highlighter
             */
            highlighter: {
                value: document.createElement('div')
            }
        });

        this.highlighter.className = "highlighter";

        /*
            Attribute binding for the cell detail view
        */

        for (let a of attr)
            attrElemMap[a] = this.cellDetail.getElementsByClassName('cell-attr-' + a)[0];

        attrElemMap.comingFrom.addEventListener('click', () => {
            const lc = attrElemMap.comingFrom.linkedCell;
            if (lc != undefined)
                this.showInDetailView(lc);
        });


        /*
            Alement appending
        */

        this.table.wrapper.appendChild(this.highlighter);
        this.wrapper.getElementsByClassName('container')[0].appendChild(this.table.wrapper);



        this.table.height = 14;
        this.table.width = 23;
        this.reset();

        /*
            Event binding
        */

        const showInDetailView = this.showInDetailView.bind(this);

        function cellClickListener(e) {
            if (e.ctrlKey) {
                table.grid.start = this.cell;
            } else {
                if (this.cell.type == 'blocked')
                    this.cell.type = 'traversable';
                else if (this.cell.type == 'traversable')
                    this.cell.type = 'blocked';
                else
                    showInDetailView(this.cell);
            }
        }

        function cellMouseOverListener(e) {
            if (this.cell.type == 'checked') {
                // console.log(this.cell.getPathOfCell());

            }
        }

        function cellMouseOutListener(e) {
            if (this.cell.type == 'checked') {
                // this.container.classList.remove('hovering');

            }
        }

        for (let x = 0; x < this.table.grid.width; x++)
            for (let y = 0; y < this.table.grid.height; y++) {

                let container = this.table.getContainer(x, y);
                let cell = this.table.grid.getCell(x, y);

                let binding = {
                    cell: cell,
                    container: container
                };

                console.log('binding on: ', cell);
                container.addEventListener('click', cellClickListener.bind(binding));
                container.addEventListener('mouseover', cellMouseOverListener.bind(binding));
                container.addEventListener('mouseout', cellMouseOutListener.bind(binding));
            }

        this.wrapper.getElementsByClassName('step-button')[0].addEventListener('click', () => {
            console.log('A* Step:', this.table.grid.step());
        });

        this.wrapper.getElementsByClassName('reset-button')[0].addEventListener('click', () => {
            this.reset();
        });

        const diagCheckbox = this.wrapper.getElementsByClassName('walk-diagonal')[0];
        this.table.grid.canWalkDiagonal = diagCheckbox.checked;

        diagCheckbox.addEventListener('click', () => {
            this.table.grid.canWalkDiagonal = diagCheckbox.checked;
        })
    }

    /**
     * Resets the ui and the {@link Table} which also resets the {@link Grid} 
     */
    PathfinderVisualization.prototype.reset = function reset() {
        this.cellDetail.setAttribute('data-visible', 'false');
        this.highlighter.setAttribute('data-visible', 'false');

        this.table.grid.resetPathfinding();
        this.table.randomizeBlocked();
        this.table.randomizeStartTarget();
    }

    /**
     * Shows given cell in the detail view and points the highlighter on it.
     * 
     * @param {Cell?} cell if undefined is transmitted the detail view and the highlighter will be gone
     */
    PathfinderVisualization.prototype.showInDetailView = function showInDetailView(cell) {
        if (cell == undefined) {
            this.cellDetail.setAttribute('data-visible', 'false');
            this.highlighter.setAttribute('data-visible', 'false');
            return;
        } else {
            this.cellDetail.setAttribute('data-visible', 'true');
            this.highlighter.setAttribute('data-visible', 'true');

            let elem = this.table.getContainer(cell.x, cell.y);
            const offset = (this.table.highlighterWidth - this.table.cellWidth) / 2;
            this.highlighter.style.setProperty('top', (+elem.style.getPropertyValue('top').slice(0, -2) - offset) + 'px');
            this.highlighter.style.setProperty('left', (+elem.style.getPropertyValue('left').slice(0, -2) - offset) + 'px');

            for (let a of attr) {
                if (this.attrElemMap[a] == undefined)
                    continue;

                if (a == 'comingFrom') {
                    let cf = cell.comingFrom,
                        cfe = this.attrElemMap.comingFrom;

                    cfe.linkedCell = cf;
                    cfe.innerText = cf == undefined ? '<undefined>' : 'Cell (' + cf.x + ',' + cf.y + ')';
                } else {
                    this.attrElemMap[a].innerText = typeof cell[a] == 'number' ? Math.round10(cell[a], -2) : cell[a];
                }
            }
        }
    }
}