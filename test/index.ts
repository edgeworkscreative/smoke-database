import {Database} from "../src/index"




const database = new Database("db0")

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
  let store = database.store<any>("customers2")
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

async function updateAsBlob() {
  let createBlob = (size: number): Blob => {
    let buf = new Array<string>(size)
    for(let i = 0; i < size; i++) {
      buf[i] = "0"
    } return new Blob([buf.join("")], {type: "text/plain"})
  }
  let store = database.store<any>("customers")
  let records = await store.orderBy(n => n.key).collect()
  records.forEach(record => {
    record.value = createBlob(1024)
    store.update(record)
  }); await database.submit()
}

async function readFirstAsBlob() {
  let store  = database.store<any>("customers")
  let record = await store.orderBy(n => n.key).first()
  let reader = new FileReader()
  reader.addEventListener("loadend", () =>{
    console.log(reader.result)
  })
  reader.readAsText(record.value, "utf8")
}
async function test() {
  let store = database.store<any>("customers")
  await deleteAll()
  await insert(10)
  await updateAll()
  //await updateAsBlob()
  //await readFirstAsBlob()
  await listAll()
  console.log(await store.count())
  console.log("done")
}

test()


