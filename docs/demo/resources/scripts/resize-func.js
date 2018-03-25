this.resize = function resize(newWidth, newHeight) {
    if ((newWidth = parseInt(newWidth)) === NaN)
        newWidth = width;

    if ((newHeight = parseInt(newHeight)) === NaN)
        newHeight = height;

    if (newWidth != oldWidth || newHeight != oldHeight) {

        height = newHeight;
        width = newWidth;

        if (start !== undefined && ((start.x) >= newWidth || (start.y) >= newHeight))
            this.start = undefined;

        if (target !== undefined && ((target.x) >= newWidth || (target.y) >= newHeight))
            this.target = undefined;

        /* calculating the areas which are added or removed */

        let removedAreas = [];
        let addedAreas = [];

        let deltaX = newWidth - oldWidth;
        let deltaY = newHeight - oldHeight;

        if (deltaX != 0) {
            let endY = deltaY < 0 ? newHeight - 1 : oldHeight - 1;

            if (deltaX < 0) // x / width decreased
                removedAreas[removedAreas.length] = new Area(newWidth - 1, oldWidth - 1, 0, endY);
            else // x / width increased
                addedAreas[addedAreas.length] = new Area(oldWidth - 1, newWidth - 1, 0, endY);
        }

        if (deltaY != 0) {
            if (deltaY < 0) // y / height decreased
                removedAreas[removedAreas.length] = new Area(0, deltaX < 0 ? widht - 1 : newWidth - 1, newHeight - 1, oldHeight - 1);
            else // y / height increased
                addedAreas[addedAreas.length] = new Area(0, newWidth - 1, newHeight - 1, oldHeight - 1);
        }

        /* using those areas to process the adding / removing */

        if (removedAreas.length > 0) {
            (new AreaGroup(removedAreas)).iterator().forEach(function (point) {
                this.dispatchEvent('removecell', {
                    x: point.x,
                    y: point.y,
                    cell: grid[point.x][point.y]
                });
            });
        }

        if (addedAreas.length > 0) {
            (new AreaGroup(addedAreas)).iterator().forEach(function (point) {
                grid[point.x][point.y] = new Cell(point.x, point.y);

                this.dispatchEvent('addcell', {
                    x: point.x,
                    y: point.y,
                    cell: grid[point.x][point.y]
                });
            });
        }


        this.dispatchEvent('resize', {
            oldHeight: oldHeight,
            oldWidth: oldWidth,
            newHeight: newHeight,
            newWidth: newWidth
        });


    }
}