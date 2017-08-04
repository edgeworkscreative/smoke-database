/*--------------------------------------------------------------------------

 smoke-database

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

export type SourceNextFunction<T> = (value: T)   => void
export type SourceErrorFunction   = (error: any) => void
export type SourceEndFunction     = ()           => void

/**
 * SourceContext
 * 
 * Provides a event source in which to dispatch streaming events.
 */
export class SourceContext<T> {

  private ended: boolean

  /**
   * creates a new source context.
   * @param {SourceNextFunction<T>} onnext the next function.
   * @param {SourceErrorFunction} onerror the error function.
   * @param {SourceEndFunction} onend the end function.
   * @returns {SourceContext<T>}
   */
  constructor(private onnext: SourceNextFunction<T>, private onerror: SourceErrorFunction, private onend: SourceEndFunction) {
    this.ended = false
  }

  /**
   * emits the given value from this source.
   * @param {T} value the value to emit.
   * @returns {void}
   */
  public next(value: T): void {
    if (this.ended === false) {
      this.onnext(value)
    }
  }

  /**
   * emits an error from this source.
   * @param {string} value the error to emit.
   * @returns {void}
   */
  public error(value: string): void {
    if (this.ended === false) {
      this.ended = true
      this.onerror(value)
      this.onend()
    }
  }

  /**
   * emits a end signal from this source.
   * @returns {void}
   */
  public end(): void {
    if (this.ended === false) {
      this.ended = true
      this.onend()
    }
  }
}

const STREAM_VALUE = 0
const STREAM_ERROR = 1
const STREAM_END   = 2

export interface ValueEvent<T> { type: 0, value: T }
export interface ErrorEvent    { type: 1, error: string }
export interface EndEvent      { type: 2 } 
export type Event<T> = ValueEvent<T> | ErrorEvent | EndEvent
export type SourceEventFunction<T> = (event: Event<T>) => void

/**
 * Source
 * 
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
   * subscribes to events emitted from this source.
   * @param {SourceEventFunction<T>} func the read function.
   * @returns {void}
   */
  public read(func: SourceEventFunction<T>): void {
    const context = new SourceContext<T>(
      value => func({ type: 0, value: value }),
      error => func({ type: 1, error: error }),
      ()    => func({ type: 2 }))
    this.func(context)
  }
}

/**
 * Queryable
 * 
 * Queryable interface for lazy sequences of values.
 */
export class Queryable<T> {

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
          case STREAM_VALUE:
            initial = func(initial, element.value, index)
            index += 1
            break;
          case STREAM_ERROR:
            reject(element.error)
            break;
          case STREAM_END:
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
          case STREAM_VALUE:
            if (func(element.value, index) === false) {
              resolve(false)
            }
            index += 1
            break;
          case STREAM_ERROR:
            reject(element.error)
            break;
          case STREAM_END:
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
          case STREAM_VALUE:
            if (func(element.value, index) === true) {
              resolve(true)
            }
            index += 1
            break;
          case STREAM_ERROR:
            reject(element.error)
            break;
          case STREAM_END:
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
      let acc   = 0
      this.source.read(element => {
        switch (element.type) {
          case STREAM_VALUE:
            acc += func(element.value, index)
            index += 1
            break;
          case STREAM_ERROR:
            reject(element.error)
            break;
          case STREAM_END:
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
          case STREAM_VALUE:
            context.next(<U><any>element.value)
            break;
          case STREAM_ERROR:
            context.error(element.error)
            break;
          case STREAM_END:
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
          case STREAM_VALUE:
            context.next(element.value)
            break;
          case STREAM_ERROR:
            context.error(element.error)
          case STREAM_END:
            queryable.source.read(element => {
              switch (element.type) {
                case STREAM_VALUE:
                  context.next(element.value)
                  break;
                case STREAM_ERROR:
                  context.error(element.error)
                  break;
                case STREAM_END:
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
          case STREAM_VALUE:
            count += 1
            break;
          case STREAM_ERROR:
            reject(element.error)
            break;
          case STREAM_END:
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
          case STREAM_VALUE:
            if (acc.indexOf(element.value) === -1) {
              acc.push(element.value)
              context.next(element.value)
            }
            break;
          case STREAM_ERROR:
            context.error(element.error)
            break;
          case STREAM_END:
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
          case STREAM_VALUE:
            index0 += 1
            if (index0 === index) {
              resolve(element.value)
            }
            break;
          case STREAM_ERROR:
            reject(element.error)
            break;
          case STREAM_END:
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
          case STREAM_VALUE:
            index0 += 1
            if (index0 === index) {
              resolve(element.value)
            }
            break;
          case STREAM_ERROR:
            reject(element.error)
            break;
          case STREAM_END:
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
          case STREAM_VALUE:
            if (done === false) {
              done = true
              resolve(element.value)
            }
            break;
          case STREAM_ERROR:
            reject(element.error)
            break;
          case STREAM_END:
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
          case STREAM_VALUE:
            if (done === false) {
              done = true
              resolve(element.value)
            }
            break;
          case STREAM_ERROR:
            reject(element.error)
            break;
          case STREAM_END:
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
            case STREAM_VALUE:
              if (buffer.indexOf(element.value) !== -1) {
                context.next(element.value)
              }
              break;
            case STREAM_ERROR:
              context.error(element.error)
              break;
            case STREAM_END:
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
          case STREAM_VALUE:
            current = element.value
            break;
          case STREAM_ERROR:
            reject(element.error)
            break;
          case STREAM_END:
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
          case STREAM_VALUE:
            current = element.value
            break;
          case STREAM_ERROR:
            reject(element.error)
            break;
          case STREAM_END:
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
          case STREAM_VALUE:
            context.next(func(element.value, index))
            index += 1
            break;
          case STREAM_ERROR:
            context.error(element.error)
            break;
          case STREAM_END:
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
          case STREAM_VALUE:
            func(element.value, index).forEach(value =>
              context.next(value))
            index += 1
            break;
          case STREAM_ERROR:
            context.error(element.error)
            break;
          case STREAM_END:
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
          case STREAM_VALUE:
            if (func(element.value, index) === true) {
              if (elem === undefined) {
                elem = element.value
              } else {
                reject("found multiple elements in this sequence.")
              }
            }
            index += 1
            break;
          case STREAM_ERROR:
            reject(element.error)
            break;
          case STREAM_END:
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
          case STREAM_VALUE:
            if (func(element.value, index) === true) {
              if (elem === undefined) {
                elem = element.value
              } else {
                reject("found multiple elements in this sequence.")
              }
            }
            index += 1
            break;
          case STREAM_ERROR:
            reject(element.error)
            break;
          case STREAM_END:
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
          case STREAM_VALUE:
            if (index >= count) {
              context.next(element.value)
            }
            index += 1
            break;
          case STREAM_ERROR:
            context.error(element.error)
            break;
          case STREAM_END:
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
          case STREAM_VALUE:
            acc += func(element.value, index)
            index += 1
            break;
          case STREAM_ERROR:
            reject(element.error)
            break;
          case STREAM_END:
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
          case STREAM_VALUE:
            if (index < count) {
              context.next(element.value)
            }
            index += 1
            break;
          case STREAM_ERROR:
            context.error(element.error)
            break;
          case STREAM_END:
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
          case STREAM_VALUE:
            if (func(element.value, index) === true) {
              context.next(element.value)
            }
            index += 1
            break;
          case STREAM_ERROR:
            context.error(element.error)
            break;
          case STREAM_END:
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
          case STREAM_VALUE:
            func(element.value, index)
            index += 1
            break;
          case STREAM_ERROR:
            reject(element.error)
            break;
          case STREAM_END:
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
          case STREAM_VALUE:
            buffer.push(element.value)
            break;
          case STREAM_ERROR:
            reject(element.error)
            break;
          case STREAM_END:
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