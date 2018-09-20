// Copyright Klaus Ganser <https://kganser.com>
// MIT Licensed, with this copyright and permission notice
// <http://opensource.org/licenses/MIT>

var table = function() {

  var Node = function(element, value, parent, insert, remove) {
    this.element = element;
    this.value = value;
    this.parent = parent;
    this.insertFn = insert || function() {};
    this.removeFn = remove || function() {};
    this.children = [];
  };
  
  Node.prototype = {
    get: function(index) {
      return this.children[index];
    },
    insert: function(value, index) {
      if (typeof index != 'number') index = this.children.length;
      this.children.splice(index, 0, this.insertFn(this, value, index));
      return this;
    },
    insertAll: function(values, index) {
      if (typeof index != 'number') index = this.children.length;
      values.forEach(function(value, i) { this.insert(value, index+i); }.bind(this));
      return this;
    },
    remove: function(index) {
      var removed = this.children.splice(index, 1);
      if (removed[0]) this.removeFn(removed[0], index); 
      return this;
    },
    sort: function(compare) {
      var sorted = this.children.slice().sort(compare);
      this.children.forEach(function(child, index) {
        if (child != sorted[index])
          this.remove(index).insert(sorted[index].value, index);
      }.bind(this));
      return this;
    }
  };
  
  var format = {
    table: function(columns, hooks) {
      var table = document.createElement('table'),
          row = hooks.row(columns, -1);
      table.appendChild(document.createElement('thead')).appendChild(row[0]);
      columns.forEach(function(value, index) { row[1].appendChild(hooks.cell(value, value, index, null)); });
      return [table, table.appendChild(document.createElement('tbody'))];
    },
    row: function(value, index) {
      var row = document.createElement('tr');
      return [row, row];
    },
    cell: function(key, value, index, row) {
      return document.createElement(row ? 'td' : 'th').appendChild(document.createTextNode(value)).parentNode;
    }
  };

  return function(element, data, columns, hooks) {
    
    if (!columns) {
      columns = {};
      data.forEach(function(row) {
        Object.keys(row).forEach(function(column) { columns[column] = 1; });
      });
      columns = Object.keys(columns);
    }
    if (!hooks) hooks = format;
    else for (var type in format)
      if (typeof hooks[type] != 'function')
        hooks[type] = format[type];
    
    var table = hooks.table(columns, hooks);
    element.appendChild(table[0]);
    
    var node = new Node(table[1], [], null, function(parent, value, index) {
    
      var table = parent.element,
          row = hooks.row(value, index);
      table.insertBefore(row[0], table.childNodes[index]);
      parent.value.splice(index, 0, value);
      
      return new Node(row[1], value, parent, function(parent, value, index) {
      
        var row = parent.element;
        row.insertBefore(hooks.cell(columns[index], value, index, parent.value), row.childNodes[index]);
        return parent.value[columns[index]] = value;
        
      }, function(previous, index) {
      
        previous.parent.element.removeChild(previous.element);
        delete previous.parent.value[columns[index]];
        
      }).insertAll(columns.map(function(column) { return value[column]; }));
      
    }, function(previous, index) {
    
      previous.parent.element.removeChild(previous.element);
      previous.parent.value.splice(index, 1);
      
    }).insertAll(data);
    
    return {
      get: function(row, column) {
        if (row == undefined) return node.value;
        if (column == undefined) return node.get(row).value;
        return node.get(row).get(column);
      },
      insert: node.insert.bind(node),
      insertAll: node.insertAll.bind(node),
      remove: node.remove.bind(node),
      sort: function(comparator) {
        return node.sort(function(a, b) {
          return comparator(a.value, b.value);
        });
      }
    };
  };
}();

