(function () {
	var root = this,
		Griddle = {};
	if (root.Griddle) {
		throw new Error('Global `Griddle` already exists.');	
	} else {
		root.Griddle = Griddle;	
	}
	// HELPER FUNCTIONS
	function applyStyles(el, styles) {
		var s;
		for (s in styles) {
			el.style[s] = styles[s];	
		}
		return el;
	}
	function CE(tag, className, innerHTML, styles) {
		var el = document.createElement(tag);
		if (className) { el.className = className; }
		if (innerHTML) { el.innerHTML = innerHTML; }
		if (styles) {
			applyStyles(el, styles);
		}
		return el;
	}
	// `Tile` constructor	
	function Tile(i) {
		var x = i % this.n_col,
			y = Math.floor(i / this.n_col);
		return {
			el: CE('div', 'griddle_tile'),
			index: i,
			x: x,
			y: y,
			adjacent: {
				left: x > 0 ? i - 1 : false,
				right: x < (this.n_col - 1) ? i + 1 : false,
				up: y > 0 ? i - this.n_col : false,
				down: y < ((this.tiles.length / this.n_col) - 1) ? i + this.n_col : false
			}
		};
	}

// `init` creates a new griddle, using `container` as the holder,
// accepting any `attr.data`, a custom `render` function, and `options`.
	Griddle.extend = function (attr) {
		var grid, tile, i, transition;
		grid = {
			container: attr.container,
			el: CE('div', 'griddle'),
			n_col: attr.n_col || attr.data.length,
			n_col_visible: attr.n_col_visible || 1,
			n_row_visible: attr.n_row_visible || 1,
			current_index: 0,
			tiles: [],
			goto: function (destination_index) {
				var current_tile = this.tiles[this.current_index],
					destination_tile = this.tiles[destination_index];
				this.el.style.left = -(destination_tile.el.offsetLeft) + 'px';
				this.el.style.top = -(destination_tile.el.offsetTop) + 'px';
				if (attr.onexit) { attr.onexit.call(current_tile); }
				if (attr.onenter) { attr.onenter.call(destination_tile); }
				this.current_index = destination_index;
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
				return this.goto(i);
			}
		};
		
		transition = attr.transition || "left 0.25s linear, top 0.25s linear";
		
		for (i = 0; i < attr.data.length; i++) {
			tile = Tile.call(grid, i);
			applyStyles(tile.el, {
				cssFloat: 'left',
				styleFloat: 'left', // For IE
				clear: i % grid.n_col ? 'none' : 'left',
				width: attr.flexible_width ? 'auto' : 100 / grid.n_col + '%',
				height: attr.flexible_height ? 'auto' : 100 * grid.n_col / attr.data.length + '%'
			});
			attr.render.call(tile, attr.data[i]); // calls `render(attr.data[i])` with `this` set to `tile`
			grid.tiles.push(tile);
			grid.el.appendChild(tile.el);
		}

		applyStyles(grid.el, {
			width: 100 * grid.n_col / grid.n_col_visible + '%',
			height: 100 * attr.data.length / (grid.n_col * grid.n_row_visible) + '%',
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

		applyStyles(attr.container, {
			overflow: 'hidden',
			position: 'relative'
		});		
		
		if (attr.enableArrows) {
			document.onkeydown = function (e) {
				var evt = e || window.event;
				switch (evt.keyCode) {
				case 37: // Left
					grid.shift('left');
					break;
				case 38: // Up
					grid.shift('up');
					break;
				case 39: // Right
					grid.shift('right');
					break;
				case 40: // Down
					grid.shift('down');
					break;
				default:
					break;
				}	
			};
		}

		attr.container.appendChild(grid.el);
		return grid;
	};
}).call(this);


