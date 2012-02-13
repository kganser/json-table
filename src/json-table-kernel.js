kernel.add("table", function() {

  var Node = function(element, value, parent, insert, remove) {
    var children = [], self = this;
    if (!insert) insert = function() {};
    if (!remove) remove = function() {};
    
    this.parent = function() { return parent; };
    this.element = function() { return element; };
    this.value = function() { return value; };
    this.get = function(index) { return children[index]; };
    this.insert = function(value, index) {
      if (typeof index != "number") index = children.length;
      children.splice(index, 0, insert(self, value, index));
      return self;
    };
    this.insertAll = function(values, index) {
      if (typeof index != "number") index = children.length;
      values.forEach(function(value, i) { self.insert(value, index+i); });
      return self;
    };
    this.remove = function(index) {
      var removed = children.splice(index, 1);
      if (removed[0]) remove(removed[0], index); 
      return self;
    };
    this.replace = function(value, index) {
      return self.remove(index).insert(value, index);
    };
    this.sort = function(compare) {
      var sorted = children.map(function(child) { return child; }).sort(compare);
      children.forEach(function(child, index) {
        if (child != sorted[index])
          self.replace(sorted[index].value(), index);
      });
      return self;
    };
  };
  
  var create = function(tag) { return document.createElement(tag); };
  var format = {
    table: function(element, columns, hooks) {
      var table = create("table");
      var head = table.appendChild(create("thead")).appendChild(hooks.row(columns, -1));
      columns.forEach(function(column, index) { head.appendChild(hooks.cell(column, index)); });
      return element.appendChild(table).appendChild(create("tbody"));
    },
    row: function(value, index) {
      return create("tr");
    },
    cell: function(value, index, key) {
      var td = create(key == undefined ? "th" : "td");
      td.innerHTML = value;
      return td;
    }
  };

  return function(element, data, columns, hooks) {
    
    if (!hooks) hooks = format;
    for (var type in format)
      if (typeof hooks[type] != "function")
        hooks[type] = format[type];
    
    var body = new Node(hooks.table(element, columns, hooks), [], null, function(parent, value, index) {
    
      var tbody = parent.element();
      var tr = tbody.insertBefore(hooks.row(value, index), tbody.childNodes[index]);
      parent.value().splice(index, 0, value);
      
      return new Node(tr, {}, parent, function(parent, value, index) {
        var tr = parent.element();
        tr.insertBefore(hooks.cell(value, index, columns[index]), tr.childNodes[index]);
        return parent.value()[columns[index]] = value;
      }, function(previous, index) {
        previous.parent().element().removeChild(previous.element());
        delete previous.parent().value()[columns[index]];
      }).insertAll(columns.map(function(column) { return value[column]; }));
      
    }, function(previous, index) {
      
      previous.parent().element().removeChild(previous.element());
      previous.parent().value().splice(index, 1);
      
    }).insertAll(data);
    
    return {
      get: function(row, column) {
        if (row == undefined) return body.value();
        if (column == undefined) return body.get(row).value();
        return body.get(row).get(column);
      },
      remove: body.remove,
      sort: function(comparator) {
        return body.sort(function(a, b) {
          return comparator(a.value(), b.value());
        });
      },
      insert: body.insert,
      insertAll: body.insertAll
    };
  };
});

