var smokedb = (function () {
  var main = null;
  var modules = {
      "require": {
          factory: undefined,
          dependencies: [],
          exports: function (args, callback) { return require(args, callback); },
          resolved: true
      }
  };
  function define(id, dependencies, factory) {
      return main = modules[id] = {
          dependencies: dependencies,
          factory: factory,
          exports: {},
          resolved: false
      };
  }
  function resolve(definition) {
      if (definition.resolved === true)
          return;
      definition.resolved = true;
      var dependencies = definition.dependencies.map(function (id) {
          return (id === "exports")
              ? definition.exports
              : (function () {
                  if(modules[id] !== undefined) {
                    resolve(modules[id]);
                    return modules[id].exports;
                  } else return require(id)
              })();
      });
      definition.factory.apply(null, dependencies);
  }
  function collect() {
      Object.keys(modules).map(function (key) { return modules[key]; }).forEach(resolve);
      return (main !== null) 
        ? main.exports
        : undefined
  }

  var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
      return new (P || (P = Promise))(function (resolve, reject) {
          function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
          function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
          function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
          step((generator = generator.apply(thisArg, _arguments || [])).next());
      });
  };
  var __generator = (this && this.__generator) || function (thisArg, body) {
      var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t;
      return { next: verb(0), "throw": verb(1), "return": verb(2) };
      function verb(n) { return function (v) { return step([n, v]); }; }
      function step(op) {
          if (f) throw new TypeError("Generator is already executing.");
          while (_) try {
              if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
              if (y = 0, t) op = [0, t.value];
              switch (op[0]) {
                  case 0: case 1: t = op; break;
                  case 4: _.label++; return { value: op[1], done: false };
                  case 5: _.label++; y = op[1]; op = [0]; continue;
                  case 7: op = _.ops.pop(); _.trys.pop(); continue;
                  default:
                      if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                      if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                      if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                      if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                      if (t[2]) _.ops.pop();
                      _.trys.pop(); continue;
              }
              op = body.call(thisArg, _);
          } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
          if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
      }
  };
  define("src/system/database", ["require", "exports"], function (require, exports) {
      "use strict";
      exports.indexedDBFactory = function () {
          var host = window;
          return host.indexedDB
              || host.mozIndexedDB
              || host.webkitIndexedDB
              || host.msIndexedDB
              || host.shimIndexedDB;
      };
      function databaseOpen(schema) {
          return new Promise(function (resolve, reject) {
              var factory = exports.indexedDBFactory();
              var request = factory.open(schema.name, schema.version);
              request.addEventListener("error", function () { return reject(request.error); });
              request.addEventListener("success", function () { return resolve(request.result); });
              request.addEventListener("upgradeneeded", function () {
                  var database = request.result;
                  schema.stores.forEach(function (store) {
                      if (database.objectStoreNames.contains(store))
                          return;
                      var objectStore = database.createObjectStore(store, { autoIncrement: true });
                  });
              });
          });
      }
      exports.databaseOpen = databaseOpen;
      function databaseDelete(name) {
          return new Promise(function (resolve, reject) {
              var factory = exports.indexedDBFactory();
              var request = factory.deleteDatabase(name);
              request.addEventListener("error", function () { return reject(request.error); });
              request.addEventListener("success", function () { return resolve(request.result); });
          });
      }
      exports.databaseDelete = databaseDelete;
  });
  define("src/query", ["require", "exports"], function (require, exports) {
      "use strict";
      var SourceContext = (function () {
          function SourceContext(_next, _error, _end) {
              this._next = _next;
              this._error = _error;
              this._end = _end;
              this._done = false;
          }
          SourceContext.prototype.next = function (value) {
              if (this._done === false) {
                  this._next(value);
              }
          };
          SourceContext.prototype.error = function (value) {
              if (this._done === false) {
                  this._done = true;
                  this._error(value);
                  this._end();
              }
          };
          SourceContext.prototype.end = function () {
              if (this._done === false) {
                  this._done = true;
                  this._end();
              }
          };
          return SourceContext;
      }());
      exports.SourceContext = SourceContext;
      var Source = (function () {
          function Source(func) {
              this.func = func;
          }
          Source.prototype.read = function (func) {
              var context = new SourceContext(function (value) { return func({ type: "value", value: value }); }, function (error) { return func({ type: "error", error: error }); }, function () { return func({ type: "end" }); });
              this.func(context);
          };
          return Source;
      }());
      exports.Source = Source;
      var Queryable = (function () {
          function Queryable(source) {
              this.source = source;
          }
          Queryable.prototype.aggregate = function (func, initial) {
              var _this = this;
              return new Promise(function (resolve, reject) {
                  var index = 0;
                  _this.source.read(function (element) {
                      switch (element.type) {
                          case "value":
                              initial = func(initial, element.value, index);
                              index += 1;
                              break;
                          case "error":
                              reject(element.error);
                          case "end":
                              resolve(initial);
                              break;
                      }
                  });
              });
          };
          Queryable.prototype.all = function (func) {
              var _this = this;
              return new Promise(function (resolve, reject) {
                  var index = 0;
                  _this.source.read(function (element) {
                      switch (element.type) {
                          case "value":
                              if (func(element.value, index) === false) {
                                  resolve(false);
                              }
                              index += 1;
                              break;
                          case "error":
                              reject(element.error);
                          case "end":
                              resolve(true);
                              break;
                      }
                  });
              });
          };
          Queryable.prototype.any = function (func) {
              var _this = this;
              return new Promise(function (resolve, reject) {
                  var index = 0;
                  _this.source.read(function (element) {
                      switch (element.type) {
                          case "value":
                              if (func(element.value, index) === true) {
                                  resolve(true);
                              }
                              index += 1;
                              break;
                          case "error":
                              reject(element.error);
                          case "end":
                              resolve(false);
                              break;
                      }
                  });
              });
          };
          Queryable.prototype.average = function (func) {
              var _this = this;
              return new Promise(function (resolve, reject) {
                  var index = 0;
                  var acc = 0;
                  _this.source.read(function (element) {
                      switch (element.type) {
                          case "value":
                              acc += func(element.value, index);
                              index += 1;
                              break;
                          case "error":
                              reject(element.error);
                          case "end":
                              resolve((index > 0) ? acc / index : 0);
                              break;
                      }
                  });
              });
          };
          Queryable.prototype.cast = function () {
              var _this = this;
              return new Queryable(new Source(function (context) {
                  _this.source.read(function (element) {
                      switch (element.type) {
                          case "value":
                              context.next(element.value);
                              break;
                          case "error":
                              context.error(element.error);
                          case "end":
                              context.end();
                              break;
                      }
                  });
              }));
          };
          Queryable.prototype.concat = function (queryable) {
              var _this = this;
              return new Queryable(new Source(function (context) {
                  _this.source.read(function (element) {
                      switch (element.type) {
                          case "value":
                              context.next(element.value);
                              break;
                          case "error":
                              context.error(element.error);
                          case "end":
                              queryable.source.read(function (element) {
                                  switch (element.type) {
                                      case "value":
                                          context.next(element.value);
                                          break;
                                      case "error":
                                          context.error(element.error);
                                      case "end":
                                          context.end();
                                          break;
                                  }
                              });
                              break;
                      }
                  });
              }));
          };
          Queryable.prototype.count = function () {
              var _this = this;
              return new Promise(function (resolve, reject) {
                  var count = 0;
                  _this.source.read(function (element) {
                      switch (element.type) {
                          case "value":
                              count += 1;
                              break;
                          case "error":
                              reject(element.error);
                          case "end":
                              resolve(count);
                              break;
                      }
                  });
              });
          };
          Queryable.prototype.distinct = function () {
              var _this = this;
              return new Queryable(new Source(function (context) {
                  var acc = new Array();
                  _this.source.read(function (element) {
                      switch (element.type) {
                          case "value":
                              if (acc.indexOf(element.value) === -1) {
                                  acc.push(element.value);
                                  context.next(element.value);
                              }
                              break;
                          case "error":
                              context.error(element.error);
                          case "end":
                              acc = [];
                              context.end();
                              break;
                      }
                  });
              }));
          };
          Queryable.prototype.elementAt = function (index) {
              var _this = this;
              return new Promise(function (resolve, reject) {
                  var index0 = 0;
                  _this.source.read(function (element) {
                      switch (element.type) {
                          case "value":
                              index0 += 1;
                              if (index0 === index) {
                                  resolve(element.value);
                              }
                              break;
                          case "error":
                              reject(element.error);
                          case "end":
                              reject("no element at [" + index + "]");
                              break;
                      }
                  });
              });
          };
          Queryable.prototype.elementAtOrDefault = function (index) {
              var _this = this;
              return new Promise(function (resolve, reject) {
                  var index0 = 0;
                  _this.source.read(function (element) {
                      switch (element.type) {
                          case "value":
                              index0 += 1;
                              if (index0 === index) {
                                  resolve(element.value);
                              }
                              break;
                          case "error":
                              reject(element.error);
                          case "end":
                              resolve(undefined);
                              break;
                      }
                  });
              });
          };
          Queryable.prototype.first = function () {
              var _this = this;
              return new Promise(function (resolve, reject) {
                  var done = false;
                  _this.source.read(function (element) {
                      switch (element.type) {
                          case "value":
                              if (done === false) {
                                  done = true;
                                  resolve(element.value);
                              }
                              break;
                          case "error":
                              reject(element.error);
                          case "end":
                              if (done === false) {
                                  done = true;
                                  reject("no elements in sequence");
                              }
                              break;
                      }
                  });
              });
          };
          Queryable.prototype.firstOrDefault = function () {
              var _this = this;
              return new Promise(function (resolve, reject) {
                  var done = false;
                  _this.source.read(function (element) {
                      switch (element.type) {
                          case "value":
                              if (done === false) {
                                  done = true;
                                  resolve(element.value);
                              }
                              break;
                          case "error":
                              reject(element.error);
                          case "end":
                              if (done === false) {
                                  done = true;
                                  resolve(undefined);
                              }
                              break;
                      }
                  });
              });
          };
          Queryable.prototype.intersect = function (queryable) {
              var _this = this;
              return new Queryable(new Source(function (context) {
                  _this.collect().then(function (buffer) {
                      queryable.source.read(function (element) {
                          switch (element.type) {
                              case "value":
                                  if (buffer.indexOf(element.value) !== -1) {
                                      context.next(element.value);
                                  }
                                  break;
                              case "error":
                                  context.error(element.error);
                              case "end":
                                  context.end();
                                  break;
                          }
                      });
                  })["catch"](function (error) { return context.error(error); });
              }));
          };
          Queryable.prototype.last = function () {
              var _this = this;
              return new Promise(function (resolve, reject) {
                  var current = undefined;
                  _this.source.read(function (element) {
                      switch (element.type) {
                          case "value":
                              current = element.value;
                              break;
                          case "error":
                              reject(element.error);
                          case "end":
                              if (current === undefined) {
                                  reject("no elements in sequence");
                              }
                              else {
                                  resolve(current);
                              }
                              break;
                      }
                  });
              });
          };
          Queryable.prototype.lastOrDefault = function () {
              var _this = this;
              return new Promise(function (resolve, reject) {
                  var current = undefined;
                  _this.source.read(function (element) {
                      switch (element.type) {
                          case "value":
                              current = element.value;
                              break;
                          case "error":
                              reject(element.error);
                          case "end":
                              resolve(current);
                              break;
                      }
                  });
              });
          };
          Queryable.prototype.orderBy = function (func) {
              var _this = this;
              return new Queryable(new Source(function (context) {
                  _this.collect().then(function (buffer) {
                      var sorted = buffer.sort(function (a, b) {
                          var left = func(a);
                          var right = func(b);
                          return +(left > right) || +(left === right) - 1;
                      });
                      while (sorted.length > 0) {
                          context.next(sorted.shift());
                      }
                      context.end();
                  })["catch"](function (error) { return context.error(error); });
              }));
          };
          Queryable.prototype.orderByDescending = function (func) {
              var _this = this;
              return new Queryable(new Source(function (context) {
                  _this.collect().then(function (buffer) {
                      var sorted = buffer.sort(function (a, b) {
                          var left = func(a);
                          var right = func(b);
                          return +(left < right) || +(left === right) - 1;
                      });
                      while (sorted.length > 0) {
                          context.next(sorted.shift());
                      }
                      context.end();
                  })["catch"](function (error) { return context.error(error); });
              }));
          };
          Queryable.prototype.reverse = function () {
              var _this = this;
              return new Queryable(new Source(function (context) {
                  _this.collect().then(function (buffer) {
                      var reversed = buffer.reverse();
                      while (reversed.length > 0) {
                          context.next(reversed.shift());
                      }
                      context.end();
                  })["catch"](function (error) { return context.error(error); });
              }));
          };
          Queryable.prototype.select = function (func) {
              var _this = this;
              return new Queryable(new Source(function (context) {
                  var index = 0;
                  _this.source.read(function (element) {
                      switch (element.type) {
                          case "value":
                              context.next(func(element.value, index));
                              index += 1;
                              break;
                          case "error":
                              context.error(element.error);
                          case "end":
                              context.end();
                              break;
                      }
                  });
              }));
          };
          Queryable.prototype.selectMany = function (func) {
              var _this = this;
              return new Queryable(new Source(function (context) {
                  var index = 0;
                  _this.source.read(function (element) {
                      switch (element.type) {
                          case "value":
                              func(element.value, index).forEach(function (value) {
                                  return context.next(value);
                              });
                              index += 1;
                              break;
                          case "error":
                              context.error(element.error);
                          case "end":
                              context.end();
                              break;
                      }
                  });
              }));
          };
          Queryable.prototype.single = function (func) {
              var _this = this;
              return new Promise(function (resolve, reject) {
                  var index = 0;
                  var elem = undefined;
                  _this.source.read(function (element) {
                      switch (element.type) {
                          case "value":
                              if (func(element.value, index) === true) {
                                  if (elem === undefined) {
                                      elem = element.value;
                                  }
                                  else {
                                      reject("found multiple elements in this sequence.");
                                  }
                              }
                              index += 1;
                              break;
                          case "error":
                              reject(element.error);
                          case "end":
                              if (elem === undefined) {
                                  reject("unable to locate element with the given critera.");
                              }
                              else {
                                  resolve(elem);
                              }
                              break;
                      }
                  });
              });
          };
          Queryable.prototype.singleOrDefault = function (func) {
              var _this = this;
              return new Promise(function (resolve, reject) {
                  var index = 0;
                  var elem = undefined;
                  _this.source.read(function (element) {
                      switch (element.type) {
                          case "value":
                              if (func(element.value, index) === true) {
                                  if (elem === undefined) {
                                      elem = element.value;
                                  }
                                  else {
                                      reject("found multiple elements in this sequence.");
                                  }
                              }
                              index += 1;
                              break;
                          case "error":
                              reject(element.error);
                          case "end":
                              resolve(elem);
                              break;
                      }
                  });
              });
          };
          Queryable.prototype.skip = function (count) {
              var _this = this;
              return new Queryable(new Source(function (context) {
                  var index = 0;
                  _this.source.read(function (element) {
                      switch (element.type) {
                          case "value":
                              if (index >= count) {
                                  context.next(element.value);
                              }
                              index += 1;
                              break;
                          case "error":
                              context.error(element.error);
                          case "end":
                              context.end();
                              break;
                      }
                  });
              }));
          };
          Queryable.prototype.sum = function (func) {
              var _this = this;
              return new Promise(function (resolve, reject) {
                  var index = 0;
                  var acc = 0;
                  _this.source.read(function (element) {
                      switch (element.type) {
                          case "value":
                              acc += func(element.value, index);
                              index += 1;
                              break;
                          case "error":
                              reject(element.error);
                          case "end":
                              resolve(acc);
                              break;
                      }
                  });
              });
          };
          Queryable.prototype.take = function (count) {
              var _this = this;
              return new Queryable(new Source(function (context) {
                  var index = 0;
                  _this.source.read(function (element) {
                      switch (element.type) {
                          case "value":
                              if (index < count) {
                                  context.next(element.value);
                              }
                              index += 1;
                              break;
                          case "error":
                              context.error(element.error);
                              break;
                          case "end":
                              context.end();
                              break;
                      }
                  });
              }));
          };
          Queryable.prototype.where = function (func) {
              var _this = this;
              return new Queryable(new Source(function (context) {
                  var index = 0;
                  _this.source.read(function (element) {
                      switch (element.type) {
                          case "value":
                              if (func(element.value, index) === true) {
                                  context.next(element.value);
                              }
                              index += 1;
                              break;
                          case "error":
                              context.error(element.error);
                              break;
                          case "end":
                              context.end();
                              break;
                      }
                  });
              }));
          };
          Queryable.prototype.each = function (func) {
              var _this = this;
              return new Promise(function (resolve, reject) {
                  var index = 0;
                  _this.source.read(function (element) {
                      switch (element.type) {
                          case "value":
                              func(element.value, index);
                              index += 1;
                              break;
                          case "error":
                              reject(element.error);
                              break;
                          case "end":
                              resolve(undefined);
                              break;
                      }
                  });
              });
          };
          Queryable.prototype.collect = function () {
              var _this = this;
              return new Promise(function (resolve, reject) {
                  var buffer = new Array();
                  _this.source.read(function (element) {
                      switch (element.type) {
                          case "value":
                              buffer.push(element.value);
                              break;
                          case "error":
                              reject(element.error);
                              break;
                          case "end":
                              resolve(buffer);
                              break;
                      }
                  });
              });
          };
          Queryable.fromArray = function (array) {
              return new Queryable(new Source(function (context) {
                  array.forEach(function (value) { return context.next(value); });
                  context.end();
              }));
          };
          Queryable.range = function (from, to) {
              return new Queryable(new Source(function (context) {
                  for (var i = from; i < to; i++) {
                      context.next(i);
                  }
                  context.end();
              }));
          };
          return Queryable;
      }());
      exports.Queryable = Queryable;
  });
  define("src/system/records", ["require", "exports"], function (require, exports) {
      "use strict";
      function insertMany(database, store, records) {
          return __awaiter(this, void 0, void 0, function () {
              return __generator(this, function (_a) {
                  return [2 /*return*/, new Promise(function (resolve, reject) {
                          var transaction = database.transaction(store, "readwrite");
                          transaction.addEventListener("complete", function () { return resolve(); });
                          transaction.addEventListener("error", function () { return reject(transaction.error); });
                          var objectStore = transaction.objectStore(store);
                          records.forEach(function (record) { return objectStore.add(record); });
                      })];
              });
          });
      }
      exports.insertMany = insertMany;
      function updateMany(database, store, records) {
          return new Promise(function (resolve, reject) {
              var done = false;
              var transaction = database.transaction(store, 'readwrite');
              transaction.addEventListener("error", function () { return reject(transaction.error); });
              transaction.addEventListener("complete", function () { return resolve(); });
              var objectStore = transaction.objectStore(store);
              var cursorRequest = objectStore.openCursor();
              cursorRequest.addEventListener("error", function () { return reject(transaction.error); });
              cursorRequest.addEventListener("success", function (event) {
                  var cursor = event.target.result;
                  if (cursor !== null) {
                      for (var i = 0; i < records.length; i++) {
                          if (records[i].key === cursor.key) {
                              cursor.update(records[i].value);
                              break;
                          }
                      }
                      cursor["continue"]();
                  }
              });
          });
      }
      exports.updateMany = updateMany;
      function deleteMany(database, store, records) {
          return new Promise(function (resolve, reject) {
              var transaction = database.transaction(store, 'readwrite');
              transaction.addEventListener("complete", function () { return resolve(); });
              transaction.addEventListener("error", function () { return reject(transaction.error); });
              var objectStore = transaction.objectStore(store);
              records.forEach(function (record) { return objectStore["delete"](record.key); });
          });
      }
      exports.deleteMany = deleteMany;
      function scanAll(database, store_name, func) {
          return new Promise(function (resolve, reject) {
              var done = false;
              var transaction = database.transaction([store_name], 'readonly');
              transaction.addEventListener("error", function () { return reject(transaction.error); });
              transaction.addEventListener("complete", function () { return resolve(); });
              var store = transaction.objectStore(store_name);
              var cursorRequest = store.openCursor();
              cursorRequest.addEventListener("error", function () {
                  if (done === false) {
                      func({ type: "error", error: cursorRequest.error });
                      func({ type: "end" });
                      reject(cursorRequest.error);
                      done = true;
                  }
              });
              cursorRequest.addEventListener("success", function (event) {
                  if (done === false) {
                      var cursor = event.target.result;
                      if (cursor) {
                          var record = cursor.value;
                          func({
                              type: "data",
                              data: {
                                  key: cursor.key,
                                  value: cursor.value
                              }
                          });
                          cursor["continue"]();
                      }
                      else {
                          func({ type: "end" });
                          done = true;
                      }
                  }
              });
          });
      }
      exports.scanAll = scanAll;
  });
  define("src/store", ["require", "exports", "src/system/records", "src/query"], function (require, exports, records_1, query_1) {
      "use strict";
      var Store = (function () {
          function Store(database, name) {
              this.database = database;
              this.name = name;
              this.inserts = new Array();
              this.updates = new Array();
              this.deletes = new Array();
          }
          Store.prototype.insert = function (record) {
              this.inserts.push(record);
              return this;
          };
          Store.prototype.update = function (record) {
              this.updates.push(record);
              return this;
          };
          Store.prototype["delete"] = function (record) {
              this.deletes.push(record);
              return this;
          };
          Store.prototype.submit = function () {
              return __awaiter(this, void 0, void 0, function () {
                  var db;
                  return __generator(this, function (_a) {
                      switch (_a.label) {
                          case 0: return [4 /*yield*/, this.database.db()];
                          case 1:
                              db = _a.sent();
                              return [4 /*yield*/, records_1.insertMany(db, this.name, this.inserts)];
                          case 2:
                              _a.sent();
                              return [4 /*yield*/, records_1.updateMany(db, this.name, this.updates)];
                          case 3:
                              _a.sent();
                              return [4 /*yield*/, records_1.deleteMany(db, this.name, this.deletes)];
                          case 4:
                              _a.sent();
                              this.inserts = [];
                              this.updates = [];
                              this.deletes = [];
                              return [2 /*return*/];
                      }
                  });
              });
          };
          Store.prototype.source = function () {
              var _this = this;
              return new query_1.Source(function (context) {
                  _this.database.db().then(function (db) {
                      records_1.scanAll(db, _this.name, function (element) {
                          switch (element.type) {
                              case "data":
                                  context.next(element.data);
                                  break;
                              case "error":
                                  context.error(element.error);
                                  break;
                              case "end":
                                  context.end();
                                  break;
                          }
                      });
                  });
              });
          };
          Store.prototype.aggregate = function (func, initial) {
              return new query_1.Queryable(this.source()).aggregate(func, initial);
          };
          Store.prototype.all = function (func) {
              return new query_1.Queryable(this.source()).all(func);
          };
          Store.prototype.any = function (func) {
              return new query_1.Queryable(this.source()).any(func);
          };
          Store.prototype.average = function (func) {
              return new query_1.Queryable(this.source()).average(func);
          };
          Store.prototype.cast = function () {
              return new query_1.Queryable(this.source()).cast();
          };
          Store.prototype.concat = function (queryable) {
              return new query_1.Queryable(this.source()).concat(queryable);
          };
          Store.prototype.count = function () {
              return new query_1.Queryable(this.source()).count();
          };
          Store.prototype.distinct = function () {
              return new query_1.Queryable(this.source()).distinct();
          };
          Store.prototype.elementAt = function (index) {
              return new query_1.Queryable(this.source()).elementAt(index);
          };
          Store.prototype.elementAtOrDefault = function (index) {
              return new query_1.Queryable(this.source()).elementAtOrDefault(index);
          };
          Store.prototype.first = function () {
              return new query_1.Queryable(this.source()).first();
          };
          Store.prototype.firstOrDefault = function () {
              return new query_1.Queryable(this.source()).firstOrDefault();
          };
          Store.prototype.intersect = function (queryable) {
              return new query_1.Queryable(this.source()).intersect(queryable);
          };
          Store.prototype.last = function () {
              return new query_1.Queryable(this.source()).last();
          };
          Store.prototype.lastOrDefault = function () {
              return new query_1.Queryable(this.source()).lastOrDefault();
          };
          Store.prototype.orderBy = function (func) {
              return new query_1.Queryable(this.source()).orderBy(func);
          };
          Store.prototype.orderByDescending = function (func) {
              return new query_1.Queryable(this.source()).orderByDescending(func);
          };
          Store.prototype.reverse = function () {
              return new query_1.Queryable(this.source()).reverse();
          };
          Store.prototype.select = function (func) {
              return new query_1.Queryable(this.source()).select(func);
          };
          Store.prototype.selectMany = function (func) {
              return new query_1.Queryable(this.source()).selectMany(func);
          };
          Store.prototype.single = function (func) {
              return new query_1.Queryable(this.source()).single(func);
          };
          Store.prototype.singleOrDefault = function (func) {
              return new query_1.Queryable(this.source()).singleOrDefault(func);
          };
          Store.prototype.skip = function (count) {
              return new query_1.Queryable(this.source()).skip(count);
          };
          Store.prototype.sum = function (func) {
              return new query_1.Queryable(this.source()).sum(func);
          };
          Store.prototype.take = function (count) {
              return new query_1.Queryable(this.source()).take(count);
          };
          Store.prototype.where = function (func) {
              return new query_1.Queryable(this.source()).where(func);
          };
          Store.prototype.each = function (func) {
              return new query_1.Queryable(this.source()).each(func);
          };
          Store.prototype.collect = function () {
              return new query_1.Queryable(this.source()).collect();
          };
          return Store;
      }());
      exports.Store = Store;
  });
  define("src/database", ["require", "exports", "src/system/database", "src/store"], function (require, exports, database_1, store_1) {
      "use strict";
      var Database = (function () {
          function Database(schema) {
              var _this = this;
              this._db = undefined;
              this._schema = schema;
              this._stores = {};
              this._schema.stores.forEach(function (name) {
                  return _this._stores[name] = new store_1.Store(_this, name);
              });
          }
          Database.prototype.store = function (name) {
              return this._stores[name];
          };
          Database.prototype.schema = function () {
              return this._schema;
          };
          Database.prototype.submit = function () {
              return __awaiter(this, void 0, void 0, function () {
                  var _a, _b, _i, n;
                  return __generator(this, function (_c) {
                      switch (_c.label) {
                          case 0:
                              _a = [];
                              for (_b in this._stores)
                                  _a.push(_b);
                              _i = 0;
                              _c.label = 1;
                          case 1:
                              if (!(_i < _a.length)) return [3 /*break*/, 4];
                              n = _a[_i];
                              return [4 /*yield*/, this._stores[n].submit()];
                          case 2:
                              _c.sent();
                              _c.label = 3;
                          case 3:
                              _i++;
                              return [3 /*break*/, 1];
                          case 4: return [2 /*return*/];
                      }
                  });
              });
          };
          Database.prototype.db = function () {
              var _this = this;
              return (this._db !== undefined)
                  ? Promise.resolve(this._db)
                  : database_1.databaseOpen(this._schema).then(function (db) {
                      _this._db = db;
                      return db;
                  });
          };
          Database["delete"] = function (name) {
              return database_1.databaseDelete(name);
          };
          return Database;
      }());
      exports.Database = Database;
  });
  define("src/index", ["require", "exports", "src/database"], function (require, exports, database_2) {
      "use strict";
      exports.Database = database_2.Database;
  });
  define("test/index", ["require", "exports", "src/index"], function (require, exports, index_1) {
      "use strict";
      var database = new index_1.Database({
          name: "db0",
          version: 3,
          stores: ["customers"]
      });
      function deleteAll() {
          return __awaiter(this, void 0, void 0, function () {
              var store, records;
              return __generator(this, function (_a) {
                  switch (_a.label) {
                      case 0:
                          store = database.store("customers");
                          return [4 /*yield*/, store.collect()];
                      case 1:
                          records = _a.sent();
                          records.forEach(function (record) { return store["delete"](record); });
                          return [4 /*yield*/, database.submit()];
                      case 2:
                          _a.sent();
                          return [2 /*return*/];
                  }
              });
          });
      }
      function insert(count) {
          return __awaiter(this, void 0, void 0, function () {
              var store, i;
              return __generator(this, function (_a) {
                  switch (_a.label) {
                      case 0:
                          store = database.store("customers");
                          for (i = 0; i < count; i++) {
                              store.insert({ firstname: "dave", lastname: "smith", value: i });
                          }
                          return [4 /*yield*/, database.submit()];
                      case 1:
                          _a.sent();
                          return [2 /*return*/];
                  }
              });
          });
      }
      function listAll() {
          return __awaiter(this, void 0, void 0, function () {
              var store, records;
              return __generator(this, function (_a) {
                  switch (_a.label) {
                      case 0:
                          store = database.store("customers");
                          return [4 /*yield*/, store.orderBy(function (n) { return n.key; }).collect()];
                      case 1:
                          records = _a.sent();
                          records.forEach(function (record) {
                              console.log(record);
                          });
                          return [2 /*return*/];
                  }
              });
          });
      }
      function updateFirst() {
          return __awaiter(this, void 0, void 0, function () {
              var store, record;
              return __generator(this, function (_a) {
                  switch (_a.label) {
                      case 0:
                          store = database.store("customers");
                          return [4 /*yield*/, store.orderBy(function (n) { return n.value.value; }).first()];
                      case 1:
                          record = _a.sent();
                          record.value.firstname = "roger";
                          store.update(record);
                          return [4 /*yield*/, database.submit()];
                      case 2:
                          _a.sent();
                          return [2 /*return*/];
                  }
              });
          });
      }
      function updateAll() {
          return __awaiter(this, void 0, void 0, function () {
              var store, records;
              return __generator(this, function (_a) {
                  switch (_a.label) {
                      case 0:
                          store = database.store("customers");
                          return [4 /*yield*/, store.orderBy(function (n) { return n.value.value; }).collect()];
                      case 1:
                          records = _a.sent();
                          records.forEach(function (record) {
                              record.value.firstname = "roger";
                              store.update(record);
                          });
                          return [4 /*yield*/, database.submit()];
                      case 2:
                          _a.sent();
                          return [2 /*return*/];
                  }
              });
          });
      }
      function updateAsBlob() {
          return __awaiter(this, void 0, void 0, function () {
              var createBlob, store, records;
              return __generator(this, function (_a) {
                  switch (_a.label) {
                      case 0:
                          createBlob = function (size) {
                              var buf = new Array(size);
                              for (var i = 0; i < size; i++) {
                                  buf[i] = "0";
                              }
                              return new Blob([buf.join("")], { type: "text/plain" });
                          };
                          store = database.store("customers");
                          return [4 /*yield*/, store.orderBy(function (n) { return n.key; }).collect()];
                      case 1:
                          records = _a.sent();
                          records.forEach(function (record) {
                              record.value = createBlob(1024);
                              store.update(record);
                          });
                          return [4 /*yield*/, database.submit()];
                      case 2:
                          _a.sent();
                          return [2 /*return*/];
                  }
              });
          });
      }
      function readFirstAsBlob() {
          return __awaiter(this, void 0, void 0, function () {
              var store, record, reader;
              return __generator(this, function (_a) {
                  switch (_a.label) {
                      case 0:
                          store = database.store("customers");
                          return [4 /*yield*/, store.orderBy(function (n) { return n.key; }).first()];
                      case 1:
                          record = _a.sent();
                          reader = new FileReader();
                          reader.addEventListener("loadend", function () {
                              console.log(reader.result);
                          });
                          reader.readAsText(record.value, "utf8");
                          return [2 /*return*/];
                  }
              });
          });
      }
      function test() {
          return __awaiter(this, void 0, void 0, function () {
              var store, _a, _b, _c;
              return __generator(this, function (_d) {
                  switch (_d.label) {
                      case 0:
                          store = database.store("customers");
                          return [4 /*yield*/, deleteAll()];
                      case 1:
                          _d.sent();
                          return [4 /*yield*/, insert(100)];
                      case 2:
                          _d.sent();
                          return [4 /*yield*/, updateAll()];
                      case 3:
                          _d.sent();
                          return [4 /*yield*/, updateAsBlob()];
                      case 4:
                          _d.sent();
                          return [4 /*yield*/, readFirstAsBlob()];
                      case 5:
                          _d.sent();
                          return [4 /*yield*/, listAll()];
                      case 6:
                          _d.sent();
                          _b = (_a = console).log;
                          return [4 /*yield*/, store.count()];
                      case 7:
                          _b.apply(_a, [_d.sent()]);
                          console.log("done");
                          return [2 /*return*/];
                  }
              });
          });
      }
      test();
  });
  
  return collect(); 
})();