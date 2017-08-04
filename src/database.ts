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

import { Queryable, Source } from "./query"
import * as driver           from "./driver"

export type RecordParameter<T> = T | T[] | Queryable<T> | Promise<T | T[]>

/**
 * resolves the record parameter, allowing for multiple overloads of the record sets
 * passed in on insert(), update(), delete().
 * @param {RecordParameter<T>} records the record parameter to resolve.
 * @returns {Promise<T[]>}
 */
const resolve_record_parameter = async <T extends driver.Record>(records: RecordParameter<T>): Promise<T[]> => {
  if(records === undefined) return []
  else if(records instanceof Array)     return records
  else if(records instanceof Promise)   return await resolve_record_parameter(await records)
  else if(records instanceof Queryable) return await records.collect()
  else return [records]
}

/**
 * Store
 * 
 * A store abstraction over indexeddb object stores.
 */
export class Store<TRecord extends driver.Record> {

  /**
   * creates a new store instance.
   * @param {Database} database the database associated with this store.
   * @param {string} storename the name of this store.
   * @returns {Store}
   */
  constructor(private database: Database, private storename: string) { }

  /**
   * returns the number of records in this store.
   * @returns {Promise<number>}
   */
  public async count(): Promise<number> {
    const db = await this.database.db()
    return driver.store_record_count(db, this.storename)
  }

  /**
   * inserts these records into the store.
   * @param {RecordParameter<TRecord>} records the records to insert.
   * @returns {Promise<any>}
   */
  public async insert(records: RecordParameter<TRecord>): Promise<any> {
    return driver.store_insert_records(await this.database.db(), this.storename, await resolve_record_parameter(records))
  }

  /**
   * updates the given records in this store.
   * @param {RecordParameter<TRecord>} records the record to update.
   * @returns {Promise<any>}
   */
  public async update(records: RecordParameter<TRecord>): Promise<any> {
    return driver.store_update_records(await this.database.db(), this.storename, await resolve_record_parameter(records))
  }

  /**
   * deletes the given records from this store.
   * @param {RecordParameter<TRecord>} records the records to delete.
   * @returns {Promise<any>}
   */
  public async delete(records: RecordParameter<TRecord>): Promise<any> {
    return driver.store_delete_records(await this.database.db(), this.storename, await resolve_record_parameter(records))
  }

  /**
   * returns a record by its key.
   * @param {string} key the key of the record to get.
   * @returns {Promise<Record>}
   */
  public async get(key: string): Promise<TRecord> {
    const db = await this.database.db()
    return driver.store_get_record(db, this.storename, key) as Promise<TRecord>
  }
  
  /**
   * returns a queryable object.
   * @param {RecordReadFunction} func the function to receive records.
   * @returns {Queryable<TRecord>} a promise resolved on completion.
   */
  public query(): Queryable<TRecord> {
    return new Queryable<any>(new Source(async context => {
      const db = await this.database.db()
      driver.store_read_records(db, this.storename, event => {
        switch(event.type) {
          case "data":  context.next(event.data); break;
          case "error": context.error(event.error); break;
          case "end":   context.end()
        }
      })
    }))
  }
}


export type StoresParameter = { [storename: string]: IDBObjectStoreParameters }

/**
 * Database
 * 
 * A indexeddb database abstraction.
 */
export class Database {
  private database: IDBDatabase = undefined

  /**
   * creates a new Database
   * @param {string} databasename the name of this database.
   * @param {Schematics} schematics the schematics of this database.
   * @returns {Database}
   */
  constructor(private databasename: string, private schematics: driver.Schematics) {
  }

  /**
   * returns the internal indexeddb for this database.
   * @returns {IDBDatabase}
   */
  public async db(): Promise<IDBDatabase> {
    if(!this.database) {
      const opened  = await driver.database_open  (this.databasename)
      const updated = await driver.database_update(opened, this.schematics)
      this.database = updated
    } 
    return this.database
  }

  /**
   * returns a store object for this database.
   * @param {string} storename the name of the store.
   * @returns {Store}
   */
  public store<TRecord extends driver.Record>(storename: string): Store<TRecord> {
    return new Store<TRecord>(this, storename)
  }

  /**
   * deletes the database with the given name.
   * @param {string} databasename the name of the database to delete.
   * @returns {Promise<any>}
   */
  public static delete(databasename: string) : Promise<any> {
    return driver.database_delete(databasename)
  }

  /**
   * convenience function to create uuid4 keys.
   * @returns {string}
   */
  public static createKey(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }
}