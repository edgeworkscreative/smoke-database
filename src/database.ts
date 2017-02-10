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

import { databaseOpen, databaseDelete }  from "./system/database"
import { Queryable, Source }             from "./query"
import { Store }                         from "./store"

/** Schema: The database schema interface. */
export interface Schema {
    name       : string,
    version    : number,
    stores     : Array<string>
}

/**
 * Database
 * Provides an abstraction over a indexedDB database.
 */
export class Database {
    private _db     : IDBDatabase
    private _schema : Schema
    private _stores : {[name: string]: Store<any>}

    /**
     * creates a new database with the given schema.
     * @param {Schema} schema the schema to use.
     * @returns {Database}
     */
    constructor(schema: Schema) { 
      this._db     = undefined
      this._schema = schema
      this._stores = {}
      this._schema.stores.forEach(name => 
        this._stores[name] = new Store<any>(this, name))
    }

    /**
     * returns a handle to the given store.
     * @param {string} name the name of the store.
     * @param {Store<T>} 
     */
    public store<T>(name: string): Store<T> {
        return this._stores[name] as Store<T>
    }

    /**
     * returns the schema associated with this database.
     * returns {Schema}
     */
    public schema(): Schema {
      return this._schema
    }

    /**
     * submits any staged data for each store.
     * @returns {Promise<any>}
     */
    public async submit(): Promise<any> {
      for(let n in this._stores) {
        await this._stores[n].submit()
      }
    }

    /**
     * returns the IDBDatabase instance associated with this database.
     * @returns {Promise<IDBDatabase>}
     */
    public db(): Promise<IDBDatabase> {
      return (this._db !== undefined)
          ? Promise.resolve(this._db)
          : databaseOpen(this._schema).then(db => {
              this._db = db
              return db
          })
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
