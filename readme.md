# smoke-database

A simple indexeddb database abstraction.

### overview

smoke-database is a small abstraction over indexeddb. It aims to provide a simple interface for reading and writing store records to and from indexeddb and to offer a linq inspired query interface for querying records. smoke-database hides many of the details of indexeddb (database versioning, indices, etc) offering the user a straight forward ```insert```, ```update```, ```delete``` and ```query``` interface only.

[building the project](#building-the-project)

[creating a database](#creating-a-database)

[inserting records](#inserting-records)

[updating records](#updating-records)

[deleting records](#deleting-records)

[querying records](#querying-records)

### building the project

smoke-database is written in typescript, and is intended to be added to existing projects who need some form of data persistence in the browser. End users can build the project by running the ```tasks.js``` script included with this project.

```
node tasks install # installs build dependencies 
node tasks run     # starts http watch process on ./test/index.ts (port 5000) 
```
output is written to the ```./target``` directory.
### creating a database

The following will create a new database named ```app``` which contains a single store ```users```. smoke-database will track versions based on the stores array and automatically add and remove stores based on the store names passed on the contructor. The database will be created if not exists, or loaded if it does.

```typescript
import { Database } from "./smoke-database"

const database = new Database("app", ["users"])
```

### inserting records

The following examples demonstrate adding records. Note that smoke mandates that the ```key``` property be set when adding records. The ```key``` is mandatory and analogous to 
```id``` and thus must be unique. There is a convenience function ```createKey()``` available on the ```Database``` which is used to generate a unique key below, but any unique string value will work.

The following inserts a single record.
```typescript
database.store("users").insert({
  key  : Database.createKey()
  name : "dave",
  email: "dave@domain.com"
})
```
The following inserts multiple records.
```typescript
database.store("users").insert([{
  key  : Database.createKey()
  name : "dave",
  email: "dave@domain.com"
}, {
  key  : Database.createKey()
  name : "alice",
  email: "alice@domain.com"
}])
```

### updating records

To update records, smoke-database requires you have a full copy of the object available. The reason is the update will overwrite the entirety of the record being updated. The easiest way to approach this is to request the record first.

The following gets the user ```dave``` and updates their email address. Note we use async functions here. both reading and writing is asynchronous in indexeddb and smoke-database reflects this, thus and async/await is leveraged for clarity in this example.

```typescript
const f = async () => {
  // query record.
  const user = await database.store("users").query().where(n => n.name === "dave").first()

  // change email address.
  user.email = "dave.smith@domain.com"
  
  // update the record
  await database.store("users").update(user)
}
```
Alternatively, one can preform sweeping updates by passing a query to the store. The following queries all records and adds an additional
```address``` property to the record. Note ```select``` is analogous to javascripts ```map```, and ```select``` is derived from LINQ.

```typescript
const f = async () => {

  // remap all users
  const users = database.store("users").query().select(user => ({
    key    : user.key,
    name   : user.name,
    email  : email,
    address: "unknown" 
  })) // <-- IQueryable<T>

  // update users
  await database.store("users").update (user)
}
```

### deleting records

Deleting records is similar to updating records where a copy of record is required first. Internally however, smoke-database only cares about the ```{key: ...}``` property. The following deletes user dave.

```typescript
const f = async () => {
  await database.store("users").delete ( 
    database.store("users").query().where(n => n.name === "dave")
  )
}
```
Or all users if you prefer...
```typescript
const f = async () => {
  await database.store("users").delete (
    database.store("users").query()
    )
}
```

### querying records

A store's ```query``` method (as seen above) returns a type analogous to LINQ's ```IQueryable<T>``` interface. Internally smoke-database runs full linear scans across ALL store records, and these operations are applied lazily across each record emitted from indexeddb. Users should be mindful of this full linear scan, as stores with large record counts may result in a performance hit.

Unlike LINQ however, we have no waiting / block mechanism in JavaScript. smoke-database approaches this by having scalar results (aggregate, count, first, firstOrDefault etc) return promises which much be awaited, and for obtaining lists of results, the ```collect``` method must be used. The ```collect``` method returns a ```Promise<Array<T>>``` type.

| operation | description |
| ---    | ---         |
| aggregate&lt;U&gt;(func: (acc: U, value: T, index: number) =&gt; U, initial: U): Promise&lt;U&gt;  | Applies an accumulator function over a sequence.      |
| all(func: (value: T, index: number) =&gt; boolean): Promise&lt;boolean&gt;                   | Determines whether all the elements of a sequence satisfy a condition. |
| any(func: (value: T, index: number) =&gt; boolean): Promise&lt;boolean&gt;                   | Determines whether a sequence contains any elements that meet this criteria. |
| average(func: (value: T, index: number) =&gt; number): Promise&lt;number&gt;                 | Computes the average of a sequence of numeric values. |
| cast&lt;U&gt;(): IQueryable&lt;U&gt;                                                            | preforms a type cast from the source type T to U. Only useful to typescript. |
| collect(): Promise&lt;Array&lt;T&gt;&gt;                                                        | Collects the results of this queryable into a array. |
| concat(queryable: IQueryable&lt;T&gt;): IQueryable&lt;T&gt;                                     | Concatenates two queryable sequences returning a new queryable that enumerates the first, then the second. |
| count(): Promise&lt;number&gt;                                                            | Returns the number of elements in a sequence. |
| distinct(): IQueryable&lt;T&gt;                                                           | Returns distinct elements from a sequence by using the default equality comparer to compare values. |
| each(func: (value: T, index: number) =&gt; void): Promise&lt;any&gt;                         | Enumerates each element in this sequence. |
| elementAt(index: number): Promise&lt;T&gt;                                                | Returns the element at the specified index, if no element exists, reject. |
| elementAtOrDefault(index: number): Promise&lt;T&gt;                                       | Returns the element at the specified index, if no element exists, resolve undefined. |
| first(): Promise&lt;T&gt;                                                                 | Returns the first element. if no element exists, reject. |
| firstOrDefault(): Promise&lt;T&gt;                                                        | Returns the first element. if no element exists, resolve undefined. |
| intersect(queryable: IQueryable&lt;T&gt;): IQueryable&lt;T&gt;                                  | Produces the set intersection of two sequences by using the default equality comparer to compare values. |
| last(): Promise&lt;T&gt;                                                                  | Returns the last element in this sequence. if empty, reject. |
| lastOrDefault(): Promise&lt;T&gt;                                                         | Returns the last element in this sequence. if empty, resolve undefined. |
| orderBy&lt;U&gt;(func: (value: T) =&gt; U): IQueryable&lt;T&gt;                                    | Sorts the elements of a sequence in ascending order according to a key. |
| orderByDescending&lt;U&gt;(func: (value: T) =&gt; U): IQueryable&lt;T&gt;                          | Sorts the elements of a sequence in descending order according to a key. |
| reverse(): IQueryable&lt;T&gt;                                                            | Inverts the order of the elements in a sequence. |
| select&lt;U&gt;(func: (value: T, index: number) =&gt; U): IQueryable&lt;U&gt;                      | Projects each element of a sequence into a new form. |
| selectMany&lt;U&gt;(func: (value: T, index: number) =&gt; Array&lt;U&gt;): IQueryable&lt;U&gt;           | Projects each element of a sequence to an IEnumerable&lt;T&gt; and combines the resulting sequences into one sequence. |
| single(func: (value: T, index: number) =&gt; boolean): Promise&lt;T&gt;                      | Returns the only element of a sequence that satisfies a specified condition. |
| singleOrDefault(func: (value: T, index: number) =&gt; boolean): Promise&lt;T&gt;             | Returns the only element of a sequence that satisfies a specified condition or null if no such element exists. |
| skip(count: number): IQueryable&lt;T&gt;                                                  | Bypasses a specified number of elements in a sequence and then returns the remaining elements. |
| sum(func: (value: T, index: number) =&gt; number): Promise&lt;number&gt;                     | Computes the sum of the sequence of numeric values. |
| take(count: number): IQueryable&lt;T&gt;                                                   | Returns a specified number of contiguous elements from the start of a sequence. |
| where(func: (value: T, index: number) =&gt; boolean): IQueryable&lt;T&gt;                     | Filters a sequence of values based on a predicate. |

### licence

MIT