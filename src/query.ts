/*--------------------------------------------------------------------------

 smoke-db - Abstraction over indexeddb with LINQ style data queries and projection.

 The MIT License (MIT)

 Copyright (c) 2017 Haydn Paterson (sinclair) <haydn.developer@gmail.com>

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 
---------------------------------------------------------------------------*/

export interface IQueryable<T> {
  /**
   * Applies an accumulator function over a sequence.
   * @param {(acc: U, current: T, index?: number): U} func the aggregate function.
   * @returns {Promise<U>}
   */
  aggregate<U>(func: (acc: U, value: T, index: number) => U, initial: U): Promise<U>
  /**
   * Determines whether all the elements of a sequence satisfy a condition.
   * @param {(value: T): boolean} func the all function.
   * @returns {Promise<boolean>}
   */
  all(func: (value: T, index: number) => boolean): Promise<boolean>
  /**
   * Determines whether a sequence contains any elements that meet this criteria.
   * @param {(value: T): boolean} func the any function.
   * @returns {Promise<boolean>}
   */
  any(func: (value: T, index: number) => boolean): Promise<boolean> 
  /**
   * Computes the average of a sequence of numeric values.
   * @param {(value:T): number} func the average function.
   * @returns {Promise<number>}
   */
  average(func: (value: T, index: number) => number): Promise<number> 
  /**
   * preforms a type cast from the source type T to U. Only useful to typescript.
   * @returns {IQueryable<U>}
   */
  cast<U>(): IQueryable<U> 
  /**
   * Concatenates two queryable sequences returning a new queryable that enumerates the first, then the second.
   * @param {Queryable<T>} queryable the queryable to concat.
   * @returns {Queryable<T>}
   */
  concat(queryable: IQueryable<T>): IQueryable<T> 
  /**
   * Returns the number of elements in a sequence.
   * @returns Promise<number>
   */
  count(): Promise<number> 
  /**
   * Returns distinct elements from a sequence by using the default equality comparer to compare values.
   * @returns {IQueryable<T>}
   */
  distinct(): IQueryable<T> 
  /**
   * Returns the element at the specified index, if no element exists, reject.
   * @param {number} index the element index.
   * @returns {Promise<T>}
   */
  elementAt(index: number): Promise<T> 
  /**
   * Returns the element at the specified index, if no element exists, resolve undefined.
   * @param {number} index the element index.
   * @returns {Promise<T>}
   */
  elementAtOrDefault(index: number): Promise<T> 
  /**
   * Returns the first element. if no element exists, reject.
   * @returns {Promise<T>}
   */
  first(): Promise<T> 
  /**
   * Returns the first element. if no element exists, resolve undefined.
   * @returns {Promise<T>}
   */
  firstOrDefault(): Promise<T> 
  /**
   * Produces the set intersection of two sequences by using the default equality comparer to compare values.
   * @param {IQueryable<T>} queryable the queryable to intersect.
   * @returns {IQueryable<T>}
   */
  intersect(queryable: IQueryable<T>): IQueryable<T> 
  /**
   * Returns the last element in this sequence. if empty, reject.
   * @returns {Promise<T>}
   */
  last(): Promise<T>
  /**
   * Returns the last element in this sequence. if empty, resolve undefined.
   * @returns {Promise<T>}
   */
  lastOrDefault(): Promise<T> 
  /**
   * Sorts the elements of a sequence in ascending order according to a key. This method requires
   * an internal collect().
   * @param {(value: T): U} func the orderBy function.
   * @returns {Queryable<T>}
   */
  orderBy<U>(func: (value: T) => U): IQueryable<T>
  /**
   * Sorts the elements of a sequence in descending order according to a key. This method requires
   * an internal collect().
   * @param {(value: T): U} func the orderByDescending function.
   * @returns {IQueryable<T>}
   */
  orderByDescending<U>(func: (value: T) => U): IQueryable<T> 
  /**
   * Inverts the order of the elements in a sequence. This method requires
   * an internal collect().
   * @returns {IQueryable<T>}
   */
  reverse(): IQueryable<T> 
  /**
   * Projects each element of a sequence into a new form.
   * @param {(value:T, index: number): U} func the select function.
   * @returns {Queryable<U>}
   */
  select<U>(func: (value: T, index: number) => U): IQueryable<U> 
  /**
   * Projects each element of a sequence to an IEnumerable<T> and combines the resulting sequences into one sequence.
   * @param {(value:T, index: number): Queryable<U>} func the selectMany function.
   * @returns {IQueryable<U>}
   */
  selectMany<U>(func: (value: T, index: number) => Array<U>): IQueryable<U> 
  /**
   * Returns the only element of a sequence that satisfies a specified condition.
   * @param {(value: T, index: number): boolean} func the single function.
   * @returns {Promise<T>}
   */
  single(func: (value: T, index: number) => boolean): Promise<T>
  /**
   * Returns the only element of a sequence that satisfies a specified condition or null if no such element exists.
   * @param {(value: T, index: number): boolean} func the singleOfDefault function.
   * @returns {Promise<T>}
   */
  singleOrDefault(func: (value: T, index: number) => boolean): Promise<T>
  /**
   * Bypasses a specified number of elements in a sequence and then returns the remaining elements.
   * @param {number} count the number of elements to skip.
   * @returns {Queryable<T>}
   */
  skip(count: number): IQueryable<T>
  /**
   * Computes the sum of the sequence of numeric values.
   * @param {(value: T, index: number): number} func the sum function.
   * @returns {Promise<number>}
   */
  sum(func: (value: T, index: number) => number): Promise<number>
  /**
   * Returns a specified number of contiguous elements from the start of a sequence.
   * @param {number} count the number of elements to take.
   * @returns {IQueryable<T>}
   */
  take(count: number): IQueryable<T> 
  /**
   * Filters a sequence of values based on a predicate.
   * @param {(value: T, index: number): boolean} func the where function.
   * @returns {Queryable<T>}
   */
  where(func: (value: T, index: number) => boolean): IQueryable<T>
  /**
   * Enumerates each element in this sequence.
   * @param {(value: T, index: number) => void} func the each function.
   * @returns {Promise<any>}
   */
  each(func: (value: T, index: number) => void): Promise<any>
  /**
   * Collects the results of this queryable into a array.
   * @returns {Promise<Array<T>>}
   */
  collect(): Promise<Array<T>>
}


/**
 * SourceContext<T>: A source emitter context passed into
 * producer streams when creating sources.
 */
export class SourceContext<T> {
  private _done: boolean

  /**
   * creates a new source context.
   * @param {(value: T) => void} _next the next function.
   * @param {(value: string) => void} _error the error function.
   * @param {() => void} _end the end function.
   * @returns {SourceContext<T>}
   */
  constructor(
    private _next: (value: T) => void,
    private _error: (value: string) => void,
    private _end: () => void) {
    this._done = false
  }

  /**
   * emits the given value from this source.
   * @param {T} value the value to emit.
   * @returns {void}
   */
  public next(value: T): void {
    if (this._done === false) {
      this._next(value)
    }
  }

  /**
   * emits an error from this source.
   * @param {string} value the error to emit.
   * @returns {void}
   */
  public error(value: string): void {
    if (this._done === false) {
      this._done = true
      this._error(value)
      this._end()
    }
  }

  /**
   * emits a end signal from this source.
   * @returns {void}
   */
  public end(): void {
    if (this._done === false) {
      this._done = true
      this._end()
    }
  }
}

/** Element<T>: The types of elements emitted from a source. */
export interface ValueElement<T> { type: "value", value: T }
export interface ErrorElement    { type: "error", error: string }
export interface EndElement      { type: "end" }
export type Element<T> = ValueElement<T> | ErrorElement | EndElement
/**
 * Source<T>
 * Provides a mechansism to emit streams of values.
 */
export class Source<T> {
  /**
   * creates a new source.
   * @param {(SourceContext<T>) => void} func the source function.
   * @returns {Source<T>}
   */
  constructor(private func: (context: SourceContext<T>) => void) { }
  /**
   * reads values from this source.
   * @param {(Element<T>) => void} func the read function.
   * @returns {void}
   */
  public read(func: (element: Element<T>) => void): void {
    let context = new SourceContext<T>(
      value => func({ type: "value", value: value }),
      error => func({ type: "error", error: error }),
      ()    => func({ type: "end" }))
    this.func(context)
  }
}

/**
 * Queryable<T>: Provides a asynchronous query interface for 
 * lazy emitted values from a given source.
 */
export class Queryable<T> implements IQueryable<T> {

  /**
   * creates a new queryable from the given source.
   * @param {Source<T>} source the source to query.
   * @returns {Queryable<T>}
   */
  constructor(private source: Source<T>) { }

  /**
   * Applies an accumulator function over a sequence.
   * @param {(acc: U, current: T, index?: number): U} func the aggregate function.
   * @returns {Promise<U>}
   */
  public aggregate<U>(func: (acc: U, value: T, index: number) => U, initial: U): Promise<U> {
    return new Promise<U>((resolve, reject) => {
      let index = 0
      this.source.read(element => {
        switch (element.type) {
          case "value":
            initial = func(initial, element.value, index)
            index += 1
            break;
          case "error":
            reject(element.error)
          case "end":
            resolve(initial)
            break;
        }
      })
    })
  }

  /**
   * Determines whether all the elements of a sequence satisfy a condition.
   * @param {(value: T): boolean} func the all function.
   * @returns {Promise<boolean>}
   */
  public all(func: (value: T, index: number) => boolean): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      let index = 0
      this.source.read(element => {
        switch (element.type) {
          case "value":
            if (func(element.value, index) === false) {
              resolve(false)
            }
            index += 1
            break;
          case "error":
            reject(element.error)
          case "end":
            resolve(true)
            break;
        }
      })
    })
  }

  /**
   * Determines whether a sequence contains any elements that meet this criteria.
   * @param {(value: T): boolean} func the any function.
   * @returns {Promise<boolean>}
   */
  public any(func: (value: T, index: number) => boolean): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      let index = 0
      this.source.read(element => {
        switch (element.type) {
          case "value":
            if (func(element.value, index) === true) {
              resolve(true)
            }
            index += 1
            break;
          case "error":
            reject(element.error)
          case "end":
            resolve(false)
            break;
        }
      })
    })
  }

  /**
   * Computes the average of a sequence of numeric values.
   * @param {(value:T): number} func the average function.
   * @returns {Promise<number>}
   */
  public average(func: (value: T, index: number) => number): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      let index = 0
      let acc = 0
      this.source.read(element => {
        switch (element.type) {
          case "value":
            acc += func(element.value, index)
            index += 1
            break;
          case "error":
            reject(element.error)
          case "end":
            resolve((index > 0) ? acc / index : 0)
            break;
        }
      })
    })
  }

  /**
   * preforms a type cast from the source type T to U. Only useful to typescript.
   * @returns {Queryable<U>}
   */
  public cast<U>(): Queryable<U> {
    return new Queryable<U>(new Source<U>(context => {
      this.source.read(element => {
        switch (element.type) {
          case "value":
            context.next(<U><any>element.value)
            break;
          case "error":
            context.error(element.error)
          case "end":
            context.end()
            break;
        }
      })
    }))
  }

  /**
   * Concatenates two queryable sequences returning a new queryable that enumerates the first, then the second.
   * @param {Queryable<T>} queryable the queryable to concat.
   * @returns {Queryable<T>}
   */
  public concat(queryable: Queryable<T>): Queryable<T> {
    return new Queryable<T>(new Source<T>(context => {
      this.source.read(element => {
        switch (element.type) {
          case "value":
            context.next(element.value)
            break;
          case "error":
            context.error(element.error)
          case "end":
            queryable.source.read(element => {
              switch (element.type) {
                case "value":
                  context.next(element.value)
                  break;
                case "error":
                  context.error(element.error)
                case "end":
                  context.end()
                  break;
              }
            })
            break;
        }
      })
    }))
  }
  
  /**
   * Returns the number of elements in a sequence.
   * @returns Promise<number>
   */
  public count(): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      let count = 0;
      this.source.read(element => {
        switch (element.type) {
          case "value":
            count += 1
            break;
          case "error":
            reject(element.error)
          case "end":
            resolve(count)
            break;
        }
      })
    })
  }

  /**
   * Returns distinct elements from a sequence by using the default equality comparer to compare values.
   * @returns {Queryable<T>}
   */
  public distinct(): Queryable<T> {
    return new Queryable<T>(new Source<T>(context => {
      let acc = new Array<T>()
      this.source.read(element => {
        switch (element.type) {
          case "value":
            if (acc.indexOf(element.value) === -1) {
              acc.push(element.value)
              context.next(element.value)
            }
            break;
          case "error":
            context.error(element.error)
          case "end":
            acc = []
            context.end()
            break;
        }
      })
    }))
  }

  /**
   * Returns the element at the specified index, if no element exists, reject.
   * @param {number} index the element index.
   * @returns {Promise<T>}
   */
  public elementAt(index: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      let index0 = 0
      this.source.read(element => {
        switch (element.type) {
          case "value":
            index0 += 1
            if (index0 === index) {
              resolve(element.value)
            }
            break;
          case "error":
            reject(element.error)
          case "end":
            reject(`no element at [${index}]`)
            break;
        }
      })
    })
  }

  /**
   * Returns the element at the specified index, if no element exists, resolve undefined.
   * @param {number} index the element index.
   * @returns {Promise<T>}
   */
  public elementAtOrDefault(index: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      let index0 = 0
      this.source.read(element => {
        switch (element.type) {
          case "value":
            index0 += 1
            if (index0 === index) {
              resolve(element.value)
            }
            break;
          case "error":
            reject(element.error)
          case "end":
            resolve(undefined)
            break;
        }
      })
    })
  }

  /**
   * Returns the first element. if no element exists, reject.
   * @returns {Promise<T>}
   */
  public first(): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      let done = false
      this.source.read(element => {
        switch (element.type) {
          case "value":
            if (done === false) {
              done = true
              resolve(element.value)
            }
            break;
          case "error":
            reject(element.error)
          case "end":
            if (done === false) {
              done = true
              reject("no elements in sequence")
            }
            break;
        }
      })
    })
  }

  /**
   * Returns the first element. if no element exists, resolve undefined.
   * @returns {Promise<T>}
   */
  public firstOrDefault(): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      let done = false
      this.source.read(element => {
        switch (element.type) {
          case "value":
            if (done === false) {
              done = true
              resolve(element.value)
            }
            break;
          case "error":
            reject(element.error)
          case "end":
            if (done === false) {
              done = true
              resolve(undefined)
            }
            break;
        }
      })
    })
  }

  /**
   * Produces the set intersection of two sequences by using the default equality comparer to compare values.
   * @param {Queryable<T>} queryable the queryable to intersect.
   * @returns {Queryable<T>}
   */
  public intersect(queryable: Queryable<T>): Queryable<T> {
    return new Queryable<T>(new Source<T>(context => {
      this.collect().then(buffer => {
        queryable.source.read(element => {
          switch (element.type) {
            case "value":
              if (buffer.indexOf(element.value) !== -1) {
                context.next(element.value)
              }
              break;
            case "error":
              context.error(element.error)
            case "end":
              context.end()
              break;
          }
        })
      }).catch(error => context.error(error))
    }))
  }

  /**
   * Returns the last element in this sequence. if empty, reject.
   * @returns {Promise<T>}
   */
  public last(): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      let current: T = undefined
      this.source.read(element => {
        switch (element.type) {
          case "value":
            current = element.value
            break;
          case "error":
            reject(element.error)
          case "end":
            if (current === undefined) {
              reject("no elements in sequence")
            } else {
              resolve(current)
            }
            break;
        }
      })
    })
  }

  /**
   * Returns the last element in this sequence. if empty, resolve undefined.
   * @returns {Promise<T>}
   */
  public lastOrDefault(): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      let current: T = undefined
      this.source.read(element => {
        switch (element.type) {
          case "value":
            current = element.value
            break;
          case "error":
            reject(element.error)
          case "end":
            resolve(current)
            break;
        }
      })
    })
  }

  /**
   * Sorts the elements of a sequence in ascending order according to a key. This method requires
   * an internal collect().
   * @param {(value: T): U} func the orderBy function.
   * @returns {Queryable<T>}
   */
  public orderBy<U>(func: (value: T) => U): Queryable<T> {
    return new Queryable<T>(new Source<T>(context => {
      this.collect().then(buffer => {
        let sorted = buffer.sort((a, b) => {
          let left = func(a)
          let right = func(b)
          return +(left > right) || +(left === right) - 1;
        })
        while (sorted.length > 0) {
          context.next(sorted.shift())
        } context.end()
      }).catch(error => context.error(error))
    }))
  }

  /**
   * Sorts the elements of a sequence in descending order according to a key. This method requires
   * an internal collect().
   * @param {(value: T): U} func the orderByDescending function.
   * @returns {Queryable<T>}
   */
  public orderByDescending<U>(func: (value: T) => U): Queryable<T> {
    return new Queryable<T>(new Source<T>(context => {
      this.collect().then(buffer => {
        let sorted = buffer.sort((a, b) => {
          let left = func(a)
          let right = func(b)
          return +(left < right) || +(left === right) - 1;
        })
        while (sorted.length > 0) {
          context.next(sorted.shift())
        } context.end()
      }).catch(error => context.error(error))
    }))
  }

  /**
   * Inverts the order of the elements in a sequence. This method requires
   * an internal collect().
   * @returns {Queryable<T>}
   */
  public reverse(): Queryable<T> {
    return new Queryable<T>(new Source<T>(context => {
      this.collect().then(buffer => {
        let reversed = buffer.reverse()
        while (reversed.length > 0) {
          context.next(reversed.shift())
        } context.end()
      }).catch(error => context.error(error))
    }))
  }

  /**
   * Projects each element of a sequence into a new form.
   * @param {(value:T, index: number): U} func the select function.
   * @returns {Queryable<U>}
   */
  public select<U>(func: (value: T, index: number) => U): Queryable<U> {
    return new Queryable<U>(new Source<U>(context => {
      let index = 0
      this.source.read(element => {
        switch (element.type) {
          case "value":
            context.next(func(element.value, index))
            index += 1
            break;
          case "error":
            context.error(element.error)
          case "end":
            context.end()
            break;
        }
      })
    }))
  }

  /**
   * Projects each element of a sequence to an IEnumerable<T> and combines the resulting sequences into one sequence.
   * @param {(value:T, index: number): Queryable<U>} func the selectMany function.
   * @returns {Queryable<U>}
   */
  public selectMany<U>(func: (value: T, index: number) => Array<U>): Queryable<U> {
    return new Queryable<U>(new Source<U>(context => {
      let index = 0
      this.source.read(element => {
        switch (element.type) {
          case "value":
            func(element.value, index).forEach(value =>
              context.next(value))
            index += 1
            break;
          case "error":
            context.error(element.error)
          case "end":
            context.end()
            break;
        }
      })
    }))
  }

  /**
   * Returns the only element of a sequence that satisfies a specified condition.
   * @param {(value: T, index: number): boolean} func the single function.
   * @returns {Promise<T>}
   */
  public single(func: (value: T, index: number) => boolean): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      let index = 0
      let elem: T = undefined
      this.source.read(element => {
        switch (element.type) {
          case "value":
            if (func(element.value, index) === true) {
              if (elem === undefined) {
                elem = element.value
              } else {
                reject("found multiple elements in this sequence.")
              }
            }
            index += 1
            break;
          case "error":
            reject(element.error)
          case "end":
            if (elem === undefined) {
              reject("unable to locate element with the given critera.")
            } else {
              resolve(elem)
            }
            break;
        }
      })
    })
  }
  /**
   * Returns the only element of a sequence that satisfies a specified condition or null if no such element exists.
   * @param {(value: T, index: number): boolean} func the singleOfDefault function.
   * @returns {Promise<T>}
   */
  public singleOrDefault(func: (value: T, index: number) => boolean): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      let index = 0
      let elem: T = undefined
      this.source.read(element => {
        switch (element.type) {
          case "value":
            if (func(element.value, index) === true) {
              if (elem === undefined) {
                elem = element.value
              } else {
                reject("found multiple elements in this sequence.")
              }
            }
            index += 1
            break;
          case "error":
            reject(element.error)
          case "end":
            resolve(elem)
            break;
        }
      })
    })
  }

  /**
   * Bypasses a specified number of elements in a sequence and then returns the remaining elements.
   * @param {number} count the number of elements to skip.
   * @returns {Queryable<T>}
   */
  public skip(count: number): Queryable<T> {
    return new Queryable<T>(new Source<T>(context => {
      let index = 0
      this.source.read(element => {
        switch (element.type) {
          case "value":
            if (index >= count) {
              context.next(element.value)
            }
            index += 1
            break;
          case "error":
            context.error(element.error)
          case "end":
            context.end()
            break;
        }
      })
    }))
  }

  /**
   * Computes the sum of the sequence of numeric values.
   * @param {(value: T, index: number): number} func the sum function.
   * @returns {Promise<number>}
   */
  public sum(func: (value: T, index: number) => number): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      let index = 0
      let acc = 0
      this.source.read(element => {
        switch (element.type) {
          case "value":
            acc += func(element.value, index)
            index += 1
            break;
          case "error":
            reject(element.error)
          case "end":
            resolve(acc)
            break;
        }
      })
    })
  }

  /**
   * Returns a specified number of contiguous elements from the start of a sequence.
   * @param {number} count the number of elements to take.
   * @returns {Queryable<T>}
   */
  public take(count: number): Queryable<T> {
    return new Queryable<T>(new Source<T>(context => {
      let index = 0
      this.source.read(element => {
        switch (element.type) {
          case "value":
            if (index < count) {
              context.next(element.value)
            }
            index += 1
            break;
          case "error":
            context.error(element.error)
            break;
          case "end":
            context.end()
            break;
        }
      })
    }))
  }

  /**
   * Filters a sequence of values based on a predicate.
   * @param {(value: T, index: number): boolean} func the where function.
   * @returns {Queryable<T>}
   */
  public where(func: (value: T, index: number) => boolean): Queryable<T> {
    return new Queryable<T>(new Source<T>(context => {
      let index = 0
      this.source.read(element => {
        switch (element.type) {
          case "value":
            if (func(element.value, index) === true) {
              context.next(element.value)
            }
            index += 1
            break;
          case "error":
            context.error(element.error)
            break;
          case "end":
            context.end()
            break;
        }
      })
    }))
  }

  /**
   * Enumerates each element in this sequence.
   * @param {(value: T, index: number) => void} func the each function.
   * @returns {Promise<any>}
   */
  public each(func: (value: T, index: number) => void): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      let index = 0
      this.source.read(element => {
        switch (element.type) {
          case "value":
            func(element.value, index)
            index += 1
            break;
          case "error":
            reject(element.error)
            break;
          case "end":
            resolve(undefined)
            break;
        }
      })
    })
  }

  /**
   * Collects the results of this queryable into a array.
   * @returns {Promise<Array<T>>}
   */
  public collect(): Promise<Array<T>> {
    return new Promise((resolve, reject) => {
      let buffer = new Array<T>()
      this.source.read(element => {
        switch (element.type) {
          case "value":
            buffer.push(element.value)
            break;
          case "error":
            reject(element.error)
            break;
          case "end":
            resolve(buffer)
            break;
        }
      })
    })
  }

  /**
   * converts the given array into a queryable.
   * @param {Array<T>} array the array to query.
   * @returns {Queryable<T>}
   */
  public static fromArray<T>(array: Array<T>): Queryable<T> {
    return new Queryable<T>(new Source<T>(context => {
      array.forEach(value => context.next(value))
      context.end()
    }))
  }

  /**
   * returns a new queryable for the given range.
   * @param {number} from the starting range index.
   * @param {number} to the ending range index.
   * @returns {Queryable<number>}
   */
  public static range(from: number, to: number): Queryable<number> {
    return new Queryable<number>(new Source<number>(context => {
      for (let i = from; i < to; i++) {
        context.next(i)
      } context.end()
    }))
  }
}