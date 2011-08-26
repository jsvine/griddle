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

	// If Griddle has already been loaded, or if there's another object
	// in the window.Griddle namespace, throw an error.
	if (window.Griddle) {
		throw new Error('Global `Griddle` already exists.');	
	} else {
		window.Griddle = Griddle;	
	}

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

	// Constructor pattern to create tiles. 
	function Tile(data) {
		var el = CE(this.tile_element_type, 'griddle_tile');
		stylize.call(el, {
			cssFloat: 'left',
			styleFloat: 'left', // For IE
			width: this.tile_width ? this.tile_width + 'px' : 'auto',
			height: this.tile_height ? this.tile_height + 'px' : 'auto'
		});
		return {
			data: data,
			el: el, 
			index: null,
			x: null,
			y: null,
			adjacent: {}
		};
	}

// `init` creates a new griddle, using `container` as the holder,
// accepting any `config.data`, a custom `render` function, and `options`.
	Griddle.create = function (config) {
		var grid, i, transition;
		grid = {
			init_config: config,
			container: config.container,
			grid_element_type: config.grid_element_type || 'div',
			tile_element_type: config.tile_element_type || 'div',
			el: CE(config.grid_element_type || 'div', 'griddle'),
			n_col: config.n_col || config.data.length,
			n_col_visible: config.n_col_visible || config.n_col,
			n_row_visible: config.n_row_visible,
			current_index: 0,
			tile_width: config.tile_width,
			tile_height: config.tile_height,
			tiles: [],
			goto: function (destination_index) {
				var destination_tile = this.tiles[destination_index];
				this.el.style.left = -(destination_tile.el.offsetLeft) + 'px';
				this.el.style.top = -(destination_tile.el.offsetTop) + 'px';
				if (config.onexit) { config.onexit.call(grid); }
				this.current_index = destination_index;
				if (config.onenter) { config.onenter.call(grid); }
				return this;
			},
			shift: function (direction, distance) { // distance is an optional param, defaults to 1
				var i = this.current_index;
				distance = distance || 1;
				while (distance--) {
					i = this.tiles[i].adjacent[direction];
					if (!this.tiles[i]) {
						return false;	
					}
				}
				return this.goto(i); // which ultimately returns 'this'
			},
			add: function (data, index, custom_render) {
				var tile, new_tiles = [], i, render = custom_render || config.render;
				if (Object.prototype.toString.call(data) !== '[object Array]') {
					data = [data];	
				}
				for (i = 0; i < data.length; i++) {
					tile = Tile.call(grid, data[i]);
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
			},
			remove: function (index, n, removedTilesArray) {
				var countdown = n || 1;
				while (countdown--) {
					if (removedTilesArray) {
						removedTilesArray.push(this.tiles.slice(i, 1));
					}
					this.el.removeChild(this.tiles[index].el);
					this.tiles.splice(index, 1);
				}
				calculatePositions.call(this);
				return this;
			},
			setDimensions: function (config) {
				this.n_col = config.n_col || this.n_col;
				this.n_col_visible = config.n_col_visible || this.n_col_visible;
				this.n_row_visible = config.n_row_visible || this.n_row_visible;
				stylize.call(grid.el, {
					width: grid.tile_width * grid.n_col + 'px' 
				});
				stylize.call(grid.container, {
					width: grid.tile_width * grid.n_col_visible + 'px', 
					height: grid.tile_height && grid.n_row_visible ? grid.tile_height * grid.n_row_visible + 'px' : 'auto' 
				});
				calculatePositions.call(this);	
				return this;
			}
		};
		
		transition = config.transition || "left 0.25s linear, top 0.25s linear";

		stylize.call(grid.el, {
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

		stylize.call(config.container, {
			overflow: 'hidden',
			position: 'relative'
		});		

		grid.setDimensions({n_col: config.n_col, n_col_visible: config.n_col_visible, n_row_visible: config.n_row_visible});
		grid.add(config.data);
		config.container.appendChild(grid.el);
		return grid;
	};
}());
