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
 * returns the IDBFactory object from the document window.
 * @returns {IDBFactory}
 */
export const indexedDBFactory = (): IDBFactory => {
  let host: any = window
  return host.indexedDB 
      || host.mozIndexedDB 
      || host.webkitIndexedDB 
      || host.msIndexedDB 
      || host.shimIndexedDB;
}

/**
 * opens a database connection.
 * @param {Schema} schema the schema for this database.
 * @param {Promise<IDBDatabase>} 
 */
export function databaseOpen(name: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    let factory             = indexedDBFactory()
    let request             = factory.open(name)
    request.addEventListener("error",         () => reject (request.error))
    request.addEventListener("success",       () => resolve(request.result as IDBDatabase))
  })
}

/**
 * upgrades a existing database connection.
 * @param {IDBDatabase}   database  an existing database.
 * @param {Array<string>} additions an array of stores to add.
 * @param {Array<string>} removals  an array of stores to remove.
 * @param {Promise<IDBDatabase>} 
 */
export function databaseUpgrade(db: IDBDatabase, additions: Array<string>, removals: Array<string>) : Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    // extract database info, build add / remove manifest.
    let name    = db.name
    let version = db.version
    additions   = additions.filter(store => !db.objectStoreNames.contains(store))
    removals    = removals.filter (store =>  db.objectStoreNames.contains(store))

    // reopen database with version + 1, run manifest.
    if(additions.length > 0 || removals.length > 0) {
      db.close()
      let factory             = indexedDBFactory()
      let request             = factory.open(name, version + 1)
      request.addEventListener("error",         () => reject (request.error))
      request.addEventListener("success",       () => resolve(request.result as IDBDatabase))
      request.addEventListener("upgradeneeded", () => {
        let database = request.result as IDBDatabase
        additions.forEach(store => database.createObjectStore(store, { autoIncrement: true }))
        removals.forEach (store  => database.deleteObjectStore(store))
      })
    } else {
      resolve(db)
    }
  })
}

/**
 * deletes a database.
 * @param {string} name the name of the database to delete.
 * @returns {Promise<any>}
 */
export function databaseDelete(name: string): Promise<any> {
  return new Promise((resolve, reject) => {
    let factory       = indexedDBFactory()
    let request       = factory.deleteDatabase(name)
    request.addEventListener("error",   () => reject (request.error))
    request.addEventListener("success", () => resolve(request.result))
  })
}