//     Griddle.js 0.1
//     (c) 2011 Jeremy Singer-Vine
//     Griddle may be freely distributed under the MIT license.
//     Details and documentation at: http://jsvine.github.com/griddle

(function () {

	// Initial Setup
	// -------------

	var Griddle = {
		VERSION: 0.1	
	};

	window.Griddle = window.Griddle || Griddle;

	// Helper function for stylizing elements. 
	// Use as `stylize.call` to set `this`.
	function stylize(styles) {
		var s;
		for (s in styles) {
			this.style[s] = styles[s];	
		}
		return this;
	}

	// Helper function to create DOM elements, with
	// optional class name and inner HTML.
	function CE(tag, className, innerHTML) {
		var el = document.createElement(tag);
		if (className) { el.className = className; }
		if (innerHTML) { el.innerHTML = innerHTML; }
		return el;
	}

	// Private function to calculate, for each tile, whether it 
	// has a neighboring tile to the left, right, top, or bottom. 
	// Called every time the grid layout changes or a tile is added 
	// or removed. Also records an x and y coordinate.
	function calculatePositions() {
		var i, x, y;
		for (i = 0; i < this.tiles.length; i++) {
			x = i % this.n_col;
			y = Math.floor(i / this.n_col);
			this.tiles[i].x = x;
			this.tiles[i].y = y;
			this.tiles[i].index = i;
			this.tiles[i].adjacent = {
				left: x > 0 ? i - 1 : false,
				right: x < (this.n_col - 1) ? i + 1 : false,
				up: y > 0 ? i - this.n_col : false,
				down: y < ((this.tiles.length / this.n_col) - 1) ? i + this.n_col : false
			};	
		}
	}

	// Constructor to create tiles. 
	function Tile(grid, data) {
		this.el = CE(grid.tile_element_type, 'griddle_tile');
		stylize.call(this.el, {
			cssFloat: 'left',
			styleFloat: 'left', // For IE
			width: grid.tile_width ? grid.tile_width + 'px' : 'auto',
			height: grid.tile_height ? grid.tile_height + 'px' : 'auto'
		});
		this.data = data;
		this.index = null;
		this.x = null;
		this.y = null;
		this.adjacent = {};
	}
	
	// Contructor to create grids.
	function Grid(config) {
		var transition = config.transition || "left 0.25s linear, top 0.25s linear";
		this.config = config;
		this.container = config.container;
		this.grid_element_type = config.grid_element_type || 'div';
		this.tile_element_type = config.tile_element_type || 'div';
		this.el = CE(config.grid_element_type || 'div', 'griddle');
		this.render = config.render;
		this.n_col = config.n_col || config.data.length;
		this.n_col_visible = config.n_col_visible || config.n_col;
		this.n_row_visible = config.n_row_visible || config.data.length / config.n_col;
		this.current_index = 0;
		this.tile_width = config.tile_width;
		this.tile_height = config.tile_height;
		this.container_height = config.container_height;
		this.tiles = [];
		stylize.call(this.el, {
			position: 'relative',
			overflow: 'visible',
			top: 0,
			left: 0,
			WebkitTransition: transition,
			MozTransition: transition,
			OTransition: transition,
			MsTransition: transition,	
			Transition: transition
		});
	}

	// Add() pushes one or more tiles into the grid. `data` is an array
	// of objects; each object is used to create a tile. `index` (optional) is the
	// index of the existing tile before which you would like to insert the new
	// tiles. If `index` is undefined, new tiles are pushed to the end of the grid.
	// `custon_render` (optional) overrides the main tile-rendering function initially
	// passed to `Griddle.create()`.
	Grid.prototype.add = function (data, index, custom_render) {
		var tile, new_tiles = [], i, render = custom_render || this.render;
		
		if (Object.prototype.toString.call(data) !== '[object Array]') {
			data = [data];	
		}
		
		for (i = 0; i < data.length; i++) {
			tile = new Tile(this, data[i]);
			new_tiles.push(tile);
			if (index === undefined) {
				this.el.appendChild(tile.el);
				this.tiles.push(tile);
			} else {
				this.el.insertBefore(this.el, this.tiles[index].el);
				this.tiles.splice(index, 0, tile);
			}
		}
		
		calculatePositions.call(this);

		// Call render() only after positions have been calculated.
		for (i = 0; i < new_tiles.length; i++) {
			render.call(new_tiles[i]);
		}
		
		return this;
	};

	// `Remove()` deletes `n` tiles from the grid, beginning with the
	// tile at `index`. If the optional `removedTilesArray` is provided,
	// deleted tiles are stored in it.
	Grid.prototype.remove = function (index, n, removedTilesArray) {
		var countdown = n || 1;
		while (countdown--) {
			if (removedTilesArray) {
				removedTilesArray.push(this.tiles.slice(index, 1));
			}
			this.el.removeChild(this.tiles[index].el);
			this.tiles.splice(index, 1);
		}
		calculatePositions.call(this);
		return this;
	};

	// `go()` aligns the top-left corner of the tile at `destination_index`
	// with the top-left corner of the Griddle container. If `onexit` and `onenter`
	// functions were included in Griddle.create()'s `config` argument, those are 
	// invoked. 
	Grid.prototype.go = function (destination_index) {
		var destination_tile = this.tiles[destination_index];
		this.el.style.left = -(destination_tile.el.offsetLeft) + 'px';
		this.el.style.top = -(destination_tile.el.offsetTop) + 'px';
		if (this.config.onexit) { this.config.onexit.call(this); }
		this.current_index = destination_index;
		if (this.config.onenter) { this.config.onenter.call(this); }
		return this;
	};

	// `shift()` moves the grid in the direction that *simulates* the viewport
	// moving `distance` (optional, defaults to 1) tiles in `direction`. In reality, 
	// hover, the grid moves in the opposite of `direction`.
	Grid.prototype.shift = function (direction, distance) { // distance is an optional param, defaults to 1
		var i = this.current_index;
		distance = distance || 1;
		while (distance--) {
			i = this.tiles[i].adjacent[direction];
			if (!this.tiles[i]) {
				return false;	
			}
		}
		return this.go(i); // which ultimately returns 'this'
	};
	
	// `setDimensions` sets or resets the number of columns in the grid,
	// the number of columns visible in the viewport, and/or the number 
	// of rows visible in the viewport.
	// Valid config properties: `n_col`, `n_col_visible`, `n_row_visible`
	Grid.prototype.setDimensions = function (config) {
		this.n_col = config.n_col || this.n_col;
		this.n_col_visible = config.n_col_visible || this.n_col_visible;
		this.n_row_visible = config.n_row_visible || this.n_row_visible;
		stylize.call(this.el, {
			width: this.tile_width * this.n_col + 'px'
		});
		stylize.call(this.container, {
			width: this.tile_width * this.n_col_visible + 'px', 
			height: (this.tile_height && this.n_row_visible) ? 
				this.tile_height * this.n_row_visible + 'px' : 
				(this.container_height ? this.container_height + 'px' : 'auto') 
		});
		calculatePositions.call(this);	
		return this;
	};


	// `create()` builds a Griddle, using `container` as the holder,
	// accepting any a config object and returning the resulting grid. 
	//
	// `config` options:
	// - **container** (required): An empty HTML div element, which
	// will act as the viewport.
	// - **tile_width** (required): Each tile's width, in pixels.
	// - **tile_height** (optional): Each tile's height, in pixels.
	// - **container_height** (optional): Used if `tile_height` and 
	// `n_row_visible` are not supplied. Useful for grids with tiles of 
	// a certain width but an uncertain height.
	// - **render** (optional, strongly suggested): A function called 
	// on each tile, to render it.
	// - **data** (optional): An array of objects, each of which is used
	// to create a new Tile.
	// - **n_col** (optional): The number of columns in the grid. Defaults 
	// to the length of `config.data`.
	// - **n_col_visible** (optional): The number of columns visible in
	// the container at any given time.
	// - **n_row_visible** (optional): The number of rows visible in
	// the container at any given time.
	// - **grid_element_type**: A string indicating type of HTML element 
	// to create for the grid. Defaults to 'div'.
	// - **tile_element_type**: A string indicating type of HTML element 
	// to create for each tile. Defaults to 'div'.
	// - **transition**: CSS transition property applied to the grid. Defaults
	// to "left 0.25s linear, top 0.25s linear".
	// - **onexit**: A function called on the grid before changing `current_index`.
	// - **onenter**: A function called on the grid after changing `current_index`.
	Griddle.create = function (config) {
		var grid = new Grid(config); 

		stylize.call(config.container, {
			overflow: 'hidden',
			position: 'relative'
		});		

		grid.setDimensions({
			n_col: grid.n_col, 
			n_col_visible: grid.n_col_visible, 
			n_row_visible: grid.n_row_visible
		});

		if (config.data) {
			grid.add(config.data);
		}

		config.container.appendChild(grid.el);
		
		return grid;
	};
}());
