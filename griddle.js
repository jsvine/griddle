(function () {
	var Griddle = {};
	if (window.Griddle) {
		throw new Error('Global `Griddle` already exists.');	
	} else {
		window.Griddle = Griddle;	
	}
	// HELPER FUNCTIONS
	function stylize(styles) {
		var s;
		for (s in styles) {
			this.style[s] = styles[s];	
		}
		return this;
	}
	function CE(tag, className, innerHTML) {
		var el = document.createElement(tag);
		if (className) { el.className = className; }
		if (innerHTML) { el.innerHTML = innerHTML; }
		return el;
	}
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
			}	
		}
	}
	// `Tile` constructor	
	function Tile(data) {
		var el = CE('div', 'griddle_tile');
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
// accepting any `attr.data`, a custom `render` function, and `options`.
	Griddle.extend = function (attr) {
		var grid, tile, i, transition;
		grid = {
			init_attr: attr,
			container: attr.container,
			el: CE('div', 'griddle'),
			n_col: attr.n_col || attr.data.length,
			n_col_visible: attr.n_col_visible || 1,
			n_row_visible: attr.n_row_visible || 1,
			current_index: 0,
			tile_width: attr.tile_width,
			tile_height: attr.tile_height,
			tiles: [],
			goto: function (destination_index) {
				var current_tile = this.tiles[this.current_index],
					destination_tile = this.tiles[destination_index];
				this.el.style.left = -(destination_tile.el.offsetLeft) + 'px';
				this.el.style.top = -(destination_tile.el.offsetTop) + 'px';
				if (attr.onexit) { attr.onexit.call(grid); }
				this.current_index = destination_index;
				if (attr.onenter) { attr.onenter.call(grid); }
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
				var tile, i, render = custom_render || attr.render;
				if (Object.prototype.toString.call(data) !== '[object Array]') {
					data = [data];	
				}
				for (i = 0; i < data.length; i++) {
					tile = Tile.call(grid, data[i]);
					attr.render.call(tile);
					if (index === undefined) {
						this.el.appendChild(tile.el);
						this.tiles.push(tile);
					} else {
						this.el.insertBefore(this.el, this.tiles[index].el);
						this.tiles.splice(index, 0, tile);
					}
				}
				calculatePositions.call(this);	
				return this;
			},
			remove: function (index, n, removedTilesArray) {
				var countdown = n || 1;
				while (countdown--) {
					removedTilesArray && removeTilesArray.push(this.tiles.slice(i, 1));
					this.el.removeChild(this.tiles[index].el);
					this.tiles.splice(index, 1);
				}
				calculatePositions.call(this);
				return this;
			},
			resize: function (attr) {
				
			}
		};
		
		transition = attr.transition || "left 0.25s linear, top 0.25s linear";

		stylize.call(grid.el, {
			width: grid.tile_width * grid.n_col + 'px', 
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

		stylize.call(attr.container, {
			width: grid.tile_width * grid.n_col_visible + 'px', 
			height: grid.tile_height && grid.n_row_visible ? grid.tile_height * grid.n_row_visible + 'px' : 'auto', 
			overflow: 'hidden',
			position: 'relative'
		});		

		grid.add(attr.data);
		attr.container.appendChild(grid.el);
		return grid;
	};
})();


