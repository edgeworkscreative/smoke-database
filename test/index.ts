import {Database} from "../src/index"

//Database.delete("db0")

const database = new Database({
    name: "db0",
    version: 3,
    stores: ["customers"]
})

async function deleteAll() {
  let store = database.store<any>("customers")
  let records = await store.collect()
  records.forEach(record => store.delete(record))
  await database.submit()
}

async function insert(count: number) {
  let store = database.store<any>("customers")
  for(let i = 0; i < count; i++) {
    store.insert({ firstname: "dave", lastname: "smith", value: i })
  } await database.submit()
}

async function listAll() {
  let store = database.store<any>("customers")
  let records = await store.orderBy(n => n.key).collect()
  records.forEach(record => {
    console.log(record)
  })
}

async function updateFirst() {
  let store = database.store<any>("customers")
  let record = await store.orderBy(n => n.value.value).first()
  record.value.firstname = "roger"
  store.update(record)
  await database.submit()
}

async function updateAll() {
  let store = database.store<any>("customers")
  let records = await store.orderBy(n => n.value.value).collect()
  records.forEach(record => {
    record.value.firstname = "roger"
    store.update(record)
  }); await database.submit()
}

async function test() {
  let store = database.store<any>("customers")
  //await deleteAll()
  //await insert(0)
  console.log("here")
  // await updateAll()
  await listAll()
  console.log(await store.count())
  console.log("done")
}

test()