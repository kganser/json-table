// Copyright 2011, Klaus Ganser <kganser.com>
// Dual licensed under the MIT or GPL Version 2 licenses.
// http://jquery.org/license

(function($) {

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
    replace: function(value, index) {
      return this.remove(index).insert(value, index);
    },
    sort: function(compare) {
      var sorted = this.children.slice().sort(compare);
      this.children.forEach(function(child, index) {
        if (child != sorted[index])
          this.replace(sorted[index].value, index);
      }.bind(this));
      return this;
    }
  };
  
  var format = {
    table: function(columns, hooks) {
      var table = $('<table>'),
          row = hooks.row(columns, -1);
      table.append('<thead>').append(row[0]);
      $.each(columns, function(index, column) { row[1].append(hooks.cell(column, index)); });
      return [table, $('<tbody>').appendTo(table)];
    },
    row: function(value, index) {
      var row = $('<tr>')
      return [row, row];
    },
    cell: function(value, index, key) {
      return $(key == undefined ? '<th>' : '<td>').text(value);
    }
  };
  
  $.fn.table = function(data, columns, hooks) {
    
    if (!hooks) hooks = format;
    else for (var type in format)
      if (typeof hooks[type] != 'function')
        hooks[type] = format[type];
    
    var table = hooks.table(columns, hooks);
    this.append(table[0]);
    
    var node = new Node(table[1], [], null, function(parent, value, index) {
    
      var table = parent.element,
          row = hooks.row(value, index);
      if (index) table.contents().eq(index-1).after(row[0]);
      else table.prepend(row[0]);
      parent.value.splice(index, 0, value);
      
      return new Node(row[1], {}, parent, function(parent, value, index) {
      
        var row = parent.element,
            cell = hooks.cell(value, index, columns[index]);
        if (index) row.contents().eq(index-1).after(cell);
        else row.prepend(cell);
        return parent.value[columns[index]] = value;
        
      }, function(previous, index) {
      
        previous.element.remove();
        delete previous.parent.value[columns[index]];
        
      }).insertAll(columns.map(function(column) { return value[column]; }));
      
    }, function(previous, index) {
    
      previous.element.remove();
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
})(jQuery);

