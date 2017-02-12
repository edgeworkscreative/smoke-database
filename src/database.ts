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

import { databaseOpen, databaseDelete, databaseUpgrade }  from "./system/db"
import { Queryable, Source }                              from "./query"
import { Store }                                          from "./store"

export interface IDatabaseUpgradeContext {
  /**
   * Will create this store if the store does not exist. Otherwize, no action.
   * @param {string} name the name of the store to create.
   * @returns {IDatabaseUpgradeContext}
   */
  create(name: string): IDatabaseUpgradeContext
  /**
   * Will delete this store if this store exists. Otherwize, no action.
   * @param {string} name the name of the store to delete.
   * @returns {IDatabaseUpgradeContext}
   */
  delete(name: string): IDatabaseUpgradeContext
}
export class DatabaseUpgradeContext implements IDatabaseUpgradeContext {
  public additions: Array<string>
  public removals : Array<string>
  /**
   * creates a new database upgrade context.
   * @returns {DatabaseUpgradeContext}
   */
  constructor() {
    this.additions = new Array<string>()
    this.removals  = new Array<string>()
  }
  /**
   * Will create this store if the store does not exist. Otherwize, no action.
   * @param {string} name the name of the store to create.
   * @returns {IDatabaseUpgradeContext}
   */
  public create(name: string): IDatabaseUpgradeContext {
    this.additions.push(name)
    return this
  }
  /**
   * Will delete this store if this store exists. Otherwize, no action.
   * @param {string} name the name of the store to delete.
   * @returns {IDatabaseUpgradeContext}
   */
  public delete(name: string): IDatabaseUpgradeContext {
    this.removals.push(name)
    return this
  }
}

/**
 * Database
 * Provides an abstraction over a indexedDB database.
 */
export class Database {
    private _db        : IDBDatabase
    private _name      : string
    private _stores    : {[name: string]: Store<any>}

    /**
     * creates a new database with the given schema.
     * @param {Schema} schema the schema to use.
     * @returns {Database}
     */
    constructor(name: string) { 
      this._db        = undefined
      this._name      = name
      this._stores    = {}
    }

    /**
     * returns a store within this database.
     * @param {string} name the name of the store.
     * @param {Store<T>} 
     */
    public store<T>(name: string): Store<T> {
      if(this._stores[name] === undefined) {
        this._stores[name] = new Store<T>(this, name)
      } return this._stores[name] as Store<T>
    }

    /**
     * submits any staged insert / update / delete for all stores
     * managed by this database.
     * @returns {Promise<any>}
     */
    public async submit(): Promise<any> {
      for(let n in this._stores) {
        await this._stores[n].submit()
      }
    }

    /**
     * Returns the current IDBDatabase instance associated with this database.
     * @returns {Promise<IDBDatabase>}
     */
    public async current(): Promise<IDBDatabase> {
      if(this._db === undefined) {
        this._db = await databaseOpen(this._name)
      } return this._db
    }

    /**
     * Upgrades this database. This function provides to the 
     * caller a database upgrade context which allows the caller
     * to add and remove object stores. The a new IDBDatabase
     * instance will be returned to the caller.
     * @param {(context: IDatabaseUpgradeContext) => void} func
     * @returns {Promise<any>}
     */
    public async upgrade(func: (context: IDatabaseUpgradeContext) => void): Promise<IDBDatabase> {
      let context = new DatabaseUpgradeContext()
      func(context)
      this._db = await databaseUpgrade(await this.current(), 
        context.additions, 
        context.removals
      ); return this._db
    }
    
    /**
     * deletes this database with the given name.
     * @param {string} name the name of the database to delete.
     * @returns {Promise<any>}
     */
    public static delete(name: string): Promise<any> {
      return databaseDelete(name)
    }
}
