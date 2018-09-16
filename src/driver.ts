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

/**
 * returns the IDBFactory object from the document window.
 * @returns {IDBFactory}
 */
const factorydb = (): IDBFactory => {
  return indexedDB
}
export type Record             = { key: string, [data: string]: string }
export type RecordDataEvent    = { type: "data", data: Record }
export type RecordErrorEvent   = { type: "error", error: any }
export type RecordEndEvent     = { type: "end" }
export type RecordReadEvent    = RecordDataEvent | RecordErrorEvent | RecordEndEvent
export type RecordReadFunction = (event: RecordReadEvent) => void

export type Schematics = string[]
export type SchematicsCreateStoreResult =  {storename: string, parameter: IDBObjectStoreParameters }
export type SchematicsRemoveStoreResult = string
export type ComputeSchematicsDeltaResult = {
  creates : SchematicsCreateStoreResult[]
  removes : SchematicsRemoveStoreResult[]
}

/**
 * computes the database schematics deltas with the given schematic. This
 * function is used during the database_update() function.
 * @param {IDBDatabase} database the database to compute deltas for.
 * @param {Schematics} schematics the database schematics
 * @returns {ComputeSchematicsDeltaResult}
 */
const compute_schematics_delta = (database: IDBDatabase, stores: Schematics): ComputeSchematicsDeltaResult => {
  const compute_creates = (database: IDBDatabase, stores: Schematics)=> {
    const storenames = database.objectStoreNames
    return stores.map(storename => ({
      storename: storename,
      parameter: { keyPath: "key" }
    })).filter(p => !storenames.contains(p.storename)) as SchematicsCreateStoreResult[]
  }
  const compute_removes = (database: IDBDatabase, stores: Schematics) => {
    const existing = database.objectStoreNames
    const current  = stores
    const result = []
    for(let i = 0; i < existing.length; i++) {
      const storename = existing[i]
      if(current.indexOf(storename) === -1) {
        result.push(storename)
      }
    }
    return result
  }
  return {
    creates: compute_creates(database, stores),
    removes: compute_removes(database, stores)
  }
}

/**
 * opens a database connection.
 * @param {Schema} schema the schema for this database.
 * @param {Promise<IDBDatabase>}
 */
export const database_open = (name: string) => new Promise<IDBDatabase>((resolve, reject) => {
  const factory = factorydb()
  const request = factory.open(name)
  request.addEventListener("error",   () => reject(request.error))
  request.addEventListener("success", () => resolve(request.result as IDBDatabase))
})

/**
 * upgrades a existing database with the given additions and removals. the function detects
 * if the database needs to be updated, and if so, upgrades the database, otherwise, this
 * function will return the database passed in.
 * @param {IDBDatabase} database  an existing database.
 * @param {Schematics} schematics the schematics for this datastore.
 * @param {Promise<IDBDatabase>}
 */
export const database_update = (database: IDBDatabase, schematics: Schematics) => new Promise<IDBDatabase>((resolve, reject) => {

  // extract database info, build add / remove manifest.
  const name    = database.name
  const version = database.version
  const deltas  = compute_schematics_delta(database, schematics)
  
  // if no changes, then resolve input database (not change)
  if (deltas.creates.length === 0 && deltas.removes.length === 0) {
    resolve(database)
  }
  // if there are changes, close and reopen the database with version + 1
  else {
    database.close()
    const factory = factorydb()
    const request = factory.open(name, version + 1)
    request.addEventListener("success",       () => resolve(request.result as IDBDatabase))
    request.addEventListener("error",         () => reject (request.error))
    request.addEventListener("upgradeneeded", () => {
      const udpated = request.result as IDBDatabase
      deltas.creates.forEach (create => udpated.createObjectStore(create.storename, {keyPath: "key"}))
      deltas.removes.forEach (remove => udpated.deleteObjectStore(remove))
    })
  }
})

/**
 * deletes a database.
 * @param {string} name the name of the database to delete.
 * @returns {Promise<any>}
 */
export const database_delete = (databasename: string) => new Promise<any>((resolve, reject) => {
  const factory = factorydb()
  const request = factory.deleteDatabase(databasename)
  request.addEventListener("error",   () => reject(request.error))
  request.addEventListener("success", () => resolve(request.result))
})

/**
 * inserts multiple records into the given database store.
 * @param {IDBDatabase} database the database to insert into.
 * @param {string} store_name the name of the store.
 * @param {Array<any>} records an array of records to insert.
 * returns {Promise<any>}
 */
export const store_insert_records = (database: IDBDatabase, storename: string, records: Array<any>) => new Promise<Array<string>>((resolve, reject) => {
  const transaction = database.transaction([storename], "readwrite")
  transaction.addEventListener("complete", ()          => resolve())
  transaction.addEventListener("error",    (error:any) => reject(error.target.error))
  const store = transaction.objectStore(storename)
  records.forEach(record => store.add(record))
})

/**
 * deletes multiple records into the given database store.
 * @param {IDBDatabase} database the database to insert into.
 * @param {string} storename the name of the store.
 * @param {Array<any>} records an array of records to delete.
 * returns {Promise<any>}
 */
export const store_update_records = (database: IDBDatabase, storename: string, records: Array<Record>) => new Promise((resolve, reject) => {
  const transaction = database.transaction([storename], 'readwrite');
  transaction.addEventListener("complete", ()          => resolve())
  transaction.addEventListener("error",    (error:any) => reject(error.target.error))
  const store   = transaction.objectStore(storename);
  const request = store.openCursor()
  request.addEventListener("error",   () => reject(transaction.error))
  request.addEventListener("success", (event: any) => {
    const cursor = event.target.result as IDBCursorWithValue
    if (cursor !== null) {
      for (let i = 0; i < records.length; i++) {
        if (records[i].key === cursor.key) {
          cursor.update(records[i])
          break;
        }
      } cursor.continue()
    }
  })
})

/**
 * deletes multiple records into the given database store.
 * @param {IDBDatabase} database the database to insert into.
 * @param {string} storename the name of the store.
 * @param {Array<any>} records an array of records to delete.
 * returns {Promise<any>}
 */
export const store_delete_records = (database: IDBDatabase, storename: string, records: Array<Record>) => new Promise((resolve, reject) => {
  const transaction = database.transaction([storename], 'readwrite')
  transaction.addEventListener("complete", ()          => resolve())
  transaction.addEventListener("error",    (error:any) => reject(error.target.error))
  const store = transaction.objectStore(storename)
  records.forEach(record => store.delete(record.key))
})

/**
 * returns the number of records in this store.
 * @param {IDBDatabase} database the database.
 * @param {string} storename the store to count records.
 * @returns {Promise<number>}
 */
export const store_record_count = (database: IDBDatabase, storename: string) => new Promise<number>((resolve, reject) => {
  const transaction = database.transaction([storename], 'readonly')
  const store       = transaction.objectStore(storename)
  const request     = store.count()
  request.addEventListener("success", event => resolve(request.result))
  request.addEventListener("error",   event => reject (request.error))
})

/**
 * preforms a linear scan across all records in the store.
 * @param {IDBDatabase} database the database to read from.
 * @param {string} storename the name of the store to read from.
 * @param {StoreReadFunction} func the store read function.
 * @returns {void}
 */
export const store_read_records = (database: IDBDatabase, storename: string, func: RecordReadFunction) => new Promise<any>((resolve, reject) => {
  let done = false
  const transaction = database.transaction([storename], 'readonly')
  transaction.addEventListener("error",    () => reject(transaction.error))
  transaction.addEventListener("complete", () => resolve())

  const store   = transaction.objectStore(storename)
  const request = store.openCursor()
  request.addEventListener("error", () => {
    if (done === false) {
      func({ type: "error", error: request.error })
      func({ type: "end" })
      reject(request.error)
      done = true
    }
  })
  request.addEventListener("success", (event: any) => {
    if (done === false) {
      const cursor = event.target.result as IDBCursorWithValue
      if (cursor) {
        const record = { key: cursor.key }
        for(let key in cursor.value) {
          record[key] = cursor.value[key]
        }
        func({ type: "data", data: record as Record });
        cursor.continue()
      } else {
        func({ type: "end" })
        done = true
      }
    }
  })
})

/**
 * returns a record from the given key.
 * @param {IDBDatabase} database the database to get from.
 * @param {string} storename the name of the store to get from.
 * @param {string | number} key the key to get.
 * @returns {Promise<Record>}
 */
export const store_get_record = (database: IDBDatabase, storename: string, key: string | number) => new Promise<Record>((resolve, reject) => {
  const transaction = database.transaction([storename], 'readonly')
  const store = transaction.objectStore(storename)
  const request = store.get(key)
  request.addEventListener("success", event => resolve(request.result))
  request.addEventListener("error",   event => reject(request.error))
})
