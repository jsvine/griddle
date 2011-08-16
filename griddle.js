(function(){
	var root = this,
		Griddle = {};
	if (root.Griddle) {
		throw new Error('Global `Griddle` already exists.');	
	} else {
		root.Griddle = Griddle;	
	}
// `init` creates a new griddle, using `container` as the holder,
// accepting any `attr.data`, a custom `render` function, and `options`.
	Griddle.init = function(attr) {
		var grid = {
				container: attr.container,
				el: CE('div', 'griddle_grid'),
				n_col: attr.n_col || attr.data.length,
				current_index: 0,
				tiles: [],
				move: function (direction) {
					var init_index = this.current_index,
						left = px2int(this.el.style.left),
						top = px2int(this.el.style.top);
					switch(direction){
					case 'left':
						if ((this.current_index + 1) % this.n_col) {
							this.el.style.left = left - this.tiles[this.current_index].el.offsetWidth + 'px';
							this.current_index += 1;
						} else {
							return false;	
						}
						break;
					case 'right':
						if (this.current_index % this.n_col) {
							this.el.style.left = left + this.tiles[this.current_index].el.offsetWidth + 'px';
							this.current_index -= 1;
						} else {
							return false;	
						}
						break;
					case 'up':
						if (this.current_index < this.n_col) { 
							this.el.style.top = top - this.tiles[this.current_index].el.offsetHeight + 'px';
							this.current_index += this.n_col;
						} else {
							return false;	
						}
						break;
					case 'down':
						if (this.current_index >= (this.tiles.length - this.n_col)) {
							this.el.style.top = top + this.tiles[this.current_index].el.offsetHeight + 'px';
							this.current_index -= this.n_col;
						} else {
							return false;	
						}
						break;
					default:
						return false;
						break;
					}
					attr.onexit && attr.onexit.call(this.tiles[init_index]);
					attr.onenter && attr.onenter.call(this.tiles[this.current_index]);
					return this.current_index;
				}
			},
			tile,
			i,
			transition = attr.transition || "left 0.25s linear, top 0.25s linear";
		
		applyStyles(grid.el, {
			width: 100 * grid.n_col + '%',
			height: 100 * attr.data.length / grid.n_col + '%',
			position: 'relative',
			overflow: 'auto',
			top: 0,
			left: 0,
			WebkitTransition: transition,
			MozTransition: transition,
			OTransition: transition,
			MsTransition: transition,	
			Transition: transition
		});
		function Tile(i) {
			var x = i % this.n_col,
				y = Math.floor(i / this.n_col);
			return {
				el: CE('div', 'griddle_tile'),
				index: i,
				x: x,
				y: y,
				adjacent: {
					left: x > 0 ? x - 1 : false,
					right: x < (this.n_col - 1) ? x + 1 : false,
					up: y > 0 ? y - 1 : false,
					down: y < ((this.tiles.length / this.n_col) - 1) ? y + 1 : false
				}
			};
		}
		for (i = 0; i < attr.data.length; i++) {
			tile = Tile.call(grid, i);
			applyStyles(tile.el, {
				cssFloat: 'left',
				styleFloat: 'left', // For IE
				clear: i % grid.n_col ? 'none' : 'left',
				width: 100 / grid.n_col + '%',
				height: 100 * grid.n_col / attr.data.length + '%'
			});
			attr.render.call(tile, attr.data[i]); // calls `render(attr.data[i])` with `this` set to `tile`
			grid.tiles.push(tile);
			grid.el.appendChild(tile.el);
		}

		attr.container.style.overflow = 'hidden';
		attr.container.style.position = 'relative';
		attr.container.appendChild(grid.el);

		if (attr.enableArrows) {
			document.onkeydown = function(e){
				var evt = e || window.event,
					setting = attr.enableArrows;
				
				switch(evt.keyCode){
					case 37: // Left
						if (typeof setting === 'string' && setting.indexOf('l') === -1) {
							break;
						}
						grid.move('left');
						break;
					case 38: // Up
						if (typeof setting === 'string' && setting.indexOf('u') === -1) {
							break;
						}
						grid.move('up');
						break;
					case 39: // Right
						if (typeof setting === 'string' && setting.indexOf('r') === -1) {
							break;
						}
						grid.move('right');
						break;
					case 40: // Down
						if (typeof setting === 'string' && setting.indexOf('d') === -1) {
							break;
						}
						grid.move('down');
						break;
					default:
						break;
				}	
			};
		}
		return grid;
	}

	// HELPER FUNCTIONS
	function CE(tag, cName, innerHTML, styles){
		var el = document.createElement(tag);
		if (cName) el.className = cName;
		if (innerHTML) el.innerHTML = innerHTML;
		if (styles) {
			applyStyles(el, styles);
		}
		return el;
	}
	
	function applyStyles(el, styles) {
		var s;
		for (s in styles) {
			el.style[s] = styles[s];	
		}
		return el;
	}

	function px2int(str){
		return parseInt(str.split('px')[0], 10) || 0;	
	}


})(this);


