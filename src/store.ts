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

import { scanAll, insertMany, updateMany, deleteMany } from "./system/records"
import { IQueryable, Queryable, Source }               from "./query"
import { Database }                                    from "./database"

/**
 * Record<T>
 * Encapsulates a read record from indexeddb.
 */
export interface Record<T> {
  key   : any, 
  value : T
}

/**
 * Store<T>
 * Encapsulates operations preformed on a indexeddb store.
 */
export class Store<T> implements IQueryable<Record<T>> {
  private inserts: Array<T>
  private updates: Array<Record<T>>
  private deletes: Array<Record<T>>

  /**
   * creates new store from the given database and store name.
   * @param {Database} database the database.
   * @param {string} name the name of the store.
   * @returns {Store<T>}
   */
  constructor(private database: Database, private name: string) {
    this.inserts = new Array<T>()
    this.updates = new Array<Record<T>>()
    this.deletes = new Array<Record<T>>()
  }

  /**
   * queues a new record to insert on submit().
   * @param {T} record the record to insert.
   * @returns {void}
   */
  public insert(record: T): Store<T> {
    this.inserts.push(record)
    return this
  }

  /**
   * queues a new record to updated on submit().
   * @param {T} record the record to update.
   * @returns {void}
   */
  public update(record: Record<T>): Store<T> {
    this.updates.push(record)
    return this
  }

  /**
   * queues the given record to be deleted.
   * @param {T} record the record to delete.
   * @returns {void}
   */
  public delete(record: Record<T>): Store<T> {
    this.deletes.push(record)
    return this
  }

  /**
   * submits any changes made to this collection.
   * @returns {Promise<T>}
   */
  public async submit(): Promise<any> {
    let db = await this.database.db()
    await insertMany(db, this.name, this.inserts)
    await updateMany(db, this.name, this.updates)
    await deleteMany(db, this.name, this.deletes)
    this.inserts = []
    this.updates = []
    this.deletes = []
  }

  /**
   * returns a new data source to this store.
   * @returns {Source<T>}
   */
  public source(): Source<Record<T>> {
    return new Source<Record<T>>(context => {
      this.database.db().then(db => {
        scanAll(db, this.name, element => {
          switch (element.type) {
            case "data": context.next(element.data as Record<T>); break;
            case "error": context.error(element.error); break;
            case "end": context.end(); break;
          }
        })
      })
    })
  }

  /**
   * Applies an accumulator function over a sequence.
   * @param {(acc: U, current: T, index?: number): U} func the aggregate function.
   * @returns {Promise<U>}
   */
  public aggregate<U>(func: (acc: U, value: Record<T>, index: number) => U, initial: U): Promise<U> {
    return new Queryable<Record<T>>(this.source()).aggregate(func, initial)
  }

  /**
   * Determines whether all the elements of a sequence satisfy a condition.
   * @param {(value: T): boolean} func the all function.
   * @returns {Promise<boolean>}
   */
  public all(func: (value: Record<T>, index: number) => boolean): Promise<boolean> {
    return new Queryable<Record<T>>(this.source()).all(func)
  }

  /**
   * Determines whether a sequence contains any elements that meet this criteria.
   * @param {(value: T): boolean} func the any function.
   * @returns {Promise<boolean>}
   */
  public any(func: (value: Record<T>, index: number) => boolean): Promise<boolean> {
    return new Queryable<Record<T>>(this.source()).any(func)
  }

  /**
   * Computes the average of a sequence of numeric values.
   * @param {(value:T): number} func the average function.
   * @returns {Promise<number>}
   */
  public average(func: (value: Record<T>, index: number) => number): Promise<number> {
    return new Queryable<Record<T>>(this.source()).average(func)
  }

  /**
   * preforms a type cast from the source type T to U. Only useful to typescript.
   * @returns {Queryable<U>}
   */
  public cast<U>(): Queryable<U> {
    return new Queryable<Record<T>>(this.source()).cast()
  }

  /**
   * Concatenates two queryable sequences returning a new queryable that enumerates the first, then the second.
   * @param {Queryable<Record<T>>} queryable the queryable to concat.
   * @returns {Queryable<Record<T>>}
   */
  public concat(queryable: Queryable<Record<T>>): Queryable<Record<T>> {
    return new Queryable<Record<T>>(this.source()).concat(queryable)
  }

  /**
   * Returns the number of elements in a sequence.
   * @returns Promise<number>
   */
  public count(): Promise<number> {
    return new Queryable<Record<T>>(this.source()).count()
  }

  /**
   * Returns distinct elements from a sequence by using the default equality comparer to compare values.
   * @returns {Queryable<Record<T>>}
   */
  public distinct(): Queryable<Record<T>> {
    return new Queryable<Record<T>>(this.source()).distinct()
  }

  /**
   * Returns the element at the specified index, if no element exists, reject.
   * @param {number} index the element index.
   * @returns {Promise<T>}
   */
  public elementAt(index: number): Promise<Record<T>> {
    return new Queryable<Record<T>>(this.source()).elementAt(index)
  }

  /**
   * Returns the element at the specified index, if no element exists, resolve undefined.
   * @param {number} index the element index.
   * @returns {Promise<T>}
   */
  public elementAtOrDefault(index: number): Promise<Record<T>> {
    return new Queryable<Record<T>>(this.source()).elementAtOrDefault(index)
  }

  /**
   * Returns the first element. if no element exists, reject.
   * @returns {Promise<T>}
   */
  public first(): Promise<Record<T>> {
    return new Queryable<Record<T>>(this.source()).first()
  }

  /**
   * Returns the first element. if no element exists, resolve undefined.
   * @returns {Promise<T>}
   */
  public firstOrDefault(): Promise<Record<T>> {
    return new Queryable<Record<T>>(this.source()).firstOrDefault()
  }

  /**
   * Produces the set intersection of two sequences by using the default equality comparer to compare values.
   * @param {Queryable<Record<T>>} queryable the queryable to intersect.
   * @returns {Queryable<Record<T>>}
   */
  public intersect(queryable: Queryable<Record<T>>): Queryable<Record<T>> {
    return new Queryable<Record<T>>(this.source()).intersect(queryable)
  }

  /**
   * Returns the last element in this sequence. if empty, reject.
   * @returns {Promise<T>}
   */
  public last(): Promise<Record<T>> {
    return new Queryable<Record<T>>(this.source()).last()
  }

  /**
   * Returns the last element in this sequence. if empty, resolve undefined.
   * @returns {Promise<T>}
   */
  public lastOrDefault(): Promise<Record<T>> {
    return new Queryable<Record<T>>(this.source()).lastOrDefault()
  }

  /**
   * Sorts the elements of a sequence in ascending order according to a key. This method requires
   * an internal collect().
   * @param {(value: T): U} func the orderBy function.
   * @returns {Queryable<Record<T>>}
   */
  public orderBy<U>(func: (value: Record<T>) => U): Queryable<Record<T>> {
    return new Queryable<Record<T>>(this.source()).orderBy(func)
  }

  /**
   * Sorts the elements of a sequence in descending order according to a key. This method requires
   * an internal collect().
   * @param {(value: T): U} func the orderByDescending function.
   * @returns {Queryable<Record<T>>}
   */
  public orderByDescending<U>(func: (value: Record<T>) => U): Queryable<Record<T>> {
    return new Queryable<Record<T>>(this.source()).orderByDescending(func)
  }

  /**
   * Inverts the order of the elements in a sequence. This method requires
   * an internal collect().
   * @returns {Queryable<Record<T>>}
   */
  public reverse(): Queryable<Record<T>> {
    return new Queryable<Record<T>>(this.source()).reverse()
  }

  /**
   * Projects each element of a sequence into a new form.
   * @param {(value:T, index: number): U} func the select function.
   * @returns {Queryable<U>}
   */
  public select<U>(func: (value: Record<T>, index: number) => U): Queryable<U> {
    return new Queryable<Record<T>>(this.source()).select(func)
  }

  /**
   * Projects each element of a sequence to an IEnumerable<T> and combines the resulting sequences into one sequence.
   * @param {(value:T, index: number): Queryable<U>} func the selectMany function.
   * @returns {Queryable<U>}
   */
  public selectMany<U>(func: (value: Record<T>, index: number) => Array<U>): Queryable<U> {
    return new Queryable<Record<T>>(this.source()).selectMany(func)
  }

  /**
   * Returns the only element of a sequence that satisfies a specified condition.
   * @param {(value: T, index: number): boolean} func the single function.
   * @returns {Promise<T>}
   */
  public single(func: (value: Record<T>, index: number) => boolean): Promise<Record<T>> {
    return new Queryable<Record<T>>(this.source()).single(func)
  }
  /**
   * Returns the only element of a sequence that satisfies a specified condition or null if no such element exists.
   * @param {(value: T, index: number): boolean} func the singleOfDefault function.
   * @returns {Promise<T>}
   */
  public singleOrDefault(func: (value: Record<T>, index: number) => boolean): Promise<Record<T>> {
    return new Queryable<Record<T>>(this.source()).singleOrDefault(func)
  }

  /**
   * Bypasses a specified number of elements in a sequence and then returns the remaining elements.
   * @param {number} count the number of elements to skip.
   * @returns {Queryable<Record<T>>}
   */
  public skip(count: number): Queryable<Record<T>> {
    return new Queryable<Record<T>>(this.source()).skip(count)
  }

  /**
   * Computes the sum of the sequence of numeric values.
   * @param {(value: T, index: number): number} func the sum function.
   * @returns {Promise<number>}
   */
  public sum(func: (value: Record<T>, index: number) => number): Promise<number> {
    return new Queryable<Record<T>>(this.source()).sum(func)
  }

  /**
   * Returns a specified number of contiguous elements from the start of a sequence.
   * @param {number} count the number of elements to take.
   * @returns {Queryable<Record<T>>}
   */
  public take(count: number): Queryable<Record<T>> {
    return new Queryable<Record<T>>(this.source()).take(count)
  }

  /**
   * Filters a sequence of values based on a predicate.
   * @param {(value: T, index: number): boolean} func the where function.
   * @returns {Queryable<Record<T>>}
   */
  public where(func: (value: Record<T>, index: number) => boolean): Queryable<Record<T>> {
    return new Queryable<Record<T>>(this.source()).where(func)
  }

  /**
   * Enumerates each element in this sequence.
   * @param {(value: T, index: number) => void} func the each function.
   * @returns {Promise<any>}
   */
  public each(func: (value: Record<T>, index: number) => void): Promise<any> {
    return new Queryable<Record<T>>(this.source()).each(func)
  }

  /**
   * Collects the results of this queryable into a array.
   * @returns {Promise<Array<T>>}
   */
  public collect(): Promise<Array<Record<T>>> {
    return new Queryable<Record<T>>(this.source()).collect()
  }
}