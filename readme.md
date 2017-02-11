## smoke-db

Abstraction over indexeddb with LINQ style data queries and projection.

```javascript

async function example() {

  // attach to database.
  const database = new smokedb.Database({
      name    : "todo-database",
      version : 1,
      stores  : [
        "items"
      ]
  })

  // insert records.
  await database.store("items")
    .insert({priority: "critical",  description: "make coffee."})
    .insert({priority: "medium",    description: "write documentation."})
    .insert({priority: "high"       description: "calculate 42."})
    .insert({priority: "critical",  description: "write code."})
    .insert({priority: "low",       description: "debug internet explorer."})
    .submit()

  // query records.
  let urgent = await database
       .store ("customers")
       .where (record  => record.value.priority === "critical")
       .select(record  => record.value)
       .collect()
}
```

### overview

smoke-db is a proof of concept database abstraction over indexeddb. smoke-db seeks to provide a simple
insert/update/delete/query interface against stores managed in indexeddb, and ultimately simplify  
indexeddb development for small projects.

smoke-db is a work in progress. 

### creating a database

The following will create or attach to an existing database. the name and version given correlate to the information passed 
to the indexeddb ```openDB()``` function. The stores is a simple array of strings that list the stores this database manages.

Note: smoke-db does not make use of store indices. 

Note: stores created with smoke are automatically assign auto incremented keys.

```javascript
const database = new smokedb.Database({
    name    : "crm-db",
    version : 1,
    stores  : [
      "customers"
    ]
})
```

### insert records

The following will insert two records into the ```customers``` store. note that the inserts
are staged until a call to ```submit()``` is made. Allowing the caller to insert multiple 
records for a single ```submit()```. Internally, both inserts happen under the same 
indexeddb transation.

```typescript
let store = database
      .store("customers")
      .insert({name: "dave",  age: 32})
      .insert({name: "alice", age: 29})
      .submit()
```

### update records

To update a records, the caller must first query the record(s) being updated, update it, then write it back. The following updates daves ```age``` to 33.

```typescript
async function update() {
  let dave = await database
    .store("customers")
    .where(record => record.value.name === "dave")
    .first()
  
  dave.value.age = 33;
  
  await database
    .store("customers")
    .update(dave)
    .submit()
}

```

### deleting records

deleting records works in a similar fashion to updating. the code below deletes alice.

```typescript
async function delete() {
  let alice = await database
    .store("customers")
    .where(record => record.value.name === "alice")
    .first()
  
  await database
    .store("customers")
    .delete(dave)
    .submit()
}
```

### querying records

Records can be read back from stores. Smoke provides a query interface fashioned on asynchronous version of .NET IQueryable<T> interface.

Like IQueryable<T>, reading does not begin until the caller requests a result, allowing operations to be chained and
deferred. It is important to note that currently all queries require a complete linear scan of the store, making 
stores with high record counts somewhat impractical. This aspect may be addressed in future.

#### record type

Stores return records of the following type.

```typescript
interface Record<T> {
  key   : number 
  value : T         
}
```
Where ```value``` is the record and ```key``` is a auto incremented key.

#### examples
count records in store.
```typescript
let count = await database
    .store("customers")
    .count()
```
map records to customers and collect the result as a array.
```typescript
let customers = await database
    .store("customers")
    .select(record => record.value)
    .collect()
```
order customers by lastname
```typescript
let ordered = await database
  .store  ("customers")
  .select (record => record.value)
  .orderBy(customer => customer.lastname)
  .each   (customer => {
    console.log(customer)
  })
```
compute the average age of customers
```typescript
let average = await database
  .store   ("customers")
  .select  (record => record.value.age)
  .average (age => age)
```