/*--------------------------------------------------------------------------

 smoke-db - linq abstraction over indexed db.

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
 * internal definition of a record.
 */
export interface Record { 
  key   : any, 
  value : any 
}

/**
 * inserts multiple records into the given database store.
 * @param {IDBDatabase} database the database to insert into.
 * @param {string} store_name the name of the store.
 * @param {Array<any>} records an array of records to insert.
 * returns {Promise<any>}
 */
export async function insertMany(database: IDBDatabase, store: string, records: Array<any>): Promise<Array<string>> {
  return new Promise<Array<string>>((resolve, reject) => {
      let transaction = database.transaction   (store, "readwrite")
      transaction.addEventListener("complete", () => resolve())
      transaction.addEventListener("error",    () => reject(transaction.error))
      let objectStore = transaction.objectStore(store)
      records.forEach(record => objectStore.add(record))
  })
}

/**
 * deletes multiple records into the given database store.
 * @param {IDBDatabase} database the database to insert into.
 * @param {string} store_name the name of the store.
 * @param {Array<any>} records an array of records to delete.
 * returns {Promise<any>}
 */
export function updateMany(database: IDBDatabase, store: string, records: Array<Record>): Promise<any> {
  return new Promise((resolve, reject) => {
    let done          = false
    let transaction   = database.transaction(store, 'readwrite');
    transaction.addEventListener("error",    () => reject(transaction.error))
    transaction.addEventListener("complete", () => resolve())
    let objectStore   = transaction.objectStore(store);
    let cursorRequest = objectStore.openCursor()
    cursorRequest.addEventListener("error",   () => reject(transaction.error))
    cursorRequest.addEventListener("success", (event: any) => {
      let cursor = event.target.result as IDBCursorWithValue
      if(cursor !== null) {
        for(let i = 0; i < records.length; i++) {
          if(records[i].key === cursor.key) {
            cursor.update(records[i])
            break;
          }
        } cursor.continue()
      }
    })
  })
}


/**
 * deletes multiple records into the given database store.
 * @param {IDBDatabase} database the database to insert into.
 * @param {string} store_name the name of the store.
 * @param {Array<any>} records an array of records to delete.
 * returns {Promise<any>}
 */
export function deleteMany(database: IDBDatabase, store: string, records: Array<Record>): Promise<any> {
  return new Promise((resolve, reject) => {
    let transaction   = database.transaction(store, 'readwrite')
    transaction.addEventListener("complete", () => resolve())
    transaction.addEventListener("error",    () => reject(transaction.error))
    let objectStore = transaction.objectStore(store); 
    records.forEach(record => objectStore.delete(record.key))
  })
}

/**
 * runs a linear scan across all elements in the given store.
 * @param {IDBDatabase} database the database to insert into.
 * @param {string} store_name the name of the store.
 * @param {Function} func the scan function.
 * @returns {void}
 */
export interface RecordData  { type: "data",  data : Record }
export interface RecordError { type: "error", error: any }
export interface RecordEnd   { type: "end" }
export type Element = RecordData | RecordError | RecordEnd
export function scanAll(database: IDBDatabase, store_name: string, func: (element: Element) => void) : Promise<any> {
  return new Promise<any>((resolve, reject) => {
    let done          = false
    let transaction   = database.transaction([store_name], 'readonly');
    transaction.addEventListener("error",    () => reject(transaction.error))
    transaction.addEventListener("complete", () => resolve())
    let store         = transaction.objectStore(store_name);
    let cursorRequest = store.openCursor()
    cursorRequest.addEventListener("error", () => {
      if(done === false) {
        func({ type: "error", error: cursorRequest.error })
        func({ type: "end" })
        reject(cursorRequest.error)
        done = true
      }
    })
    cursorRequest.addEventListener("success", (event: any) => {
      if(done === false) {
        let cursor = event.target.result as IDBCursorWithValue
        if(cursor) {
          let record = cursor.value
          func({
            type: "data", 
            data: {
              key  : cursor.key, 
              value: cursor.value
            }
          }); cursor.continue()
        } else {
          func({ type: "end" })
          done = true
        }
      }
    })
  })
}