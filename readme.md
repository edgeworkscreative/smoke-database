## smoke-db

Abstraction over indexeddb with LINQ style data queries and projection.

```javascript

// create database.
const database = new smokedb.Database("todo-database")

// insert records into "items" store.
await database.store("items")
  .insert({priority: "critical",  description: "make coffee."})
  .insert({priority: "medium",    description: "write documentation."})
  .insert({priority: "high"       description: "calculate 42."})
  .insert({priority: "critical",  description: "write code."})
  .insert({priority: "low",       description: "debug internet explorer."})
  .submit()

// read records from "items" store.
let criticals = await database.store ("items")
  .where (record  => record.value.priority === "critical")
  .select(record  => record.value)
  .collect()

```

### overview

smoke-db is a proof of concept database abstraction over indexeddb. smoke-db seeks to provide a simple
insert/update/delete/query interface against stores managed in indexeddb, and ultimately simplify  
indexeddb development for small projects.

smoke-db is a work in progress. 

### creating a database

The following code will create a database that attaches to a indexeddb database named ```my-crm```.

&gt; If the database does not already exist, smoke will automatically create the database on first request to read / write data.

```javascript
const database = new smokedb.Database("my-crm")
```

### insert records

The following code will insert records into the object store ```users```. If the store does not
exist, it will be automatically created.

&gt; All stores created by smoke are set to have auto incremented key values. These keys are numeric, and managed
by indexeddb. Callers can obtain the keys when querying records. (see record type)

```typescript
database
  .store("users")
  .insert({name: "dave",  age: 32})
  .insert({name: "alice", age: 29})
  .insert({name: "bob",   age: 42})
  .insert({name: "jones", age: 25})
  .submit()
```

### update records

To update a record, the caller must first query the record. The following preforms a query to 
read back the user ```dave```. The code then increments the users age, and updates.

```typescript
let user = await database.store("users")
  .where(record => record.value.name === "dave")
  .first()

user.value.age += 1;

await database.store("users")
  .update(user)
  .submit()
```

### deleting records

Deleting records works in a similar fashion to updating. First we read the record, followed by a call to delete.

&gt; It is possible to prevent the initial read by storing the key for the record. Calling ```delete({key: 123})``` works equally well.

```typescript
let user = await database.store("users")
  .where(record => record.value.name === "alice")
  .first()

await database.store("users")
  .delete(user)
  .submit()
```
### the record type

All read / query operations return the type ```Record<T>```. The record type looks as follows.

```typescript
interface Record<T> {
  key   : number 
  value : T         
}
```
Callers need to be mindful when filtering and mapping records, that the actual data for the record
is housed under the ```value``` property, with the auto-generated key available on the ```key```
property of the record.

### querying records

Records can be queried from stores. Smoke-DB provides a query interface fashioned on a asynchronous version of .NET ```IQueryable<T>``` interface.
In fact, the store type implements a version of ```IQueryable<Record<T>>```, meaning query functions are available on the store
directly. Like ```IQueryable<T>```, reading does not begin until the caller requests a result, allowing operations to be chained and
deferred. 

It is important to note that currently, ALL queries require a complete linear scan of the store, making 
stores with high record counts somewhat impractical. This aspect may be addressed in future.

The following table outlines the full list of queries available on stores.

| method | description |
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

### examples
count records in store.
```typescript
let count = await database.store("users").count()
```
map records to customers and collect the result as a array.
```typescript
let customers = await database.store("users")
  .select(record => record.value)
  .collect()
```
order customers by lastname
```typescript
let ordered = await database
  .store  ("users")
  .select (record => record.value)
  .orderBy(customer => customer.lastname)
  .collect()
```
compute the average age of customers
```typescript
let average = await database
  .store   ("users")
  .select  (record => record.value.age)
  .average (age => age)
```

### license

MIT



