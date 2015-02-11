var Display = function(canvasId, tileSize) {
  this._tileSize = tileSize;
  this._halfTileSize = tileSize / 2;
  this._canvas = document.getElementById(canvasId);
  this._ctx = this._canvas.getContext('2d');
  this._width = this._canvas.width / this._tileSize;
  this._height = this._canvas.height / this._tileSize;
};

Display.prototype.drawBlock = function(x, y, color) {
  x = x * this._tileSize;
  y = y * this._tileSize;
  this._ctx.fillStyle = color;
  this._ctx.fillRect(x, y, this._tileSize, this._tileSize);
};

Display.prototype.drawDot = function(x, y, color) {
  x = x * this._tileSize + this._halfTileSize;
  y = y * this._tileSize + this._halfTileSize;
  this._ctx.fillStyle = color;
  this._ctx.arc(x, y, this._halfTileSize, 0, Math.PI * 2, false);
  this._ctx.fill();
};


var World = function(width, height) {
  this._width = width;
  this._height = height;
  this._numCells = width * height;
  this._cellBuffer = new ArrayBuffer(this._numCells * 8);
  this._cells = new Uint8Array(this._cellBuffer);
  this._writeCells = this._cells;
  this._newCellBuffer = null;
};

World.prototype.getCell = function(x, y) {
  return this._cells[x + this._width * y];
};

World.prototype.setCell = function(x, y, value) {
  this._writeCells[x + this._width * y] = value;
};

World.prototype.startUpdate = function() {
  if (this._newCellBuffer === null) {
    this._newCellBuffer = new ArrayBuffer(this._numCells * 8);
  }
  this._writeCells = new Uint8Array(this._newCellBuffer);
};

World.prototype.commitUpdate = function() {
  var tmp = this._cellBuffer;
  this._cellBuffer = this._newCellBuffer;
  this._newCellBuffer = tmp;
  this._cells = new Uint8Array(this._cellBuffer);
  this._writeCells = this._cells;
};

World.prototype.eachCell = function(callback) {
  var x = 0, y = 0;
  for (var i = 0; i < this._numCells; ++i) {
    callback(x, y, i, this._cells[i]);
    ++x;
    if (x >= this._width) {
      x = 0;
      ++y;
    }
  }
};

function drawWorld(world, display) {
  world.eachCell(function(x, y, i, value) {
    if (value === 0) {
      display.drawBlock(x, y, '#ddd');
    }
    else {
      display.drawBlock(x, y, '#333');
    }
  });
}

function fillWorldRandom(world, wallProb) {
  world.eachCell(function(x, y, i, value) {
    world.setCell(x, y, (Math.random() < wallProb) ? 1 : 0);
  });
}

function smoothWalls(world, r1Threshold, r2Threshold) {
    world.startUpdate();
    for (y = 0; y < world._height; ++y) {
      for (x = 0; x < world._width; ++x) {
        var r1 = 0, r2 = 0;
        for (yo = -1; yo <= 1; ++yo) {
          for (xo = -1; xo <= 1; ++xo) {
            if (nx < 0 || nx >= world._width || ny < 0 || ny >= world._height) {
              continue;
            }
            if (world.getCell(x + xo, y + yo) === 1) ++r1;
          }
        }
        for (yo = -2; yo <= 2; ++yo) {
          for (xo = -2; xo <= 2; ++xo) {
            var nx = x + xo, ny = y + yo;
            if (Math.abs(xo) === 2 && Math.abs(yo) === 2) continue;
            if (nx < 0 || nx >= world._width || ny < 0 || ny >= world._height) {
              continue;
            }
            if (world.getCell(x + xo, y + yo) === 1) ++r2;
          }
        }
        if (r1 >= r1Threshold || r2 <= r2Threshold) {
          world.setCell(x, y, 1);
        }
        else {
          world.setCell(x, y, 0);
        }
      }
    }
    world.commitUpdate();
}

function clearRect(world, x, y, w, h) {
  for (var cy = y; cy < y + h; ++cy) {
    for (var cx = x; cx < x + w; ++cx) {
      world.setCell(cx, cy, 0);
    }
  }
}

function generateWorld(width, height) {
  var world = new World(width, height);
  var i;
  fillWorldRandom(world, 0.4);
  for (i = 0; i < 4; ++i) smoothWalls(world, 5, 2);
  clearRect(world, Math.floor(width / 2) - 3, Math.floor(height / 2) - 3,
    6, 6);
  for (i = 0; i < 1; ++i) smoothWalls(world, 5, -1);
  return world;
}

var world = generateWorld(64, 48);
var display = new Display('display', 10);
drawWorld(world, display);
display.drawDot(32, 24, 'blue');
